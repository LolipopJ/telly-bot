const kaomoji = require('./kaomoji')
const kaomojiLeng = kaomoji.length

const randomKaomoji = function () {
    const randomIndex = Math.floor(Math.random() * kaomojiLeng)
    return kaomoji[randomIndex]
}

module.exports = { randomKaomoji }
