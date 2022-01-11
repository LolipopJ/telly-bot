const Koa = require('koa')
const app = new Koa()
const bodyParser = require('koa-bodyparser')()
const router = require('koa-router')()

const service = require('./service/index')

const indexRoutes = require('./routes/index')

// middlewares
app.use(bodyParser)

// logger
app.use(async (ctx, next) => {
    await next()
    const rt = ctx.response.get('X-Response-Time')
    console.log(`${ctx.method} ${ctx.url} - ${rt}`)
})

// x-response-time
app.use(async (ctx, next) => {
    const start = Date.now()
    await next()
    const ms = Date.now() - start
    ctx.set('X-Response-Time', `${ms}ms`)
})

// error handler
app.on('error', function (err, ctx) {
    console.error('server error', err, ctx)
})

// router
router.use('/', indexRoutes.routes(), indexRoutes.allowedMethods())

app.use(router.routes(), router.allowedMethods())

// Init service
service()

module.exports = app
