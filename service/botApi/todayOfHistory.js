const axios = require('axios')

const getTodayOfHistory = async function () {
    try {
        const res = await axios.get('https://api.oick.cn/lishi/api.php')
        const todayOfHistory = JSON.parse(
            res.data.replace(/(\r\n\t|\n|\r\t)/gm, '')
        )
        let reply = `Today is ${todayOfHistory.day}\n`
        for (const item of todayOfHistory.result) {
            reply += `\n[${item.date}]\n${item.title}`
        }
        return {
            ok: true,
            data: reply,
            error: undefined,
        }
    } catch (error) {
        return {
            ok: false,
            data: undefined,
            error,
        }
    }
}

module.exports = getTodayOfHistory
