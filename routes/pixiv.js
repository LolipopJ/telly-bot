const router = require('koa-router')()

const randomGetPixivCollection = require('../service/api/randomGetPixivCollection')

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
        ctx.status = 301
    } else {
        ctx.body = 'Get random Pixiv artwork failed.'
    }
})

router.get('/random_r18', async function (ctx) {
    if (!config.generateCollectionIndex.enable) {
        ctx.body = 'Maintainer does not enable random Pixiv artwork function.'
        return
    }

    const res = await randomGetPixivCollection({ r18: true })
    if (res.ok === true) {
        ctx.redirect(res.data.picProxyUrl)
        ctx.status = 301
    } else {
        ctx.body = 'Get random NSFW Pixiv artwork failed.'
    }
})

module.exports = router
