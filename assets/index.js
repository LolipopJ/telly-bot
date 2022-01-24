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

const transformKbToMb = function (kb, fixed = 2) {
    return (kb / 1024 / 1024).toFixed(fixed)
}

module.exports = { randomKaomoji, transformObjectToParams, transformKbToMb }
