const { readdir, readFile } = require('fs/promises')
const path = require('path')
const yaml = require('js-yaml')

const Bot = require('../bot')
const Sequelize = require('../../db/index')

const config = require('../../config').hexo

const forwardHexoBlog = async function () {
    const serviceName = 'Forward Hexo Blog'

    const bot = await Bot()

    const sequelize = await Sequelize()
    const ServiceHexoBlog = sequelize.models.ServiceHexoBlog
    const ServiceProcess = sequelize.models.ServiceProcess

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
        const unresolvedBlogFiles = []
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
            const sourceCreatedTime = new Date(frontMatter.date).getTime()
            const sourceUpdatedTime = frontMatter.updated
                ? new Date(frontMatter.updated).getTime()
                : 0
            if (sourceCreatedTime > lastForwardHexoBlogTime) {
                // New blog file is created
                frontMatter.isCreated = true
            } else if (sourceUpdatedTime > lastForwardHexoBlogTime) {
                // Old blog file is updated
                frontMatter.isUpdated = true
            } else {
                // Blog file has been resolved, skip
                continue
            }
            frontMatter.createdTime = sourceCreatedTime
            frontMatter.updatedTime = sourceUpdatedTime
            frontMatter.filename = sourceFilename.substring(
                0,
                sourceFilename.lastIndexOf('.')
            )

            unresolvedBlogFiles.push(frontMatter)
        }

        // Forward unresolved blog info to the specified Telegram channel
        let resolveBlogFilesAt = 0
        const unresolvedBlogFilesLength = unresolvedBlogFiles.length

        if (unresolvedBlogFilesLength > 0) {
            for (const unresolvedBlogFile of unresolvedBlogFiles) {
                const blogCreatedDate = new Date(unresolvedBlogFile.date)
                const blogUpdatedDate = new Date(unresolvedBlogFile.updated)

                const blogUrlCreatedDate = new Date(unresolvedBlogFile.date)
                blogUrlCreatedDate.setDate(
                    blogUrlCreatedDate.getDate() + offsetDay
                )
                const blogUrlCreatedYear = blogUrlCreatedDate.getFullYear()
                const blogUrlCreatedMonth = String(
                    blogUrlCreatedDate.getMonth() + 1
                ).padStart(2, '0')
                const blogUrlCreatedDay = String(
                    blogUrlCreatedDate.getDate()
                ).padStart(2, '0')

                const blogFilename = unresolvedBlogFile.filename

                const blogUrl = `${baseUrl}/${blogUrlCreatedYear}/${blogUrlCreatedMonth}/${blogUrlCreatedDay}/${blogFilename}`

                const blogTitle = unresolvedBlogFile.title
                const blogCategories = unresolvedBlogFile.categories || []
                const blogTags = unresolvedBlogFile.tags || []

                const blogMsgTags = new Array(blogTags.length)
                for (let i = 0; i < blogMsgTags.length; i++) {
                    blogMsgTags[i] = `\\#${blogTags[i]}`
                }

                const blogAbstract =
                    unresolvedBlogFile.abstract ||
                    unresolvedBlogFile.summary ||
                    unresolvedBlogFile.description

                const messageCaption = `\n\n[source](${blogUrl}) \\| powered by [Hexo](https://hexo.io/)`
                const messageOptions = {
                    parse_mode: 'MarkdownV2',
                    disable_web_page_preview: true,
                }

                let message
                if (unresolvedBlogFile.isCreated) {
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
                } else if (unresolvedBlogFile.isUpdated) {
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

                const createdTime = unresolvedBlogFile.createdTime
                const updatedTime = unresolvedBlogFile.updatedTime
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

                try {
                    const hexoBlog = {
                        serviceProcessId,
                        filename: blogFilename,
                        permalink: blogUrl,
                        blogTitle,
                        blogCreatedAt: blogCreatedDate,
                        blogCategories,
                        blogTags,
                    }

                    if (updatedTime > createdTime) {
                        hexoBlog.blogUpdatedAt = blogUpdatedDate
                    } else {
                        hexoBlog.blogUpdatedAt = blogCreatedDate
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
            }
        }

        // Update database record
        if (unresolvedBlogFilesLength > 0) {
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
            `Forward ${unresolvedBlogFiles.length} new Hexo blog files in path ${filePath} to channel.`
        )
    }

    console.log(
        `Service info: ${serviceName}\n`,
        `Execute service successfully!`
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
