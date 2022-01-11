const {
    ToadScheduler,
    SimpleIntervalJob,
    AsyncTask,
} = require('toad-scheduler')

const bot = require('./bot')
const sequelize = require('../db/index')

const initService = async function () {
    // Connect bot
    globalThis.bot = await bot()

    // Init databse
    globalThis.sequelize = await sequelize()

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
        { hours: 1, runImmediately: true },
        taskForwardGithubIssueComment
    )

    scheduler.addSimpleIntervalJob(jobForwardGithubIssueComment)
}

module.exports = initService
