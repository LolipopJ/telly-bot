const TelegramBot = require('node-telegram-bot-api')

const generateQrcode = require('./botApi/generateQrcode')
const todayOfHistory = require('./botApi/todayOfHistory')

const token = process.env.TELEGRAM_BOT_TOKEN

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
} else if (process.env.PROXY_HTTP) {
    requestOptions = {
        proxy: process.env.PROXY_HTTP,
    }
}

const connectTelegramBot = async () => {
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
        bot.sendMessage(msg.chat.id, "I've received your message!")
    })

    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(msg.chat.id, 'Hi, this is Telly Bot!')
    })

    bot.onText(/\/today_of_history/, async (msg) => {
        const res = await todayOfHistory()
        if (res.ok === true) {
            bot.sendMessage(msg.chat.id, res.data)
        } else {
            console.error(res.err)
            bot.sendMessage(
                msg.chat.id,
                'Get today of history failed. You may try to call it again later!'
            )
        }
    })

    bot.onText(/\/qrcode/, (msg) => {
        const text = msg.text
        const res = generateQrcode({ text })
        if (res.ok === true) {
            bot.sendPhoto(msg.chat.id, res.data)
        } else {
            bot.sendMessage(msg.chat.id, res.error)
        }
    })

    return bot
}

module.exports = connectTelegramBot
