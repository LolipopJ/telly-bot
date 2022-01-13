const { DataTypes } = require('sequelize')

module.exports = {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    serviceId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
    },
    serviceName: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    serviceConfig: {
        type: DataTypes.TEXT,
    },
    lastExecAt: {
        type: DataTypes.DATE,
    },
    haveExecTime: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
}
