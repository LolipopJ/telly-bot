const router = require('koa-router')()

router.get('/', async function (ctx) {
    const getMeRes = await globalThis.bot.getMe()
    ctx.body = getMeRes
})

module.exports = router
