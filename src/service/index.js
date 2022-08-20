const {
    ToadScheduler,
    SimpleIntervalJob,
    LongIntervalJob,
    AsyncTask,
} = require('toad-scheduler')
const NodeScheduler = require('node-schedule')

const Sequelize = require('../db/index')
const Bot = require('./bot')
const QQMusic = require('./qqMusic')

const githubTask = require('./task/github')
const hexoTask = require('./task/hexo')
const pixivTask = require('./task/pixiv')

const config = require('../../config')

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
                'If this situation is continually caused, try to disable QQ Music service.'
            )
            throw error
        }
    }

    // Init and run toad-scheduler services
    const forwardGithubIssueCommentConfig = config.github?.forwardIssueComment
    const forwardHexoBlogConfig = config.hexo?.forwardHexoBlog
    const generateCollectionIndexConfig = config.pixiv?.generateCollectionIndex

    const scheduler = new ToadScheduler()

    if (forwardGithubIssueCommentConfig?.enable) {
        const taskForwardGithubIssueComment = new AsyncTask(
            'Forward Github Issue Comment',
            async () => {
                await githubTask.forwardGithubIssueComment(
                    forwardGithubIssueCommentConfig
                )
            },
            (error) => {
                console.error(error)
            }
        )
        const jobForwardGithubIssueComment = new SimpleIntervalJob(
            {
                seconds: forwardGithubIssueCommentConfig.duration,
                runImmediately: true,
            },
            taskForwardGithubIssueComment
        )

        scheduler.addIntervalJob(jobForwardGithubIssueComment)
    }

    if (forwardHexoBlogConfig?.enable) {
        const taskForwardHexoBlog = new AsyncTask(
            'Forward Hexo Blog',
            async () => {
                await hexoTask.forwardHexoBlog(forwardHexoBlogConfig)
            },
            (error) => {
                console.error(error)
            }
        )
        const jobForwardHexoBlog = new SimpleIntervalJob(
            {
                seconds: forwardHexoBlogConfig.duration,
                runImmediately: true,
            },
            taskForwardHexoBlog
        )

        scheduler.addIntervalJob(jobForwardHexoBlog)
    }

    if (generateCollectionIndexConfig?.enable) {
        const taskGenerateCollectionIndex = new AsyncTask(
            'Generate Pixiv Collection Index',
            async () => {
                await pixivTask.generateCollectionIndex(
                    generateCollectionIndexConfig,
                    { updateAll: false }
                )
            },
            (error) => {
                console.error(error)
            }
        )
        const jobGenerateCollectionIndex = new SimpleIntervalJob(
            {
                seconds: generateCollectionIndexConfig.duration,
                runImmediately: true,
            },
            taskGenerateCollectionIndex
        )

        // By default, server will reload all Pixiv artworks every 72.5 durations
        const taskGenerateCollectionIndexUpdateAll = new AsyncTask(
            'Generate Pixiv Collection Index Update All',
            async () => {
                await pixivTask.generateCollectionIndex(
                    generateCollectionIndexConfig,
                    { updateAll: true }
                )
            },
            (error) => {
                console.error(error)
            }
        )
        const jobGenerateCollectionIndexUpdateAll = new LongIntervalJob(
            {
                seconds: generateCollectionIndexConfig.duration * 72.5,
                runImmediately: false,
            },
            taskGenerateCollectionIndexUpdateAll
        )

        scheduler.addIntervalJob(jobGenerateCollectionIndex)
        scheduler.addIntervalJob(jobGenerateCollectionIndexUpdateAll)
    }

    // Init and run node-scheduler services
    const forwardPixivCollectionsConfig = config.pixiv?.forwardPixivCollections
    if (
        generateCollectionIndexConfig?.enable &&
        forwardPixivCollectionsConfig?.enable
    ) {
        const jobForwardPixivCollections = NodeScheduler.scheduleJob(
            {
                hour: forwardPixivCollectionsConfig.execHourOfDay,
            },
            () =>
                pixivTask.forwardPixivCollections(forwardPixivCollectionsConfig)
        )
    }
}

module.exports = initService
