const TelegramBot = require('node-telegram-bot-api')

const Sequelize = require('../db/index')

const generateQrcode = require('./api/generate-qrcode')
const qqMusicApi = require('./api/qq-music-api')
const randomGetPixivCollection = require('./api/random-get-pixiv-collection')
const todayOfHistory = require('./api/today-of-history')

const { sendPixivPhoto } = require('./action/send-pixiv-photo')

const {
    randomKaomoji,
    transformKbToMb,
    resolvePixivDataObject,
} = require('../assets/index')

const config = require('../../config')

const token = process.env.TELEGRAM_BOT_TOKEN

let instance

const connectTelegramBot = async () => {
    if (!instance) {
        let requestOptions
        if (process.env.PROXY_SOCKS5_HOST && process.env.PROXY_SOCKS5_PORT) {
            const Agent = require('socks5-https-client/lib/Agent')
            requestOptions = {
                agentClass: Agent,
                agentOptions: {
                    socksHost: process.env.PROXY_SOCKS5_HOST,
                    socksPort: parseInt(process.env.PROXY_SOCKS5_PORT),
                    socksUsername: process.env.PROXY_SOCKS5_USERNAME,
                    socksPassword: process.env.PROXY_SOCKS5_PASSWORD,
                },
            }
        } else if (
            process.env.PROXY_HTTP_PROTOCOL &&
            process.env.PROXY_HTTP_HOST &&
            process.env.PROXY_HTTP_PORT
        ) {
            const proxyUsername = process.env.PROXY_HTTP_USERNAME
            const proxyPassword = process.env.PROXY_HTTP_PASSWORD
            const proxyUser =
                proxyUsername && proxyPassword
                    ? `${proxyUsername}:${proxyPassword}@`
                    : ''
            requestOptions = {
                proxy: `${process.env.PROXY_HTTP_PROTOCOL}://${proxyUser}${
                    process.env.PROXY_HTTP_HOST
                }:${parseInt(process.env.PROXY_HTTP_PORT)}`,
            }
        }

        const bot = new TelegramBot(token, {
            request: requestOptions,
        })

        try {
            await bot.setWebHook(`${process.env.WEBHOOK_HOST}/bot${token}`)
            console.log('Set Telegram bot webhook successfully!')
        } catch (error) {
            console.error(`Unable to set Telegram bot webhook:`, error)
            throw error
        }

        bot.on('message', (msg) => {
            const from = msg.from
            const userId = from.id
            const username = `${from.username} (${from.first_name} ${from.last_name})`
            const chat = msg.chat
            const chatId = chat.id
            const dateTime = msg.date * 1000
            const text = msg.text
            console.log(
                'Bot received message:\n',
                `UESR: ${username}\n`,
                `UESR ID: ${userId}\n`,
                `CHAT ID: ${chatId}\n`,
                `DATE: ${new Date(dateTime).toISOString()}\n`,
                `MESSAGE: ${text}`
            )
        })

        bot.onText(/^\/start$/, (msg) => {
            bot.sendMessage(msg.chat.id, 'Hi, this is Telly Bot!')
        })

        bot.onText(/^\/get_me$/, (msg) => {
            const from = msg.from
            const chat = msg.chat
            // const date = new Date(msg.date).toISOString()
            let message = `From:\n\tid: ${from.id}\n\tname: ${from.first_name} ${from.last_name}\n\tusername: ${from.username}`
            if (from.id !== chat.id) {
                message += `\n\nChat:\n\tid: ${chat.id}`
            }
            bot.sendMessage(chat.id, message)
        })

        bot.onText(/^\/qrcode/, (msg) => {
            const text = msg.text
            const chatId = msg.chat.id

            const res = generateQrcode({ text })
            if (res.ok === true) {
                bot.sendPhoto(chatId, res.data)
            } else {
                bot.sendMessage(chatId, res.error)
            }
        })

        bot.onText(/^\/random_pixiv/, async (msg) => {
            if (!config.pixiv.generateCollectionIndex.enable) return

            const chatId = msg.chat.id
            const chatText = msg.text
            const apiName = 'Random Get Pixiv Collection'

            let r18 = false
            if (/_r18$/.test(chatText)) {
                r18 = true
            }

            const res = await randomGetPixivCollection({ r18 })
            if (res.ok === true) {
                // Send placeholder message
                const placeholderMessage = await bot.sendMessage(
                    chatId,
                    `${randomKaomoji()} Geeeeting a random ${
                        r18 ? 'NSFW ' : ''
                    }Pixiv artwork ...`
                )

                const data = resolvePixivDataObject(res.data)

                console.log(
                    `Bot API info: ${apiName}\n`,
                    `Sending Pixiv artwork name: ${data.picName}`
                )

                // Send Pixiv photo
                try {
                    await sendPixivPhoto(bot, chatId, data)
                } catch (err) {
                    console.error(`Bot API error: ${apiName}\n`, err)

                    bot.sendMessage(
                        chatId,
                        'Get random pixiv artwork failed. You may try to call it again later!'
                    )
                }

                // Remove placeholder message
                bot.deleteMessage(chatId, placeholderMessage.message_id)
            } else {
                console.error(`Bot API error: ${apiName}\n`, res.error)

                bot.sendMessage(
                    chatId,
                    'Get random pixiv artwork failed. You may try to call it again later!'
                )
            }
        })

        bot.onText(/^\/pixiv_count$/, async (msg) => {
            const apiName = 'Get Pixiv artworks count'
            const chatId = msg.chat.id

            const sequelize = await Sequelize()
            const ServicePixivCollection =
                sequelize.models.ServicePixivCollection

            try {
                const artworksCount = await ServicePixivCollection.count()
                let message = `We have ${artworksCount} Pixiv artwork collections for you now!`

                const artworksR18Count = await ServicePixivCollection.count({
                    where: { r18: true },
                })
                if (artworksR18Count > 0) {
                    message += `\nThere are ${
                        artworksCount - artworksR18Count
                    } all-age artworks, and ${artworksR18Count} NSFW ones.`
                }

                await bot.sendMessage(chatId, message)
            } catch (error) {
                console.error(`Bot API error: ${apiName}\n`, error)
            }
        })

        bot.onText(/^\/today_of_history$/, async (msg) => {
            const apiName = 'Get Today of History'
            const chatId = msg.chat.id

            const res = await todayOfHistory()
            if (res.ok === true) {
                bot.sendMessage(chatId, res.data)
            } else {
                console.error(`Bot API error: ${apiName}\n`, res.error)

                bot.sendMessage(
                    chatId,
                    'Get today of history failed. You may try to call it again later!'
                )
            }
        })

        bot.onText(/^\/random_music$/, async (msg) => {
            const apiName = 'Random Get QQ Music Collection'
            const chatId = msg.chat.id

            const res = await qqMusicApi.randomGetQQMusicCollection()
            if (res.ok === true) {
                let message = ''
                let disableWebPagePreview = true

                const musicInfo = res.data
                const singerInfo = musicInfo.singer
                const albumInfo = musicInfo.album
                const mvInfo = musicInfo.mv

                const musicName = musicInfo.name
                const musicNameUrl = encodeURIComponent(musicName)
                const musicMId = musicInfo.mid
                const musicPublicTime = musicInfo.time_public
                const musicMvVId = mvInfo.vid

                let singerMessage = ''
                for (const singer of singerInfo) {
                    singerMessage += `${singer.name} `
                }

                // Music info
                message += `<b>${musicName}</b>\n\nSinger: ${singerMessage}\nAlbum: ${albumInfo.name}\nPublic time: ${musicPublicTime}`

                // MV url
                if (musicMvVId) {
                    const mvUrlRes = await qqMusicApi.getQQMusicMvUrl(
                        musicMvVId
                    )
                    if (mvUrlRes.ok) {
                        const mvUrlList = mvUrlRes.data

                        message += '\n'
                        for (const mvUrlItem of mvUrlList) {
                            message += `\n<a href="${
                                mvUrlItem.freeflow_url[0]
                            }">MV - ${transformKbToMb(
                                mvUrlItem.fileSize
                            )} MB</a>`
                        }

                        // MV will be expired in 24 hours
                        message += `\n<i>MV url will be expired at: <u>${new Date(
                            new Date().getTime() + 86400000
                        ).toISOString()}</u></i>`
                    }
                }

                // Play url
                const playUrlRes = await qqMusicApi.getQQMusicPlayUrl(musicMId)
                if (playUrlRes.ok) {
                    const playUrl = playUrlRes.data
                    message += `\n\n<a href="${playUrl}">Play music</a>`
                    disableWebPagePreview = false
                }

                // Search url
                const qqMusicSearchUrl = `https://y.qq.com/n/ryqq/search?w=${musicNameUrl}`
                const netEaseCloudMusicSearchUrl = `https://music.163.com/#/search/m/?s=${musicNameUrl}`
                const spotifySearchUrl = `https://open.spotify.com/search/${musicNameUrl}`
                message += `\n\nSearch: <a href="${qqMusicSearchUrl}">QQ Music</a> | <a href="${netEaseCloudMusicSearchUrl}">NetEase Cloud Music</a> | <a href="${spotifySearchUrl}">Spotify</a>`

                console.log(
                    `Bot API info: ${apiName}\n`,
                    `Send message:\n${message}`
                )

                bot.sendMessage(chatId, message, {
                    parse_mode: 'HTML',
                    disable_web_page_preview: disableWebPagePreview,
                })
            } else {
                console.error(`Bot API error: ${apiName}\n`, res.error)

                bot.sendMessage(
                    chatId,
                    'Get random music failed. You may try to call it again later!'
                )
            }
        })

        bot.onText(/^\/music_count$/, async (msg) => {
            const apiName = 'Get music count'
            const chatId = msg.chat.id

            try {
                const musicCount = await qqMusicApi.getMusicCount()
                const message = `We have ${musicCount} songs for you now!`

                await bot.sendMessage(chatId, message)
            } catch (error) {
                console.error(`Bot API error: ${apiName}\n`, error)
            }
        })

        bot.on('polling_error', (error) => {
            console.error(error)
        })

        bot.on('webhook_error', (error) => {
            console.error(error)
        })

        bot.on('error', (error) => {
            console.error(error)
        })

        instance = bot
    }

    return instance
}

module.exports = connectTelegramBot
