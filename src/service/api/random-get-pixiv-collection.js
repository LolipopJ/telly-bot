const { Op } = require('sequelize')
const Sequelize = require('../../db/index')

const randomGetPixivCollection = async function ({ r18 = false } = {}) {
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

        return {
            ok: true,
            data: artwork.dataValues,
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
