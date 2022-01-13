module.exports = async function (model, where, newItem) {
    const findItme = await model.findOne({ where })

    if (!findItme) {
        const item = await model.create(newItem)
        return { item, created: true }
    }

    const item = await model.update(newItem, { where })
    return { item, created: false }
}
