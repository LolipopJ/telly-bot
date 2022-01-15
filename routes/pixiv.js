const router = require('koa-router')()

const randomGetPixivCollection = require('../service/botApi/randomGetPixivCollection')

// Random get Pixiv artwork from collection
router.get('/random', async function (ctx) {
    const res = await randomGetPixivCollection()
    if (res.ok === true) {
        ctx.redirect(res.data.picProxyUrl)
    } else {
        ctx.body = 'Get random Pixiv artwork failed.'
    }
})

module.exports = router
