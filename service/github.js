const { Octokit } = require('@octokit/core')

const config = require('../config').github

const bot = globalThis.bot
const sequelize = globalThis.sequelize

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
    const issues = config.issueComment
    if (!Array.isArray(issues) || issues.length === 0) {
        console.log(
            `Service info: ${serviceName}\n`,
            'There is no configuration for fowarding the issue comment. You can add configurations in config.js.'
        )
        return
    }

    const ServiceGithubIssueComment = sequelize.models.ServiceGithubIssueComment

    const execStartTime = new Date().getTime()
    console.log(`Start execute service: ${serviceName}`)

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
        console.log(`Start to resolve issue: ${issueUrl}`)

        let issueUserId = issue.issueUserId
        if (issueUserId !== undefined && !Array.isArray(issueUserId)) {
            issueUserId = [issueUserId]
        }

        const queryConfig = {
            issueUrl,
            issueUserId,
            forwardChannelId,
        }

        const perPage = 100
        let page = 0

        // Get initial query comment update since time
        let since = new Date().toISOString()
        const issueServiceInfo = await ServiceGithubIssueComment.findOne({
            where: queryConfig,
        })
        if (issueServiceInfo) {
            const issueServiceData = issueServiceInfo.dataValues
            if (issueServiceData.lastUpdateCommentAt) {
                since = issueServiceData.lastUpdateCommentAt
            } else {
                console.error(
                    `Service error: ${serviceName}\n`,
                    `Can\'t get the last update date of issue ${issueUrl} in database\n`,
                    'To fix this, you need to delete the data record of this service, and then set a new start date (since) in config.js if you have already forward messages.'
                )
            }
        } else {
            // The record does not exist in the database, create a new one
            await ServiceGithubIssueComment.create(queryConfig)
            if (issue.since) since = new Date(issue.since).toISOString()
        }

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
            let lastUpdateCommentAt = since
            for (const issueComment of issueComments) {
                const sourceDate = `${new Date(
                    issueComment.updated_at
                ).toLocaleString()}`
                try {
                    const sourceCaption = `\n\n${sourceDate} \\| [source](${issueComment.html_url})`
                    await bot.sendMessage(
                        forwardChannelId,
                        issueComment.body + sourceCaption,
                        {
                            parse_mode: 'MarkdownV2',
                            disable_web_page_preview: true,
                        }
                    )
                    console.log(
                        `Send message successfully:\n${issueComment.body}`
                    )
                } catch (error) {
                    // console.log(error)
                    console.error(
                        `Service warning: ${serviceName}\n---\nParse message failed:\n${issueComment.body}`
                    )
                    const sourceCaption = `\n\n${sourceDate}`
                    await bot.sendMessage(
                        forwardChannelId,
                        issueComment.html_url + sourceCaption,
                        {
                            disable_web_page_preview: true,
                        }
                    )
                    console.log('Message url link has been sended!\n---')
                }

                // Get the last update date of comments
                const issueCommentUpdatedAt = issueComment.updated_at
                if (issueCommentUpdatedAt > lastUpdateCommentAt) {
                    lastUpdateCommentAt = issueCommentUpdatedAt
                }
            }

            // Update database records
            await ServiceGithubIssueComment.update(
                {
                    lastUpdateCommentAt: lastUpdateCommentAt,
                    lastExecServiceAt: new Date().toISOString(),
                },
                {
                    where: queryConfig,
                }
            )
        }

        console.log(
            `Resolve issue ${issueUrl} successfully! Bot has forwarded ${issueComments.length} new comments.`
        )
    }

    const execEndTime = new Date().getTime()
    console.log(
        `Completed service execution ${serviceName} in ${
            execEndTime - execStartTime
        } ms.`
    )
}

module.exports = {
    forwardGithubIssueComment,
}
