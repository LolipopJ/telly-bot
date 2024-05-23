# telly-bot

## Requirements

This project based on [Bun](https://bun.sh), which needs to be installed globally:

```bash
npm install -g bun
```

## Start service

### Install dependencies

To install dependencies:

```bash
bun install
```

### Configurations

Create `.env` in root directory to hold environment variables.

Available environment variables:

```conf
# (Required) Telegram bot token
TELEGRAM_BOT_TOKEN=XXXXXXXXXX:XXXXXXXXXXXXXXXXXXXXXXXXXXX-XXXXXXX
# Listening port of service. Default to `3300`.
PORT=3300
```

### Run bot

To start bot service:

```bash
bun run server
```

## Development

To develop:

```bash
bun run dev
```

To lint files:

```bash
# Require a Node.js >=20.11.0 to get typing check
bun run eslint
```

To fix code syntax:

```bash
bun run prettier
```
