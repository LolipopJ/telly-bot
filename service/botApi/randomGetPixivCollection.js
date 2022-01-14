const Sequelize = require('../../db/index')

const randomGetPixivCollection = async function () {
    try {
        const sequelize = await Sequelize()
        const ServicePixivCollection = sequelize.models.ServicePixivCollection

        // Gain the total number of Pixiv artworks
        const artworksCount = await ServicePixivCollection.count()

        // Generate a random value
        const randomArtworkId = Math.floor(Math.random() * artworksCount) + 1

        // Get random artwork
        const artwork = await ServicePixivCollection.findOne({
            where: { id: randomArtworkId },
        })

        // Resolve artwork object
        const data = artwork.dataValues

        const picId = data.picId
        const picIndex = data.picIndex
        const picType = data.picType

        data.picName = `${picId}_p${picIndex}.${picType}`
        data.picNameMD = `${picId}\\_p${picIndex}\\.${picType}`
        data.picUrl = `https://www.pixiv.net/artworks/${picId}`

        let picProxyUrlParam
        if (data.comicMode || picIndex > 0) {
            picProxyUrlParam = `${picId}-${picIndex + 1}.${picType}`
        } else {
            picProxyUrlParam = `${picId}.${picType}`
        }
        data.picProxyUrl = `https://pixiv.cat/${picProxyUrlParam}`

        return {
            ok: true,
            data,
            error: undefined,
        }
    } catch (error) {
        return {
            ok: false,
            data: undefined,
            error,
        }
    }
}

module.exports = randomGetPixivCollection
