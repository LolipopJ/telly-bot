const router = require('koa-router')()

// Set bot webhook
router.post(`bot${process.env.TELEGRAM_BOT_TOKEN}`, (ctx) => {
    if (globalThis.bot === undefined) {
        console.error('Telegram Bot is not initialized.')
        ctx.status = 404
    }
    globalThis.bot.processUpdate(ctx.request.body)
    ctx.status = 200
})

// Get bot information
router.get('/', async function (ctx) {
    const getMeRes = await globalThis.bot.getMe()
    ctx.body = getMeRes
})

module.exports = router
