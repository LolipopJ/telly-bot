const router = require('koa-router')()

const Bot = require('../service/bot')

// Set bot webhook
router.post(`bot${process.env.TELEGRAM_BOT_TOKEN}`, async (ctx) => {
    const bot = await Bot()
    bot.processUpdate(ctx.request.body)
    ctx.status = 200
})

// Get bot information
router.get('/', async function (ctx) {
    const bot = await Bot()
    const getMeRes = await bot.getMe()
    ctx.body = getMeRes
})

module.exports = router
