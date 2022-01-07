const router = require('koa-router')()
const bot = require('../bot')

router.get('/', async function (ctx) {
    ctx.body = 'Hello World'
})

module.exports = router
