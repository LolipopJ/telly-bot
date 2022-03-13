const { Sequelize } = require('sequelize')

const pgsqlConfig = require('../../config').database.postgresql

const updateOrCreate = require('./utils/update-or-create')

const serviceGithubIssueCommentModel = require('./model/ServiceGithubIssueComment')
const serviceHexoBlogModel = require('./model/ServiceHexoBlog')
const servicePixivCollectionModel = require('./model/ServicePixivCollection')
const serviceProcessModel = require('./model/ServiceProcess')

const options = {
    timezone: pgsqlConfig.timezone || '+08:00',
    logging: false,
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

        const ServiceGithubIssueComment = sequelize.define(
            'ServiceGithubIssueComment',
            serviceGithubIssueCommentModel
        )
        const ServiceHexoBlog = sequelize.define(
            'ServiceHexoBlog',
            serviceHexoBlogModel
        )
        const ServicePixivCollection = sequelize.define(
            'ServicePixivCollection',
            servicePixivCollectionModel
        )
        const ServiceProcess = sequelize.define(
            'ServiceProcess',
            serviceProcessModel
        )

        ServiceProcess.hasMany(ServiceGithubIssueComment)
        ServiceGithubIssueComment.belongsTo(ServiceProcess)

        ServiceProcess.hasMany(ServiceHexoBlog)
        ServiceHexoBlog.belongsTo(ServiceProcess)

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
