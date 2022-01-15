const router = require('koa-router')()

const randomGetPixivCollection = require('../service/botApi/randomGetPixivCollection')

const config = require('../config').pixiv

// Random get Pixiv artwork from collection
router.get('/random', async function (ctx) {
    if (!config.generateCollectionIndex.enable) {
        ctx.body = 'Maintainer does not enable random Pixiv artwork function.'
        return
    }

    const res = await randomGetPixivCollection()
    if (res.ok === true) {
        ctx.redirect(res.data.picProxyUrl)
    } else {
        ctx.body = 'Get random Pixiv artwork failed.'
    }
})

module.exports = router
