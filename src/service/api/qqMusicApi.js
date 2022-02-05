const QQMusic = require('../qqMusic')
const config = require('../../../config').qqMusic

let musicList = []
let getMusicListInterval = undefined

const randomGetQQMusicCollection = async function () {
    const result = {
        ok: false,
        data: undefined,
        error: undefined,
    }

    if (!getMusicListInterval) {
        // Get music list every 3600 seconds
        getMusicListInterval = setInterval(async function () {
            await getMusicList()
        }, 3600 * 1000)
    }

    if (musicList.length === 0) {
        const getMusicListRes = await getMusicList()

        // API request failed
        if (!getMusicListRes.ok) {
            result.error = 'Get music list failed.'
            return result
        }

        // There is no music in list
        if (musicList.length === 0) {
            result.error = 'There is no music in list.'
            return result
        }
    }

    const musicCount = musicList.length

    const randomMusicId = Math.floor(Math.random() * musicCount)

    result.ok = true
    result.data = musicList[randomMusicId]
    return result
}

const getMusicList = async function () {
    const result = {
        ok: false,
        data: undefined,
        error: undefined,
    }

    const musicListId = config.musicListId

    if (!musicListId) {
        result.error = 'Music list id is not defined.'
        return result
    }

    const qqMusic = await QQMusic()
    const musicListDetails = await qqMusic.api('/getSongListDetail', {
        disstid: musicListId,
    })

    const songList = musicListDetails.data?.response?.cdlist[0]?.songlist
    if (songList) {
        result.ok = true
        result.data = songList
        musicList = songList
        console.log('Get QQ Music list successfully!')
    } else {
        result.error = "Can't get specified music list."
    }

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

const getMusicCount = async function () {
    if (musicList.length === 0) {
        await getMusicList()
    }

    return musicList.length
}

module.exports = {
    randomGetQQMusicCollection,
    getQQMusicPlayUrl,
    getQQMusicMvUrl,
    getMusicCount,
}
