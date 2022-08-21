const { readdir, stat } = require('fs/promises')
const path = require('path')
const { Op } = require('sequelize')

const Sequelize = require('../../db/index')
const Bot = require('../bot')

const { sendPixivPhoto } = require('../action/send-pixiv-photo')

const { TELEGRAM_BOT_SEND_PHOTO_MAX_SIZE } = require('../../constants')
const { seekLucky, resolvePixivDataObject } = require('../../assets')

const bToMB = 1024 * 1024

/**
 * 根据 Config 配置的 Pixiv 文件夹，更新数据库信息
 */
const generateCollectionIndex = async function (
    generateCollectionIndexConfig,
    { updateAll = false } = {}
) {
    const serviceName = 'Generate Collection Index'

    // File size with decimal places
    const fileSizeReservedDecimalPlace = 3
    const fileSizeReservedDecimalNum = 10 ** fileSizeReservedDecimalPlace

    const sequelize = await Sequelize()
    const ServicePixivCollection = sequelize.models.ServicePixivCollection
    const ServiceProcess = sequelize.models.ServiceProcess

    let collectionPaths = generateCollectionIndexConfig.paths
    if (!collectionPaths) {
        console.error(
            `Service error: ${serviceName}\n`,
            'You need to specify paths of your collection.'
        )
        return
    }
    if (!Array.isArray(collectionPaths)) {
        collectionPaths = [collectionPaths]
    }

    // Get filenames in collection paths
    let allFiles = []
    for (const collectionPathObj of collectionPaths) {
        const collectionPath = collectionPathObj.path || collectionPathObj
        const isR18 = collectionPathObj.r18 || false

        let files = []
        try {
            files = files.concat(await readdir(collectionPath))
        } catch (err) {
            console.error(
                `Service error: ${serviceName}\n`,
                "Read Pixiv artworks' filename failed."
            )
            throw err
        }

        // Only keep files with Pixiv naming style
        const reg = /^(\d+)_p(\d+)(_master1200)?.(jpg|png|gif)$/
        files = files.filter((filename) => {
            return reg.test(filename)
        })

        // Get file stat and resolve file info
        for (let i = 0; i < files.length; i++) {
            const filename = files[i]
            const filePath = path.join(collectionPath, filename)

            const filenameExecRegResult = reg.exec(filename)
            const picId = Number(filenameExecRegResult[1])
            const picIndex = Number(filenameExecRegResult[2])
            const picType = filenameExecRegResult[4]

            const picStat = await stat(filePath)
            const picSize =
                Math.floor(
                    (picStat.size / bToMB) * fileSizeReservedDecimalNum
                ) / fileSizeReservedDecimalNum // MB
            const picCreatedAt = picStat.mtimeMs // ms

            const comicMode = picIndex > 0 ? true : false

            files[i] = {
                picName: filename,
                picId,
                picIndex,
                picType,
                picSize,
                picCreatedAt,
                comicMode,
                r18: isR18,
            }
        }

        if (!updateAll) {
            // Only keep files that recently saved
            const serviceProcess = await ServiceProcess.findOne({
                where: { serviceName, serviceConfig: collectionPath },
            })
            if (serviceProcess) {
                // Only update or create Pixiv artwork that saved after last time this service is done
                let lastUpdateIndexTime = serviceProcess.dataValues.lastExecAt
                if (lastUpdateIndexTime) {
                    lastUpdateIndexTime = new Date(
                        lastUpdateIndexTime
                    ).getTime()
                    files = files.filter((pic) => {
                        return pic.picCreatedAt > lastUpdateIndexTime
                    })
                }
            } else {
                await ServiceProcess.create({
                    serviceName,
                    serviceConfig: collectionPath,
                })
            }
        }

        allFiles = allFiles.concat(files)
    }

    const updateIndexAt = new Date().toISOString()

    // Update or create pic index
    for (const picFile of allFiles) {
        await sequelize.updateOrCreate(
            ServicePixivCollection,
            {
                picId: picFile.picId,
                picIndex: picFile.picIndex,
            },
            picFile
        )

        console.log(
            `Service info: ${serviceName}\n`,
            `New Pixiv artwork index has been updated or created: ${picFile.picName}`
        )
    }

    // Update service process record
    const allFilesLength = allFiles.length
    if (allFilesLength > 0) {
        ServiceProcess.update(
            {
                lastExecAt: updateIndexAt,
            },
            {
                where: { serviceName },
            }
        )
    }
    ServiceProcess.increment('haveExecTime', { where: { serviceName } })

    const artworksCount = await ServicePixivCollection.count()
    console.log(
        `Service info: ${serviceName}\n`,
        `Execute service successfully! ${allFilesLength} artworks have been saved or updated in database!\n`,
        `There are ${artworksCount} artworks available in database now!`
    )
}

/**
 * 转发数据库收藏的 Pixiv 图像到 Telegram 频道
 */
const forwardPixivCollections = async (forwardPixivCollectionsConfig) => {
    const serviceName = 'Forward Pixiv Collections'
    const forwardChannelId = forwardPixivCollectionsConfig.forwardChannelId

    // 这一次抽取到的是……
    let result = ''
    let forwardCount = 0
    const luckyScore = seekLucky()
    if (luckyScore === 100) {
        // 1%
        result = '👑 U · G 👑'
        forwardCount = 10
    } else if (luckyScore >= 97) {
        // 3%
        result = '💎 U · R 💎'
        forwardCount = 5
    } else if (luckyScore >= 86) {
        // 11%
        result = 'SSR 🥇'
        forwardCount = 3
    } else if (luckyScore >= 56) {
        // 30%
        result = 'SR 🥈'
        forwardCount = 2
    } else {
        // 55%
        result = 'R 🥉'
        forwardCount = 1
    }

    const sequelize = await Sequelize()
    const bot = await Bot()

    const ServicePixivCollection = sequelize.models.ServicePixivCollection
    const artworks = await ServicePixivCollection.findAll({
        order: sequelize.random(),
        limit: forwardCount,
        where: {
            picSize: { [Op.lt]: TELEGRAM_BOT_SEND_PHOTO_MAX_SIZE },
            r18: { [Op.or]: [false, null] },
        },
    })

    const resolvedArtworks = artworks.dataValues.map((artwork) => {
        return resolvePixivDataObject(artwork)
    })

    await bot.sendMessage(
        forwardChannelId,
        `铛铛铛铛，今天抽取到的是…… ${result} !! 将随机抽取 ${forwardCount} 张健康（存疑）、治愈（大概）的二次元插画!! （如发送失败或重复或已删除，请见谅 😭`,
        {
            disable_web_page_preview: true,
        }
    )

    for (const resolvedArtwork of resolvedArtworks) {
        try {
            await sendPixivPhoto(bot, forwardChannelId, resolvedArtwork)
        } catch (err) {
            console.error(err)
        }
    }

    // TODO: 对于总结日，发表额外的内容
    // 指定日期总结过去一周的行为数据
    const conclusionDayOfWeek =
        forwardPixivCollectionsConfig?.conclusionDayOfWeek ?? 0
    const todayOfWeek = new Date().getDay()
    const isConclusionDay = Number(conclusionDayOfWeek) === Number(todayOfWeek)
    if (isConclusionDay) {
    }
}

module.exports = {
    generateCollectionIndex,
    forwardPixivCollections,
}
