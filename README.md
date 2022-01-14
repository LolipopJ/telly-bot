# telly-bot

## Init

Install required dependances.

```bash
npm install
```

Create `.env` file in the project root directory and fill in the project configuration including [Telegram bot token](https://core.telegram.org/bots#6-botfather) and [webhook host](https://core.telegram.org/bots/api#setwebhook).

```plaintext
# Telegram bot settings. Must be set
TELEGRAM_BOT_TOKEN=Your Telegram Bot Token
WEBHOOK_HOST=Your server's public address. Requires HTTPS protocol

# Optional settings
PORT=Server listenning port. 4000 by default
PROXY_SOCKS5_HOST=Your socks5 host if needed
PROXY_SOCKS5_PORT=Your socks5 port if needed
PROXY_SOCKS5_USERNAME= Your socks5 username if nedded
PROXY_SOCKS5_PASSWORD= Your socks5 username if nedded
PROXY_HTTP=Your http proxy address if needed. PROXY_SOCKS5 will override this configuration
```

Rename `config.template.js` to `config.js`. Modify the config file `config.js` as prompted to connect to the PostgreSQL database:

```js
database: {
    postgresql: {
        host: 'localhost',
        port: 5432,
        database: 'telly_bot_db',
        user: 'telly_bot_db_user',
        password: 'telly_bot_db_pwd',
        timezone: '+08:00',
    },
},
```

### Forward Github issue comment to Telegram channel

You can enable Github issue comment forwarding service by configuring `config.js`:

```js
github: {
    forwardIssueComment: {
        // Interval time(s) between execution of the next service
        duration: 3600,
        task: [
            {
                owner: 'github_repo_owner',
                repo: 'github_repo_name',
                issueNumber: 1,
                // Only forward the comments of these users, empty means forward all
                issueUserId: undefined,
                // The ID of the channel to which the comment was forwarded. Example: @lolipop_thoughts
                forwardChannelId: '@telegram_channel_id',
                // Forward comments from this date
                since: '2022-01-01T00:00:00.000Z',
            },
        ],
    },
},
```

This configuration means: the bot will automatically forward the comments of all users in `https://github.com/github_repo_owner/github_repo_name/issues/1` to the `@telegram_channel_id` channel, and the forwarded comments are last updated no earlier than `2022-01-01T00:00:00.000Z`. The execution interval between two services is `3600` seconds.

### Generate Pivix collection index and random send to Telegram chat

You can enable Github issue comment forwarding service by configuring `config.js`:

```js
github: {
    pixiv: {
        generateCollectionIndex: {
            duration: 3600,
            path: ['pixiv_collection_path'],
        },
    },
},
```

This configuration means: the server will automatically generate index for your Pivix collections stored in the `pixiv_collection_path` path every `3600` seconds. In that case, your can send message `/random_pixiv` to the bot and get a random collection each time.

## Development

```bash
npm run start
```

## Deployment

```bash
npm run pm2
```
