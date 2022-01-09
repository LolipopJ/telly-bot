const TelegramBot = require('node-telegram-bot-api')

const createTelegramBot = function () {
    const token = process.env.TELEGRAM_BOT_TOKEN

    let requestOptions = {}
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

    const bot = new TelegramBot(token, {
        request: requestOptions,
    })

    bot.setWebHook(`${process.env.WEBHOOK_HOST}/bot${token}`)

    bot.on('message', (msg) => {
        bot.sendMessage(msg.chat.id, "Hello, I've received your message!")
    })

    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(msg.chat.id, 'Hi, this is Telly Bot!')
    })

    bot.on('polling_error', console.log)

    return bot
}

module.exports = createTelegramBot
