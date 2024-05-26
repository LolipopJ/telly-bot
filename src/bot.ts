import { ALIST_ROUTES, IS_ALIST_ENABLED } from "constants/alist";
import { IS_CHATGPT_ENABLED } from "constants/chatgpt";
import type { IAListFileDetails } from "interfaces/alist";
import TelegramBot from "node-telegram-bot-api";
import { getRandomFile } from "services/alist/fs";
import chat from "services/chatgpt/chat";
import { replyMessageErrorHandler } from "utils/error-handler";

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error(
    "process.env['TELEGRAM_BOT_TOKEN'] is required to connect Telegram bot.",
  );
}
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

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
    `Bot received a message:
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
    .then(() => {
      console.info(`Bot \`say hello\` to ${String(msg.chat.id)} successfully.`);
    })
    .catch((err: unknown) => {
      replyMessageErrorHandler(msg.text, err);
    });
});

bot.onText(/\/echo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match?.[1] ?? "echo";

  bot
    .sendMessage(chatId, resp)
    .then(() => {
      console.info(`Bot \`echo\` to ${String(msg.chat.id)} successfully.`);
    })
    .catch((err: unknown) => {
      replyMessageErrorHandler(msg.text, err);
    });
});

if (IS_ALIST_ENABLED) {
  ALIST_ROUTES.forEach((routeItem) => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    bot.onText(new RegExp(`^${routeItem.route}$`), async (msg) => {
      const chatId = msg.chat.id;
      const { text } = msg;

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (routeItem.type === "random-image") {
        let randomFile: IAListFileDetails | undefined;
        let randomFileSize = Infinity; // MB
        while (
          !randomFile ||
          randomFileSize >= 10 // The photo must be at most 10 MB in size.
        ) {
          try {
            randomFile = await getRandomFile({ path: routeItem.path });
            if (randomFile) {
              randomFileSize = Number(
                (randomFile.size / 1024 / 1024).toFixed(2),
              );
            }
          } catch (err: unknown) {
            replyMessageErrorHandler(text, err);
          }
        }

        bot
          .sendPhoto(chatId, randomFile.raw_url, {
            caption: `<b>Filename: </b>${randomFile.name}
<b>File size: </b>${String(randomFileSize)} MB`,
            parse_mode: "HTML",
          })
          .then(() => {
            console.info(
              `Bot \`send photo ${randomFile.name}\` to ${String(msg.chat.id)} successfully.`,
            );
          })
          .catch((err: unknown) => {
            replyMessageErrorHandler(msg.text, err);
          });
      }
    });
  });
}

if (IS_CHATGPT_ENABLED) {
  bot.onText(/\/chat(.*)/, (msg, match) => {
    const chatId = msg.chat.id;
    const { text } = msg;
    const message = match?.[1]?.trim() ?? "跟我随便聊聊吧";

    chat(message)
      .then((resp) => {
        bot
          .sendMessage(chatId, resp)
          .then(() => {
            console.info(
              `Bot \`chat\` with ${String(msg.chat.id)} successfully.`,
            );
          })
          .catch((err: unknown) => {
            replyMessageErrorHandler(text, err);
          });
      })
      .catch((err: unknown) => {
        replyMessageErrorHandler(text, err);
      });
  });
}

export default bot;
