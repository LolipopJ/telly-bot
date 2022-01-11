const { Sequelize } = require('sequelize')
const pgsqlConfig = require('../config').database.postgresql

const serviceGithubIssueCommentModel = require('./model/ServiceGithubIssueComment')

const options = {
    timezone: pgsqlConfig.timezone || '+08:00',
}

const connectDababase = async () => {
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

    return sequelize
}

module.exports = connectDababase
