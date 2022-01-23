const { Op } = require('sequelize')
const Sequelize = require('../../db/index')

const randomGetPixivCollection = async function ({ r18 = false }) {
    try {
        const sequelize = await Sequelize()
        const ServicePixivCollection = sequelize.models.ServicePixivCollection

        let isR18
        if (r18) {
            isR18 = [{ r18: true }]
        } else {
            isR18 = [{ r18: false }, { r18: null }]
        }

        const artwork = await ServicePixivCollection.findOne({
            order: sequelize.random(),
            where: { [Op.or]: isR18 },
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
