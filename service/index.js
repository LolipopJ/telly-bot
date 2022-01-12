const {
    ToadScheduler,
    SimpleIntervalJob,
    AsyncTask,
} = require('toad-scheduler')

const bot = require('./bot')
const sequelize = require('../db/index')

const config = require('../config')

const initService = async function () {
    // Init databse
    globalThis.sequelize = await sequelize()

    // Connect bot
    globalThis.bot = await bot()

    // Run services
    const githubService = require('./github')

    const scheduler = new ToadScheduler()
    const taskForwardGithubIssueComment = new AsyncTask(
        'Forward Github Issue Comment',
        async () => {
            await githubService.forwardGithubIssueComment()
        },
        (error) => {
            console.error(error)
        }
    )
    const jobForwardGithubIssueComment = new SimpleIntervalJob(
        {
            seconds: config.github.forwardIssueComment.duration,
            runImmediately: true,
        },
        taskForwardGithubIssueComment
    )

    scheduler.addSimpleIntervalJob(jobForwardGithubIssueComment)
}

module.exports = initService
