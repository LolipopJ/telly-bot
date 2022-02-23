const { marked } = require('marked')
const { convert2img } = require('mdimg')

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
    // Preview: https://marked.js.org/demo/
    let parsedResult = marked.parse(mdText)

    if (parseMode && parseMode === 'tgbot') {
        // Telegram Bot only supports: <b> <i> <u> <s> <span>
        // <a> <code> <pre> and so on
        // Full list see: https://core.telegram.org/bots/api#html-style

        // TO FIX: skip replace strings in <pre> code block
        parsedResult = parsedResult
            // Remove <p> tags
            .replace(/<p>/g, '')
            .replace(/<\/p>/g, '\n')
            // Transform <h[1-6]> tags to <b>
            .replace(/<h[1-6].*?>/g, '<b>')
            .replace(/<\/h[1-6]>/g, '</b>\n')
            // Romove <ol> <ul> <li> tags
            .replace(/<ol>/g, '')
            .replace(/<ul>/g, '')
            .replace(/<li>/g, '')
            .replace(/<\/ol>/g, '\n')
            .replace(/<\/ul>/g, '\n')
            .replace(/<\/li>/g, '')
            // Transform <blockquote> tags to <i>
            .replace(/<blockquote>/g, '<i>')
            .replace(/<\/blockquote>/g, '</i>')
            // Transform <hr> tags
            .replace(/<hr>/g, '======\n')

        // Transform <img> tags to <a>
        const imgReg = /<img.*?(?:>|\/>)/g
        const imgSrcReg = /src=[\'\"]?([^\'\"]*)[\'\"]?/
        const imgAltReg = /alt=[\'\"]?([^\'\"]*)[\'\"]?/
        const imgArr = parsedResult.match(imgReg) || []
        if (imgArr.length > 0) {
            const imgSrcArr = []
            const imgAltArr = []
            for (const img of imgArr) {
                const imgSrcRegRes = img.match(imgSrcReg)
                imgSrcArr.push(imgSrcRegRes[1])

                const imgAltRegRes = img.match(imgAltReg) || []
                let imgAltText = 'Picture'
                if (imgAltRegRes.length >= 2 && imgAltRegRes[1]) {
                    imgAltText = imgAltRegRes[1]
                }
                imgAltArr.push(imgAltText)
            }

            const splitedParsedResult = parsedResult.split(imgReg)
            let resolvedParsedResult = splitedParsedResult[0]
            for (let i = 1; i < splitedParsedResult.length; i++) {
                resolvedParsedResult += `<a href="${imgSrcArr[i - 1]}">${
                    imgAltArr[i - 1]
                }</a>`
                resolvedParsedResult += splitedParsedResult[i]
            }
            parsedResult = resolvedParsedResult
        }
    }

    return parsedResult
}

const sleep = function (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

const md2img = async function (
    input,
    output,
    {
        type,
        width,
        encoding,
        quality,
        htmlTemplate,
        cssTemplate = 'github',
    } = {}
) {
    const convertRes = await convert2img({
        mdText: input,
        outputFilename: output,
        type,
        width,
        encoding,
        quality,
        htmlTemplate,
        cssTemplate,
    })
    return convertRes
}

module.exports = {
    randomKaomoji,
    transformObjectToParams,
    transformKbToMb,
    parseMdToHtml,
    sleep,
    md2img,
}
