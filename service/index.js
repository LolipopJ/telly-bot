const {
    ToadScheduler,
    SimpleIntervalJob,
    AsyncTask,
} = require('toad-scheduler')

const Sequelize = require('../db/index')
const Bot = require('./bot')

const githubTask = require('./task/github')
const hexoTask = require('./task/hexo')
const pixivTask = require('./task/pixiv')

const config = require('../config')

const initService = async function () {
    // Init database and bot
    try {
        await Sequelize()
    } catch (error) {
        console.error('Init service failed:\nDatabase startup failed.')
        throw error
    }

    try {
        await Bot()
    } catch (error) {
        console.error('Init service failed:\nTelegram Bot startup failed.')
        throw error
    }

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

    const taskForwardHexoBlog = new AsyncTask(
        'Forward Hexo Blog',
        async () => {
            await hexoTask.forwardHexoBlog()
        },
        (error) => {
            console.error(error)
        }
    )
    const jobForwardHexoBlog = new SimpleIntervalJob(
        {
            seconds: config.hexo.forwardHexoBlog.duration,
            runImmediately: true,
        },
        taskForwardHexoBlog
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
    if (config.hexo.forwardHexoBlog.enable) {
        scheduler.addSimpleIntervalJob(jobForwardHexoBlog)
    }
    if (config.pixiv.generateCollectionIndex.enable) {
        scheduler.addSimpleIntervalJob(jobGenerateCollectionIndex)
    }
}

module.exports = initService
