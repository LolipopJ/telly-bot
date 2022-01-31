const { Octokit } = require('@octokit/core')

const Bot = require('../bot')
const Sequelize = require('../../db/index')

const config = require('../../config').github

const { parseMdToHtml, sleep } = require('../../assets/index')

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
            `Start to resolve issue: ${issueUrl}`
        )

        // Resolve user ID filter
        let issueUserId = issue.issueUserId
        if (issueUserId !== undefined && !Array.isArray(issueUserId)) {
            issueUserId = [issueUserId]
        }
        issueUserId.filter((id) => {
            if (id) return true
            else return false
        })

        // Init Github API query params
        const queryConfig = {
            issueUrl,
            issueUserId,
            forwardChannelId,
        }

        const perPage = 100
        let page = 0

        // Get initial query comment update since time
        const issueSince = issue.since
        let since = issueSince || new Date()
        const issueServiceInfo = await ServiceGithubIssueComment.findOne({
            where: queryConfig,
        })
        if (issueServiceInfo) {
            // The service record exists
            const lastUpdateCommentDate =
                issueServiceInfo.dataValues.lastUpdateCommentAt
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
            await ServiceGithubIssueComment.create(queryConfig)
        }
        since = new Date(since).toISOString()

        // Call the API to get the latest comments on the issue
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
        if (issueUserId.length > 0) {
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
                const sourceDate = `${new Date(
                    issueComment.updated_at
                ).toLocaleString()}`
                const sourceHtmlUrl = issueComment.html_url

                // Parse markdown to html
                const commentBody = parseMdToHtml(issueComment.body, 'tgbot')

                try {
                    // Send HTML type message
                    const sourceCaption = `${sourceDate} | <a href="${sourceHtmlUrl}">source</a>`
                    await bot.sendMessage(
                        forwardChannelId,
                        commentBody + sourceCaption,
                        {
                            parse_mode: 'HTML',
                            disable_web_page_preview: true,
                        }
                    )

                    console.log(
                        `Service info: ${serviceName}\n`,
                        `Send message successfully:\n${commentBody}`
                    )
                } catch (error) {
                    console.error(error)

                    // if failed, only send url link
                    console.warn(
                        `Service warning: ${serviceName}\n---\nSend parsed message failed:\n${commentBody}`
                    )

                    const sourceCaption = `\n\n${sourceDate}`
                    await bot.sendMessage(
                        forwardChannelId,
                        sourceHtmlUrl + sourceCaption,
                        {
                            disable_web_page_preview: true,
                        }
                    )

                    console.log(
                        `Service info: ${serviceName}\n`,
                        `Message url link has been sended: ${sourceHtmlUrl}\n---`
                    )
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
            ServiceGithubIssueComment.update(
                {
                    lastUpdateCommentAt,
                    lastExecServiceAt: new Date().toISOString(),
                },
                {
                    where: queryConfig,
                }
            )
        }

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
