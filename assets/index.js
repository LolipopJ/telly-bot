const { marked } = require('marked')

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

const parseMdToHtml = function (mdText, parseMode = 'default') {
    let parsedResult = marked.parse(mdText)

    if (parseMode && parseMode === 'tgbot') {
        // Remove <p> tags
        parsedResult = parsedResult.replace(/<p>/g, '').replace(/<\/p>/g, '\n')
    }

    return parsedResult
}

module.exports = {
    randomKaomoji,
    transformObjectToParams,
    transformKbToMb,
    parseMdToHtml,
}
