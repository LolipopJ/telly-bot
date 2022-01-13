const { Sequelize } = require('sequelize')

const pgsqlConfig = require('../config').database.postgresql

const updateOrCreate = require('./utils/updateOrCreate')

const serviceGithubIssueCommentModel = require('./model/ServiceGithubIssueComment')
const servicePixivCollectionModel = require('./model/ServicePixivCollection')
const serviceProcessModel = require('./model/serviceProcess')

const options = {
    timezone: pgsqlConfig.timezone || '+08:00',
}

let instance

const connectDababase = async () => {
    if (!instance) {
        const sequelize = new Sequelize(
            `postgres://${pgsqlConfig.user}:${pgsqlConfig.password}@${pgsqlConfig.host}:${pgsqlConfig.port}/${pgsqlConfig.database}`,
            options
        )

        try {
            await sequelize.authenticate()
            console.log(
                `Connection with ${pgsqlConfig.database} has been established successfully.`
            )
        } catch (error) {
            console.error(
                `Unable to connect to the database ${pgsqlConfig.database}:`,
                error
            )
            throw error
        }

        sequelize.define(
            'ServiceGithubIssueComment',
            serviceGithubIssueCommentModel
        )
        sequelize.define('ServicePixivCollection', servicePixivCollectionModel)
        sequelize.define('ServiceProcess', serviceProcessModel)

        try {
            await sequelize.sync({ alter: true })
            console.log('All models were synchronized successfully.')
        } catch (error) {
            console.error(
                `Unable to connect to the database ${pgsqlConfig.database}:`,
                error
            )
            throw error
        }

        sequelize.updateOrCreate = updateOrCreate

        instance = sequelize
    }

    return instance
}

module.exports = connectDababase
