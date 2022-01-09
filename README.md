# telly-bot

## Init

Install required dependances.

```bash
npm install
```

Create `.env` file in the project root directory and fill in the project configuration including [Telegram Bot token](https://core.telegram.org/bots#6-botfather).

```plaintext
# Must be set
TELEGRAM_BOT_TOKEN=Your Telegram Bot Token
WEBHOOK_HOST=Your server's public address

# Optional settings
PORT=Server listenning port
PROXY_SOCKS5_HOST=Your socks5 host if needed
PROXY_SOCKS5_PORT=Your socks5 port if needed
PROXY_SOCKS5_USERNAME= Your socks5 username if nedded
PROXY_SOCKS5_PASSWORD= Your socks5 username if nedded
PROXY_HTTP=Your http proxy address if needed
```

## Development

```bash
npm run start
```

## Run bot

```bash
npm run pm2
```
