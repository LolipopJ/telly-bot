const { DataTypes } = require('sequelize')

module.exports = {
    // The ID of the forwarding Github Issue service
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    // Url of Github Issue. Example: ${USERNAME}/${REPOSITORY}/issues/${ISSUE_NUM}
    issueUrl: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    // Only forward the comments of these users, empty means forward all
    issueUserId: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
    },
    // The ID of the channel to which the comment was forwarded
    forwardChannelId: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    // The last date the issue comments were updated
    lastUpdateCommentAt: {
        type: DataTypes.DATE,
    },
    // Date the service was last run
    lastExecServiceAt: {
        type: DataTypes.DATE,
    },
}
