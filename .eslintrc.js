module.exports = {
    root: true,
    parser: '@babel/eslint-parser',
    env: {
        node: true,
    },
    plugins: ['@babel'],
    extends: ['plugin:prettier/recommended', 'prettier'],
}
