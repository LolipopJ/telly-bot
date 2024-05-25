import TelegramBot from "node-telegram-bot-api";
import { replyMessageErrorHandler } from "middlewares/error-handler";
import chat from "services/chatgpt/chat";
import { checkIsChatGPTEnabled } from "utils/chatgpt";

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error(
    "Environment variable `TELEGRAM_BOT_TOKEN` is required to connect Telegram bot.",
  );
}
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const isChatGPTEnabled = checkIsChatGPTEnabled();

bot.on("message", (msg) => {
  const from = msg.from;
  const {
    id: userId = "UNKNOWN",
    username = "UNKNOWN",
    first_name: userFirstName = "UNKNOWN",
    last_name: userLastName = "UNKNOWN",
    is_bot,
  } = from ?? {};

  const chat = msg.chat;
  const chatId = chat.id;
  const dateTime = msg.date * 1000;
  const text = msg.text;

  console.info(
    `Received a message:
${String(text)}

From:
  username: ${username} (${userFirstName} ${userLastName})
  userId: ${String(userId)}
  chatId: ${String(chatId)}
  isBot: ${String(is_bot)}
  date: ${new Date(dateTime).toLocaleString()}`,
  );
});

bot.onText(/^\/start$/, (msg) => {
  bot
    .sendMessage(msg.chat.id, "Hi, this is Telly Bot!")
    .catch((err: unknown) => {
      replyMessageErrorHandler(err, msg.text);
    });
});

bot.onText(/\/echo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match?.[1] ?? "echo";

  bot.sendMessage(chatId, resp).catch((err: unknown) => {
    replyMessageErrorHandler(err, msg.text);
  });
});

if (isChatGPTEnabled) {
  bot.onText(/\/chat (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const { text } = msg;
    const message = match?.[1]?.trim() ?? "跟我随便聊聊吧";

    chat(message)
      .then((resp) => {
        bot.sendMessage(chatId, resp).catch((err: unknown) => {
          replyMessageErrorHandler(err, text);
        });
      })
      .catch((err: unknown) => {
        replyMessageErrorHandler(err, text);
      });
  });
}

export default bot;
