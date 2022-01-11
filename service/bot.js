const TelegramBot = require('node-telegram-bot-api')

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
        console.error('Set Telegram bot webhook successfully!')
    } catch (error) {
        console.error(`Unable to set Telegram bot webhook:`, error)
        throw error
    }

    bot.on('message', (msg) => {
        console.log(msg.chat.id)
        bot.sendMessage(msg.chat.id, "Hello, I've received your message!")
    })

    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(msg.chat.id, 'Hi, this is Telly Bot!')
    })

    bot.on('polling_error', console.log)

    return bot
}

module.exports = connectTelegramBot
