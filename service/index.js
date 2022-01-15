const {
    ToadScheduler,
    SimpleIntervalJob,
    AsyncTask,
} = require('toad-scheduler')

const githubTask = require('./task/github')
const pixivTask = require('./task/pixiv')

const config = require('../config')

const initService = async function () {
    // Init scheduler tasks
    const taskForwardGithubIssueComment = new AsyncTask(
        'Forward Github Issue Comment',
        async () => {
            await githubTask.forwardGithubIssueComment()
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

    const taskGenerateCollectionIndex = new AsyncTask(
        'Generate Pixiv Collection Index',
        async () => {
            await pixivTask.generateCollectionIndex()
        },
        (error) => {
            console.error(error)
        }
    )
    const jobGenerateCollectionIndex = new SimpleIntervalJob(
        {
            seconds: config.pixiv.generateCollectionIndex.duration,
            runImmediately: true,
        },
        taskGenerateCollectionIndex
    )

    // Run services
    const scheduler = new ToadScheduler()
    if (config.github.forwardIssueComment.enable) {
        scheduler.addSimpleIntervalJob(jobForwardGithubIssueComment)
    }
    if (config.pixiv.generateCollectionIndex.enable) {
        scheduler.addSimpleIntervalJob(jobGenerateCollectionIndex)
    }
}

module.exports = initService
