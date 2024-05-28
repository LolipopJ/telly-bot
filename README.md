# telly-bot

## Requirements

This project based on [Bun](https://bun.sh), which needs to be installed globally:

```bash
npm install -g bun
```

## Install dependencies

To install dependencies:

```bash
bun install
```

## Build for production

Bundling code can reduce startup times and improve running performance.

To build:

```bash
bun run build
```

## Start service

To start bot service:

```bash
bun run server
```

## Configurations

Create `.env` in root directory to hold environment variables.

### Required

**Required** environment variables:

```conf
# Telegram bot token
TELEGRAM_BOT_TOKEN=XXXXXXXXXX:XXXXXXXXXXXXXXXXXXXXXXXXXXX-XXXXXXX
```

### Common

Optional common environment variables:

```conf
# Listening port of service. Default to `3300`
PORT=3300
# Secret token to execute private (POST) API
API_SECRET_TOKEN=YOUR_SECRET_TOKEN
# Telegram chat that receives monitoring messages and so on
TELEGRAM_CHAT_ID=TARGET_CHAT_ID
```

### Database / MongoDB

Telly bot chooses MongoDB as the provider of database service. Some features require connecting to MongoDB.

```conf
# MongoDB uri
MONGO_URI=mongodb://username:password@127.0.0.1:27017/telly-bot
```

Don't be afraid, Telly bot can work without MongoDB.

### AList

```conf
# AList address
ALIST_URL=http://127.0.0.1:5244
# AList login username
ALIST_USERNAME=YOUR_ALIST_USERNAME
# AList login password
ALIST_PASSWORD=YOUR_ALIST_PASSWORD
# Custom service routes
ALIST_ROUTES=[{"route":"/random-img","path":"/path/to/img-dir","type":"random-image"}]
```

When visit `http://127.0.0.1:3300/alist/random-img` or send `/random_img` to bot, you will get a random image from the `/path/to/img-dir` directory in AList.

### ChatGPT

Adapt to [ChatAnywhere](https://github.com/chatanywhere/GPT_API_free).

```conf
# ChatGPT model version. Default to `gpt-3.5-turbo-0125`
CHATGPT_MODEL=gpt-3.5-turbo-0125
# ChatAnywhere API key
CHATGPT_API_KEY=YOUR_CHATGPT_API_KEY
```

Send `/chat ${message}` to chat with a cat girl!

Visit `http://127.0.0.1:3300/chatgpt/balance` to view key usage.Key usage will also be forwarded to message receiver every 9 AM and 9 PM.

### Github

```conf
GITHUB_PERSONAL_ACCESS_TOKEN=YOUR_GITHUB_PERSONAL_ACCESS_TOKEN
```

## API

### Telegram bot API

### Query bot status

```ts
axios.get("http://127.0.0.1:3300/bot/status");
```

### Send custom message

Send custom message to target chat. Content should be parsable by HTML mode: <https://core.telegram.org/bots/api#html-style>.

```ts
axios.post(
  "http://127.0.0.1:3300/bot/send-message",
  {
    content: "custom message",
    chatId: process.env.TELEGRAM_CHAT_ID,
  },
  {
    headers: { Authorization: process.env.API_SECRET_TOKEN },
  },
);
```

If `chatId` is blank, environment variable `TELEGRAM_CHAT_ID` will be used.

### ChatGPT API

#### Query CA key usage

```ts
axios.get("http://127.0.0.1:3300/chatgpt/balance");
```

#### Chat with a cat girl

```ts
axios.post(
  "http://127.0.0.1:3300/chatgpt/chat",
  {
    content: "custom message",
  },
  {
    headers: { Authorization: process.env.API_SECRET_TOKEN },
  },
);
```

## Development

To develop:

```bash
bun run start
# Or in production mode
bun run start:prod
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
