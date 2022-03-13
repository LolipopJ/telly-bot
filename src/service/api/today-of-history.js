const axios = require('axios')

const todayOfHistoryRecord = {}

const getTodayOfHistory = async function () {
    const apiName = 'Get Today of History'
    const today = new Date().toLocaleDateString()

    try {
        let reply
        if (todayOfHistoryRecord[today]) {
            console.log(
                `Bot API info: ${apiName}\n`,
                `Get ${today} from temp record.`
            )
            reply = todayOfHistoryRecord[today]
        } else {
            const res = await axios.get('https://api.oick.cn/lishi/api.php')
            let todayOfHistory = res.data
            if (todayOfHistory.result === undefined) {
                todayOfHistory = JSON.parse(
                    todayOfHistory.replace(/(\r\n\t|\n|\r\t)/gm, '')
                )
            }
            reply = `Today is ${todayOfHistory.day}\n`
            for (const item of todayOfHistory.result) {
                reply += `\n[${item.date}]\n${item.title}`
            }
            todayOfHistoryRecord[today] = reply
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
