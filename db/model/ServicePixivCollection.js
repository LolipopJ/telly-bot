const { DataTypes } = require('sequelize')

module.exports = {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    // Pixiv artwork ID. Example: 95400283 for for 95400283_p${picIndex}.${picType}
    picId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    // Artwork index. Example: 1 for ${pixivId}_p1.${picType}
    picIndex: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    // Artwork suffix type. Example: jpg for ${pixivId}_p${picIndex}.jpg
    picType: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    // Artwork size, MB
    picSize: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    // Artwork save date
    picCreatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    // Auther ID of artwork
    autherId: {
        type: DataTypes.INTEGER,
    },
    // Source download url of artwork.
    // Example: /2022/01/09/07/27/17 for /2022/01/09/07/27/17/${pixivId}_p${picIndex}.${picType}
    sourceUrl: {
        type: DataTypes.TEXT,
    },
    // Is artwork includes mutiple images?
    comicMode: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    // Is artwork not safe for work?
    r18: {
        type: DataTypes.BOOLEAN,
    },
}
