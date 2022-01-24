const kaomoji = require('./kaomoji')
const kaomojiLeng = kaomoji.length

const randomKaomoji = function () {
    const randomIndex = Math.floor(Math.random() * kaomojiLeng)
    return kaomoji[randomIndex]
}

const transformObjectToParams = function (obj) {
    return JSON.stringify(obj)
        .replace(/:/g, '=')
        .replace(/,/g, '&')
        .replace(/{/g, '?')
        .replace(/}/g, '')
        .replace(/"/g, '')
}

module.exports = { randomKaomoji, transformObjectToParams }
