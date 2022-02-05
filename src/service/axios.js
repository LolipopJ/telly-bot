const axios = require('axios')
const http = require('http')
const https = require('https')

let instance
// let proxyDefaults

// if (
//     process.env.PROXY_HTTP_PROTOCOL &&
//     process.env.PROXY_HTTP_HOST &&
//     process.env.PROXY_HTTP_PORT
// ) {
//     proxyDefaults = {
//         protocol: process.env.PROXY_HTTP_PROTOCOL,
//         host: process.env.PROXY_HTTP_HOST,
//         port: process.env.PROXY_HTTP_PORT,
//         auth: {},
//     }

//     if (process.env.PROXY_HTTP_USERNAME) {
//         proxyDefaults.auth['username'] = process.env.PROXY_HTTP_USERNAME
//     }

//     if (process.env.PROXY_HTTP_PASSWORD) {
//         proxyDefaults.auth['password'] = process.env.PROXY_HTTP_PASSWORD
//     }
// }

module.exports = async function () {
    if (!instance) {
        instance = await axios.create({
            timeout: 30000,
            httpAgent: new http.Agent({ keepAlive: true }),
            httpsAgent: new https.Agent({ keepAlive: true }),
            // proxy: proxyDefaults,
        })
    }

    return instance
}
