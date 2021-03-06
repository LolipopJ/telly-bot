const { DataTypes } = require('sequelize')

module.exports = {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    filename: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    permalink: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    blogTitle: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    blogCreatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    blogUpdatedAt: {
        type: DataTypes.DATE,
    },
    blogCategories: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
    },
    blogTags: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
    },
}
