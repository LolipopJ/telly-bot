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

**Required** environment variables:

```conf
# Telegram bot token
TELEGRAM_BOT_TOKEN=XXXXXXXXXX:XXXXXXXXXXXXXXXXXXXXXXXXXXX-XXXXXXX
```

Optional environment variables:

```conf
# Listening port of service. Default to `3300`.
PORT=3300
# Secret token to execute private APIs.
API_SECRET_TOKEN=YOUR_SECRET_TOKEN
# Forward monitoring messages and more to this chat.
TELEGRAM_CHAT_ID=YOUR_CHAT_ID
# ChatGPT model version.
CHATGPT_MODEL=gpt-3.5-turbo-0125
# ChatGPT service API key. Only support ChatAnywhere currently.
CHATGPT_API_KEY=YOUR_CHATGPT_API_KEY
```

### Run bot

To start bot service:

```bash
bun run server
```

## Usage

### Forward messages

Forward custom messages to target chat.

If `chatId` is blank, environment variable `TELEGRAM_CHAT_ID` will be used.

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
