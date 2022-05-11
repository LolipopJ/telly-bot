const { readdir, stat } = require('fs/promises')
const path = require('path')

const config = require('../../../config').pixiv

const Sequelize = require('../../db/index')

const generateCollectionIndex = async function ({ updateAll = false } = {}) {
    const serviceName = 'Generate Collection Index'
    const bToMB = 1024 * 1024

    // File size with decimal places
    const fileSizeReservedDecimalPlace = 3
    const fileSizeReservedDecimalNum = 10 ** fileSizeReservedDecimalPlace

    const sequelize = await Sequelize()
    const ServicePixivCollection = sequelize.models.ServicePixivCollection
    const ServiceProcess = sequelize.models.ServiceProcess

    let collectionPaths = config.generateCollectionIndex.paths
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

module.exports = {
    generateCollectionIndex,
}
