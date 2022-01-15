const generateQrcode = function ({ text, size = 600 }) {
    const apiName = 'Generate QRcode'

    const qrcodeText = String(text).slice(7).trim()

    if (qrcodeText.length === 0) {
        const error =
            'You need to input text stored in the qrcode. Example: /qrcode telly_bot'

        return {
            ok: false,
            data: undefined,
            error,
        }
    }

    console.log(
        `Bot API info: ${apiName}\n`,
        `Generating qrcode text: ${qrcodeText}`
    )

    return {
        ok: true,
        data: `https://api.oick.cn/qrcode/api.php?text=${qrcodeText}&size=${size}`,
        error: undefined,
    }
}

module.exports = generateQrcode
