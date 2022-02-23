const { Octokit } = require('@octokit/core')
const path = require('path')

const Bot = require('../bot')
const Sequelize = require('../../db/index')

const config = require('../../../config').github

const { parseMdToHtml, sleep, md2img } = require('../../assets/index')

// Init API requester
const octokitOptions = {}
const authToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN
if (authToken) {
    octokitOptions.auth = authToken
}
const octokit = new Octokit(octokitOptions)

// Forward Github issue comment service
const forwardGithubIssueComment = async function () {
    const serviceName = 'Forward Github Issue Comment'
    const issues = config.forwardIssueComment.task
    if (!Array.isArray(issues) || issues.length === 0) {
        console.log(
            `Service info: ${serviceName}\n`,
            'There is no configuration for fowarding the issue comment. You can add configurations in config.js.'
        )
        return
    }

    const bot = await Bot()
    const sequelize = await Sequelize()

    const ServiceGithubIssueComment = sequelize.models.ServiceGithubIssueComment
    const ServiceProcess = sequelize.models.ServiceProcess

    const execStartTime = new Date().getTime()
    console.log(`Service info: ${serviceName}\n`, `Start execute service.`)

    for (const issue of issues) {
        const owner = issue.owner
        const repo = issue.repo
        const issueNumber = issue.issueNumber
        const forwardChannelId = issue.forwardChannelId

        if (!owner || !repo || !issueNumber || !forwardChannelId) {
            console.error(
                `Service error: ${serviceName}\n`,
                'Your must set owner, repo, issueNumber and forwardChannelId in config.js.'
            )
            continue
        }

        const issueUrl = `${owner}/${repo}/issues/${issueNumber}`

        console.log(
            `Service info: ${serviceName}\n`,
            `Start to resolve issue: ${issueUrl}\n`,
            `Forwarded to chat (channel): ${forwardChannelId}`
        )

        // Resolve user ID array of comments to be reserved
        let issueUserId = issue.issueUserId || []
        if (!Array.isArray(issueUserId)) {
            issueUserId = [issueUserId].filter((id) => {
                if (id) return true
                else return false
            })
        }

        // Init service process query params
        const serviceProcessWhere = {
            serviceName,
            serviceConfig: JSON.stringify({
                issueUrl,
                issueUserId,
                forwardChannelId,
            }),
        }

        // Get initial query comment update since time
        const issueSince = issue.since
        let since = issueSince || new Date()
        let serviceProcessInfo = await ServiceProcess.findOne({
            where: serviceProcessWhere,
        })
        if (serviceProcessInfo) {
            // The service record exists
            const lastUpdateCommentDate =
                serviceProcessInfo.dataValues.lastExecAt
            if (lastUpdateCommentDate) {
                // Use comment last update date added by 1 ms as since
                since = new Date(lastUpdateCommentDate).getTime() + 1
            } else {
                console.warn(
                    `Service warning: ${serviceName}\n`,
                    `Can\'t get the last update date of issue ${issueUrl} in database`
                )
            }
        } else {
            // The service record does not exist in the database, create a new one
            serviceProcessInfo = await ServiceProcess.create(
                serviceProcessWhere
            )
        }
        since = new Date(since).toISOString()
        const serviceProcessId = serviceProcessInfo.dataValues.id

        // Call the Github API to get the latest comments on the issue
        const perPage = 100
        let page = 0

        let issueComments = []
        while (issueComments.length === perPage * page) {
            ++page
            const res = await octokit.request(
                'GET /repos/{owner}/{repo}/issues/{issue_number}/comments',
                {
                    owner,
                    repo,
                    issue_number: issueNumber,
                    since,
                    per_page: perPage,
                    page,
                }
            )
            issueComments = issueComments.concat(res.data)
        }

        // Only keep comments for the specified userId
        if (Array.isArray(issueUserId) && issueUserId.length > 0) {
            issueComments = issueComments.filter((comment) => {
                const commentUserId = comment.user.id
                if (issueUserId.includes(commentUserId)) {
                    return true
                } else {
                    return false
                }
            })
        }

        // Forward the comment to the specified Telegram channel
        if (issueComments.length > 0) {
            let lastUpdateCommentAt = new Date(0).toISOString()
            for (const issueComment of issueComments) {
                const sourceDate = new Date(
                    issueComment.updated_at
                ).toLocaleString()
                const sourceHtmlUrl = issueComment.html_url

                // Parse markdown to image
                const commentBody = issueComment.body
                const commentImageRes = await md2img(
                    commentBody,
                    path.resolve(__dirname, 'github_images'),
                    { width: 700 }
                )

                // Parse markdown to html
                const commentParsedBody = parseMdToHtml(commentBody, 'tgbot')

                // Query forwarded comment in chat (channel) if exists
                let isModifyMessage = false
                let messageId
                const commentId = issueComment.id
                const githubIssueCommentWhere = {
                    ServiceProcessId: serviceProcessId,
                    commentId,
                }
                const githubIssueCommentInfo =
                    await ServiceGithubIssueComment.findOne({
                        where: githubIssueCommentWhere,
                    })
                if (githubIssueCommentInfo) {
                    isModifyMessage = true
                    messageId = githubIssueCommentInfo.dataValues.messageId
                }

                try {
                    // Send HTML type message
                    const sourceCaption = `${sourceDate} | <a href="${sourceHtmlUrl}">source</a>`
                    const messageBody = commentParsedBody + sourceCaption

                    if (isModifyMessage) {
                        // Modify existing message
                        await bot.editMessageText(messageBody, {
                            chat_id: forwardChannelId,
                            message_id: messageId,
                            parse_mode: 'HTML',
                            disable_web_page_preview: true,
                        })

                        console.log(
                            `Service info: ${serviceName}\n`,
                            `Edit existing message successfully:\n${messageBody}`
                        )
                    } else {
                        // Send new message
                        const sendMessageInfo = await bot.sendMessage(
                            forwardChannelId,
                            messageBody,
                            {
                                parse_mode: 'HTML',
                                disable_web_page_preview: true,
                            }
                        )

                        messageId = sendMessageInfo.message_id

                        console.log(
                            `Service info: ${serviceName}\n`,
                            `Send message successfully:\n${messageBody}`
                        )
                    }
                } catch (error) {
                    console.error(error)

                    // if failed, only send url link
                    console.warn(
                        `Service warning: ${serviceName}\n---\nSend parsed message failed.`
                    )

                    const sourceCaption = `\n\n${sourceDate}`
                    const messageBody = sourceHtmlUrl + sourceCaption

                    if (isModifyMessage) {
                        // Modify existing message
                        await bot.editMessageText(messageBody, {
                            chat_id: forwardChannelId,
                            message_id: messageId,
                            disable_web_page_preview: true,
                        })

                        console.log(
                            `Service info: ${serviceName}\n`,
                            `Edit existing message through url link successfully:\n${messageBody}`
                        )
                    } else {
                        // Send new message
                        const sendMessageInfo = await bot.sendMessage(
                            forwardChannelId,
                            messageBody,
                            {
                                disable_web_page_preview: true,
                            }
                        )

                        messageId = sendMessageInfo.message_id

                        console.log(
                            `Service info: ${serviceName}\n`,
                            `Message url link has been sended: ${messageBody}\n---`
                        )
                    }
                }

                // Save sended message info to database
                if (!isModifyMessage && messageId !== undefined) {
                    await ServiceGithubIssueComment.create({
                        ServiceProcessId: serviceProcessId,
                        commentId,
                        messageId,
                    })
                }

                // Get the last update date of comments
                const issueCommentUpdatedAt = issueComment.updated_at
                if (issueCommentUpdatedAt > lastUpdateCommentAt) {
                    lastUpdateCommentAt = issueCommentUpdatedAt
                }

                // Sleep 1000 ms
                await sleep(1000)
            }

            // Update database records
            ServiceProcess.update(
                {
                    lastExecAt: lastUpdateCommentAt,
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
            `Resolve issue ${issueUrl} successfully! Bot has forwarded ${issueComments.length} new comments.`
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

module.exports = {
    forwardGithubIssueComment,
}
