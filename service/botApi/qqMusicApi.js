const QQMusic = require('../qqMusic')
const config = require('../../config').qqMusic

let musicList

const randomGetQQMusicCollection = async function () {
    const result = {
        ok: false,
        data: undefined,
        error: undefined,
    }

    if (!musicList) {
        const musicListId = config.musicListId

        if (!musicListId) {
            result.error = 'Music list id is not defined.'
            return result
        }

        const qqMusic = await QQMusic()
        const musicListDetails = await qqMusic.api('/getSongListDetail', {
            disstid: musicListId,
        })

        if (musicListDetails.data?.response?.cdlist[0]?.songlist) {
            musicList = musicListDetails.data.response.cdlist[0].songlist
        } else {
            result.error = "Can't get specified music list."
            return result
        }
    }

    const musicCount = musicList.length

    const randomMusicId = Math.floor(Math.random() * musicCount)

    result.ok = true
    result.data = musicList[randomMusicId]
    return result
}

const getQQMusicPlayUrl = async function (songmid) {
    const qqMusic = await QQMusic()

    const musicPlayUrlDetails = await qqMusic.api('/getMusicPlay', {
        songmid,
        justPlayUrl: 'play',
        quality: '128',
    })

    const urlDetails = musicPlayUrlDetails.data.data.playUrl[songmid]
    const url = urlDetails.url
    const error = urlDetails.error

    if (!error) {
        return {
            ok: true,
            data: url,
            error: undefined,
        }
    } else {
        return {
            ok: false,
            data: undefined,
            error: 'Get music play url failed.',
        }
    }
}

const getQQMusicMvUrl = async function (vid) {
    const qqMusic = await QQMusic()

    const mvPlayUrlDetails = await qqMusic.api('/getMvPlay', {
        vid,
    })

    let mvUrlList =
        mvPlayUrlDetails.data?.response?.getMVUrl?.data[vid]?.mp4 || []

    mvUrlList = mvUrlList.filter((mvUrlItem) => {
        return mvUrlItem.fileSize > 0
    })

    if (mvUrlList.length > 0) {
        return {
            ok: true,
            data: mvUrlList,
            error: undefined,
        }
    } else {
        return {
            ok: false,
            data: undefined,
            error: 'Get music mv url failed.',
        }
    }
}

module.exports = {
    randomGetQQMusicCollection,
    getQQMusicPlayUrl,
    getQQMusicMvUrl,
}
