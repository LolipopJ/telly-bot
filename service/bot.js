const TelegramBot = require('node-telegram-bot-api')

const Sequelize = require('../db/index')

const generateQrcode = require('./botApi/generateQrcode')
const randomGetPixivCollection = require('./botApi/randomGetPixivCollection')
const todayOfHistory = require('./botApi/todayOfHistory')

const { randomKaomoji } = require('../assets/index')

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

        bot.onText(/\/start/, (msg) => {
            bot.sendMessage(msg.chat.id, 'Hi, this is Telly Bot!')
        })

        bot.onText(/\/qrcode/, (msg) => {
            const text = msg.text
            const chatId = msg.chat.id

            const res = generateQrcode({ text })
            if (res.ok === true) {
                bot.sendPhoto(chatId, res.data)
            } else {
                bot.sendMessage(chatId, res.error)
            }
        })

        bot.onText(/\/random_pixiv/, async (msg) => {
            const chatId = msg.chat.id
            const apiName = 'Random Get Pixiv Collection'

            const res = await randomGetPixivCollection()
            if (res.ok === true) {
                // Send placeholder message
                const placeholderMessage = await bot.sendMessage(
                    chatId,
                    `${randomKaomoji()} Geeeeting a random Pixiv artwork ...`
                )

                const data = res.data
                const {
                    id,
                    picName,
                    picNameMD,
                    picUrl,
                    picSize,
                    picProxyUrl,
                    picId,
                    picIndex,
                    picType,
                } = data

                console.log(
                    `Bot API info: ${apiName}\n`,
                    `Sending Pixiv artwork name: ${picName}`
                )

                const caption = `Pixiv Artwork: ${picNameMD}\n[source](${picUrl}) \\| powered by [pixiv\\.cat](https://pixiv.cat/)`

                let msgReplied = false

                if (picSize < 5) {
                    // Artwork size is smaller than 5 MB, send photo message
                    const sendPhotoOptions = {
                        caption,
                        parse_mode: 'MarkdownV2',
                        disable_web_page_preview: true,
                    }

                    try {
                        await bot.sendPhoto(
                            chatId,
                            picProxyUrl,
                            sendPhotoOptions
                        )

                        msgReplied = true
                    } catch (err) {
                        console.error(
                            `Bot API error: ${apiName}\n`,
                            err.response.body
                        )

                        if (picIndex == 0) {
                            try {
                                // Comic mode artwork with index=0 may send failed
                                // Use comic mode url instead
                                const picProxyUrl = `https://pixiv.cat/${picId}-1.${picType}`
                                await bot.sendPhoto(
                                    chatId,
                                    picProxyUrl,
                                    sendPhotoOptions
                                )

                                msgReplied = true

                                // Send successfully, set this artwork with comic mode
                                const sequelize = await Sequelize()
                                const ServicePixivCollection =
                                    sequelize.models.ServicePixivCollection

                                ServicePixivCollection.update(
                                    { comicMode: true },
                                    { where: { id: id } }
                                )
                            } catch (err) {
                                console.error(
                                    `Bot API error: ${apiName}\n`,
                                    err.response.body
                                )
                            }
                        }
                    }
                }

                // Artwork size is not smaller than 5 MB or send failed again,
                // send caption message
                if (!msgReplied) {
                    await bot.sendMessage(chatId, caption, {
                        parse_mode: 'MarkdownV2',
                        disable_web_page_preview: false,
                    })
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

        bot.onText(/\/today_of_history/, async (msg) => {
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

        instance = bot
    }

    return instance
}

module.exports = connectTelegramBot
