const axios = require('axios')

const config = require('../config').qqMusic
const { transformObjectToParams } = require('../assets/index')

let instance

const connectQQMusic = async () => {
    if (!instance) {
        const host = config.host || 'localhost'
        const port = config.port || 3200
        const baseUrl = `${host}:${port}`

        const qqMusic = {}
        qqMusic.api = async function (api, params) {
            const requestParams = params ? transformObjectToParams(params) : ''
            const requestUrl = `${baseUrl}${api}${requestParams}`

            console.log(`QQ Music API request:\n`, requestUrl)
            const result = await axios.get(requestUrl)
            return result
        }

        const connectTest = await qqMusic.api('/user/getCookie')
        if (connectTest.data.data.code !== 200) {
            throw new Error('Get QQ Music cookie failed.')
        }

        instance = qqMusic
    }

    return instance
}

module.exports = connectQQMusic
