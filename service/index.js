const {
    ToadScheduler,
    SimpleIntervalJob,
    AsyncTask,
} = require('toad-scheduler')

const Sequelize = require('../db/index')
const Bot = require('./bot')
const QQMusic = require('./qqMusic')

const githubTask = require('./task/github')
const hexoTask = require('./task/hexo')
const pixivTask = require('./task/pixiv')

const config = require('../config')

const initService = async function () {
    // Init database and bot
    try {
        await Sequelize()
        console.log('Connect to database server successfully!')
    } catch (error) {
        console.error('Init service failed:\n', 'Database startup failed.')
        throw error
    }

    try {
        await Bot()
        console.log('Connect to Telegram Bot server successfully!')
    } catch (error) {
        console.error('Init service failed:\n', 'Telegram Bot startup failed.')
        throw error
    }

    // Init optional service executors
    if (config.qqMusic?.enable) {
        try {
            await QQMusic()
            console.log('Connect to QQ Music API server successfully!')
        } catch (error) {
            console.error(
                'Connect to QQ Music API server failed.\n',
                'If this situation is continuly caused, try to disable QQ Music service.'
            )
            throw error
        }
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
            await pixivTask.generateCollectionIndex({ updateAll: false })
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

    const taskGenerateCollectionIndexUpdateAll = new AsyncTask(
        'Generate Pixiv Collection Index Update All',
        async () => {
            await pixivTask.generateCollectionIndex({ updateAll: true })
        },
        (error) => {
            console.error(error)
        }
    )
    // By default, server will read all files every 48.5 durations
    // And the duration of regenerating collection index is no more than 6 days (518400 seconds)
    const generateCollectionIndexUpdateAllSeconds =
        config.pixiv.generateCollectionIndex.duration * 48.5
    const jobGenerateCollectionIndexUpdateAll = new SimpleIntervalJob(
        {
            seconds:
                generateCollectionIndexUpdateAllSeconds < 518400
                    ? generateCollectionIndexUpdateAllSeconds
                    : 518400,
            runImmediately: false,
        },
        taskGenerateCollectionIndexUpdateAll
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
        scheduler.addSimpleIntervalJob(jobGenerateCollectionIndexUpdateAll)
    }
}

module.exports = initService
