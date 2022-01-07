const router = require('koa-router')()

router.get('/', async function (ctx) {
    ctx.body = 'Hello World'
})

module.exports = router
