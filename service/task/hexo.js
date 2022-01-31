const { readdir, readFile } = require('fs/promises')
const path = require('path')
const yaml = require('js-yaml')

const Bot = require('../bot')
const Sequelize = require('../../db/index')

const { sleep } = require('../../assets/index')

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
        const filePath = task.path
        const serviceProcessWhere = {
            serviceName,
            serviceConfig: filePath,
        }

        const { baseUrl, offsetDay, forwardChannelId, since } = task

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
                    serviceProcessId,
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
                        serviceProcessId,
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

                const messageCaption = `\n\n[source](${blogUrl}) \\| powered by [Hexo](https://hexo.io/)`
                const messageOptions = {
                    parse_mode: 'MarkdownV2',
                    disable_web_page_preview: true,
                }

                let message
                if (updatedOrCreatedBlog.isCreated) {
                    const blogCategories = updatedOrCreatedBlog.categories
                    const blogMsgTags = new Array(
                        updatedOrCreatedBlog.tags.length
                    )
                    for (let i = 0; i < blogMsgTags.length; i++) {
                        blogMsgTags[i] = `\\#${blogTags[i]}`
                    }

                    const blogAbstract =
                        updatedOrCreatedBlog.abstract ||
                        updatedOrCreatedBlog.summary ||
                        updatedOrCreatedBlog.description

                    let messageBody = `\n\n「${blogTitle}」\nCategories: ${blogCategories.join(
                        ' / '
                    )}\nTags: ${blogMsgTags.join(
                        ' '
                    )}\nCreated at: ${blogCreatedDate.toISOString()}`

                    if (blogAbstract) {
                        messageBody += `\nAbstract: ${blogAbstract}`
                    }

                    message =
                        'Published a new blog:' +
                        messageBody
                            .replace(/\-/g, '\\-')
                            .replace(/\./g, '\\.') +
                        messageCaption
                } else if (updatedOrCreatedBlog.isUpdated) {
                    const messageBody = `\n\n「${blogTitle}」\nCreated at: ${blogCreatedDate.toISOString()}\nUpdated at: ${blogUpdatedDate.toISOString()}`

                    message =
                        'Updated an existing blog:' +
                        messageBody
                            .replace(/\-/g, '\\-')
                            .replace(/\./g, '\\.') +
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
                        `${message}`
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
                    where: serviceProcessWhere,
                }
            )
        }

        ServiceProcess.increment('haveExecTime', { where: serviceProcessWhere })

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
    }

    return result
}

module.exports = { forwardHexoBlog }
