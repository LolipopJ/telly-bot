require('dotenv').config()
require('node-telegram-bot-api')

const app = require('../app.js')
const http = require('http')
const debug = require('debug')('telly-bot:server')

// server
const port = process.env.PORT || '4000'

const server = http.createServer(app.callback())
server.on('error', (error) => {
    throw error
})
server.on('listening', () => {
    const addr = server.address()
    const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port
    debug('Listening on ' + bind)
})

server.listen(port)
