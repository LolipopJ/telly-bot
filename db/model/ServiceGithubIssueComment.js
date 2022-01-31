const { DataTypes } = require('sequelize')

module.exports = {
    // The ID of forwarded comment
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    // The ID of Github issue comment
    commentId: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    // The ID of telegram chat (channel) message
    messageId: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
}
