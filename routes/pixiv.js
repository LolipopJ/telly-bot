const router = require('koa-router')()

const randomGetPixivCollection = require('../service/botApi/randomGetPixivCollection')

// Get bot information
router.get('/random', async function (ctx) {
    const res = await randomGetPixivCollection()
    if (res.ok === true) {
        ctx.redirect(res.data.picProxyUrl)
    } else {
        ctx.body = 'Get random Pixiv artwork failed.'
    }
})

module.exports = router
