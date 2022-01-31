const { readdir, readFile } = require('fs/promises')
const path = require('path')
const yaml = require('js-yaml')

const Bot = require('../bot')
const Sequelize = require('../../db/index')

const { parseMdToHtml, sleep } = require('../../assets/index')

const config = require('../../config').hexo

const forwardHexoBlog = async function () {
    const serviceName = 'Forward Hexo Blog'

    const bot = await Bot()

    const sequelize = await Sequelize()
    const ServiceHexoBlog = sequelize.models.ServiceHexoBlog
    const ServiceProcess = sequelize.models.ServiceProcess

    const execStartTime = new Date().getTime()
    console.log(`Service info: ${serviceName}\n`, `Start execute service.`)

    for (const task of config.forwardHexoBlog.task) {
        const { baseUrl, offsetDay, forwardChannelId, since, abstractLines } =
            task
        const filePath = task.path

        const serviceProcessWhere = {
            serviceName,
            serviceConfig: JSON.stringify({ filePath, forwardChannelId }),
        }

        // Query last time of forwarding Hexo blog
        let lastForwardHexoBlogTime = since || new Date()
        let serviceProcess = await ServiceProcess.findOne({
            where: serviceProcessWhere,
        })
        if (serviceProcess) {
            const lastForwardHexoBlogAt = serviceProcess.dataValues.lastExecAt
            if (lastForwardHexoBlogAt) {
                lastForwardHexoBlogTime = lastForwardHexoBlogAt
            }
        } else {
            serviceProcess = await ServiceProcess.create(serviceProcessWhere)
        }
        lastForwardHexoBlogTime = new Date(lastForwardHexoBlogTime).getTime()
        const serviceProcessId = serviceProcess.dataValues.id

        // Read source filenames
        let sourceFilenames
        try {
            sourceFilenames = await readdir(filePath)
        } catch (err) {
            console.error(
                `Service error: ${serviceName}\n`,
                "Read Hexo blogs' filename failed."
            )
            throw err
        }

        // Only keep Markdown type files
        const isMarkdownType = /\.md$/
        sourceFilenames = sourceFilenames.filter((filename) => {
            return isMarkdownType.test(filename)
        })

        // Read unresolved markdown blog files
        const updatedOrCreatedBlogs = []
        for (const sourceFilename of sourceFilenames) {
            const sourceFilePath = path.join(filePath, sourceFilename)

            let sourceFile
            try {
                sourceFile = await readFile(sourceFilePath, {
                    encoding: 'utf8',
                })
            } catch (err) {
                console.error(
                    `Service error: ${serviceName}\n`,
                    `Read file ${sourceFilePath} failed.`
                )
                continue
            }

            const frontMatter = getHexoBlogFrontMatter(sourceFile)

            const blogCreatedDate = new Date(frontMatter.date)
            const blogUpdatedDate = frontMatter.updated
                ? new Date(frontMatter.updated)
                : new Date(frontMatter.date)
            const blogCreatedTime = blogCreatedDate.getTime()
            const blogUpdatedTime = blogUpdatedDate.getTime()

            const blogFilename = sourceFilename.substring(
                0,
                sourceFilename.lastIndexOf('.')
            )

            const blogUrlCreatedDate = new Date(frontMatter.date)
            blogUrlCreatedDate.setDate(blogUrlCreatedDate.getDate() + offsetDay)
            const blogUrlCreatedYear = blogUrlCreatedDate.getFullYear()
            const blogUrlCreatedMonth = String(
                blogUrlCreatedDate.getMonth() + 1
            ).padStart(2, '0')
            const blogUrlCreatedDay = String(
                blogUrlCreatedDate.getDate()
            ).padStart(2, '0')
            const blogUrl = `${baseUrl}/${blogUrlCreatedYear}/${blogUrlCreatedMonth}/${blogUrlCreatedDay}/${blogFilename}`

            const blogCategories = frontMatter.categories || []
            const blogTags = frontMatter.tags || []

            // Update blog info stored in database
            try {
                const hexoBlog = {
                    ServiceProcessId: serviceProcessId,
                    filename: blogFilename,
                    permalink: blogUrl,
                    blogTitle: frontMatter.title,
                    blogCreatedAt: blogCreatedDate,
                    blogUpdatedAt: blogUpdatedDate,
                    blogCategories,
                    blogTags,
                }

                await sequelize.updateOrCreate(
                    ServiceHexoBlog,
                    {
                        ServiceProcessId: serviceProcessId,
                        filename: blogFilename,
                    },
                    hexoBlog
                )
            } catch (error) {
                console.error(
                    `Service error: ${serviceName}\n`,
                    'Update datebase failed. Hexo blog:\n',
                    `${hexoBlog}`
                )
            }

            if (blogCreatedTime > lastForwardHexoBlogTime) {
                // New blog file is created
                frontMatter.isCreated = true
            } else if (blogUpdatedTime > lastForwardHexoBlogTime) {
                // Old blog file is updated
                frontMatter.isUpdated = true
            } else {
                // Blog file has been resolved, skip
                continue
            }

            frontMatter.createdTime = blogCreatedTime
            frontMatter.updatedTime = blogUpdatedTime
            frontMatter.filename = blogFilename
            frontMatter.blogUrl = blogUrl
            frontMatter.categories = blogCategories
            frontMatter.tags = blogTags

            // Only forward newly created or updated blogs
            updatedOrCreatedBlogs.push(frontMatter)
        }

        // Forward blog info to the specified Telegram channel
        let resolveBlogFilesAt = 0
        const updatedOrCreatedBlogsLeng = updatedOrCreatedBlogs.length

        if (updatedOrCreatedBlogsLeng > 0) {
            for (const updatedOrCreatedBlog of updatedOrCreatedBlogs) {
                const blogCreatedDate = new Date(updatedOrCreatedBlog.date)
                const blogUpdatedDate = new Date(updatedOrCreatedBlog.updated)
                const blogTitle = updatedOrCreatedBlog.title
                const blogUrl = updatedOrCreatedBlog.blogUrl

                const messageCaption = `\n\n<a href="${blogUrl}">source</a> | powered by <a href="https://hexo.io/">Hexo</a>`
                const messageOptions = {
                    parse_mode: 'HTML',
                    disable_web_page_preview: true,
                }

                let message
                if (updatedOrCreatedBlog.isCreated) {
                    const blogCategories = updatedOrCreatedBlog.categories
                    const blogCategoriesMsg = new Array(blogCategories.length)
                    for (let i = 0; i < blogCategoriesMsg.length; i++) {
                        blogCategoriesMsg[i] = `#${blogCategories[i]}`
                    }

                    const blogTags = updatedOrCreatedBlog.tags
                    const blogTagsMsg = new Array(blogTags.length)
                    for (let i = 0; i < blogTagsMsg.length; i++) {
                        blogTagsMsg[i] = `#${blogTags[i]}`
                    }

                    const autoAbstract = getHexoBlogAutoAbstract(
                        updatedOrCreatedBlog.article
                    )
                    const blogAbstract =
                        updatedOrCreatedBlog.abstract ||
                        updatedOrCreatedBlog.summary ||
                        updatedOrCreatedBlog.description ||
                        autoAbstract

                    let messageBody = `\n\n<b>${blogTitle}</b>\n\nCategories: ${blogCategoriesMsg.join(
                        ' / '
                    )}\nTags: ${blogTagsMsg.join(
                        ' '
                    )}\nCreated at: ${blogCreatedDate.toISOString()}\nUpdated at: ${blogUpdatedDate.toISOString()}`

                    if (blogAbstract) {
                        messageBody += `\nAbstract: \n「${blogAbstract}」`
                    }

                    message =
                        'Published a new blog:' + messageBody + messageCaption
                } else if (updatedOrCreatedBlog.isUpdated) {
                    const messageBody = `\n\n<b>${blogTitle}</b>\n\nCreated at: ${blogCreatedDate.toISOString()}\nUpdated at: ${blogUpdatedDate.toISOString()}`

                    message =
                        'Updated an existing blog:' +
                        messageBody +
                        messageCaption
                } else {
                    continue
                }

                const createdTime = updatedOrCreatedBlog.createdTime
                const updatedTime = updatedOrCreatedBlog.updatedTime
                const latestTime =
                    updatedTime > createdTime ? updatedTime : createdTime

                try {
                    await bot.sendMessage(
                        forwardChannelId,
                        message,
                        messageOptions
                    )

                    console.log(
                        `Service info: ${serviceName}\n`,
                        'Post to Telegram Channel successfully! Message:\n',
                        `${message}`
                    )

                    if (latestTime > resolveBlogFilesAt) {
                        resolveBlogFilesAt = latestTime
                    }
                } catch (error) {
                    console.error(
                        `Service error: ${serviceName}\n`,
                        'Post to Telegram Channel failed. Message:\n',
                        `${message}\n`,
                        `Error: ${error}`
                    )
                }

                // Sleep 1000 ms
                await sleep(1000)
            }

            // Update database record
            ServiceProcess.update(
                {
                    lastExecAt: resolveBlogFilesAt,
                },
                {
                    where: { id: serviceProcessId },
                }
            )
        }

        // Increment the time of execution
        ServiceProcess.increment('haveExecTime', {
            where: { id: serviceProcessId },
        })

        console.log(
            `Service info: ${serviceName}\n`,
            `Forward ${updatedOrCreatedBlogs.length} new Hexo blog files in path ${filePath} to channel.`
        )
    }

    const execEndTime = new Date().getTime()
    console.log(
        `Service info: ${serviceName}\n`,
        `Execute service successfully!\n`,
        `Completed service execution ${serviceName} in ${
            execEndTime - execStartTime
        } ms.`
    )
}

const getHexoBlogFrontMatter = function (content) {
    let result = {}

    const contentArray = content.split(/---+\r?\n/g)
    const contentArrayLeng = contentArray.length
    if (contentArrayLeng >= 3) {
        const contentInfo = contentArray[1]
        result = yaml.load(contentInfo)

        let article = ''
        for (let i = 2; i < contentArrayLeng; i++) {
            article += contentArray[i] + '\n'
        }
        result.article = article
    }

    return result
}

const getHexoBlogAutoAbstract = function (article, autoAbstractLines = 5) {
    let result

    if (article) {
        const abstractLines = Number(autoAbstractLines)
        if (abstractLines && abstractLines > 0) {
            const articleHtml = parseMdToHtml(article, 'tgbot')
            const articleHtmlArray = articleHtml.split(/\r?\n/g)

            let autoAbstract = ''
            for (let i = 0; i < autoAbstractLines; i++) {
                autoAbstract += articleHtmlArray[i] + '\n'
            }

            result = autoAbstract.trim()
        }
    }

    return result
}

module.exports = { forwardHexoBlog }
