const Sequelize = require('../../db/index')

const { TELEGRAM_BOT_SEND_PHOTO_MAX_SIZE } = require('../../constants')

const sendPixivPhoto = async (bot, chatId, resolvedArtwork) => {
    const {
        id,
        picName,
        picNameMD,
        picUrl,
        picSize,
        picProxyUrl,
        picId,
        picIndex,
        picType,
    } = resolvedArtwork

    const caption = `Pixiv Artwork: ${picNameMD} \\(${picSize} MB\\)\n[source](${picUrl}) \\| powered by [pixiv\\.cat](https://pixiv.cat/)`

    let msgReplied = false

    if (picSize < TELEGRAM_BOT_SEND_PHOTO_MAX_SIZE) {
        // Artwork size is smaller than 5 MB, send photo type message
        const sendPhotoOptions = {
            caption,
            parse_mode: 'MarkdownV2',
            disable_web_page_preview: true,
        }

        try {
            console.log(`Sending Pixiv artwork: ${picName} (${picSize} MB)`)

            await bot.sendPhoto(chatId, picProxyUrl, sendPhotoOptions)

            msgReplied = true
        } catch (err) {
            console.error(
                `Send artwork failed: ${picName} (${picSize} MB)\n`,
                err?.response?.body
            )

            // Comic mode artwork with index=0 may send failed
            if (picIndex == 0) {
                console.log(`Retry by comic mode: ${picName} (${picSize} MB)`)
                try {
                    // Use comic mode url instead
                    const picProxyUrl = `https://pixiv.cat/${picId}-1.${picType}`
                    await bot.sendPhoto(chatId, picProxyUrl, sendPhotoOptions)

                    msgReplied = true

                    // Send successfully, set this artwork with comic mode
                    const sequelize = await Sequelize()
                    const ServicePixivCollection =
                        sequelize.models.ServicePixivCollection

                    ServicePixivCollection.update(
                        { comicMode: true },
                        { where: { id: id } }
                    )
                } catch (err) {
                    console.error(
                        `Send artwork using comic mode failed: ${picName} (${picSize} MB)\n`,
                        err?.response?.body
                    )
                }
            }
        }
    }

    // Artwork size is bigger than 5 MB or send failed again,
    // send caption message
    if (!msgReplied) {
        console.log(
            `Sending Pixiv artwork url link text: ${picName} (${picSize} MB)`
        )

        await bot.sendMessage(chatId, caption, {
            parse_mode: 'MarkdownV2',
            disable_web_page_preview: false,
        })
    }
}

module.exports = {
    sendPixivPhoto,
}
