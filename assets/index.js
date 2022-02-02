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
        // Remove <p> and <pre> tags
        parsedResult = parsedResult
            .replace(/<p.*?>/g, '')
            .replace(/<\/p>/g, '\n')
            .replace(/<\/pre>/g, '')

        // Transform <h*> tags to <b>
        parsedResult = parsedResult
            .replace(/<h..*?>/g, '<b>')
            .replace(/<\/h.>/g, '</b>\n')

        // Romove <ol> <ul> <li> tags
        parsedResult = parsedResult
            .replace(/<ol.*?>/g, '')
            .replace(/<ul.*?>/g, '')
            .replace(/<li.*?>/g, '')
            .replace(/<\/ol>/g, '\n')
            .replace(/<\/ul>/g, '\n')
            .replace(/<\/li>/g, '')

        // Transform <blockquote> tags to <i>
        parsedResult = parsedResult
            .replace(/<blockquote.*?>/g, '<i>')
            .replace(/<\/blockquote>/g, '</i>\n')
    }

    return parsedResult
}

const sleep = function (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

module.exports = {
    randomKaomoji,
    transformObjectToParams,
    transformKbToMb,
    parseMdToHtml,
    sleep,
}
