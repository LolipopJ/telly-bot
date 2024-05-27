import { ALIST_ROUTES, IS_ALIST_ENABLED } from "constants/alist";
import { IS_CHATGPT_ENABLED } from "constants/chatgpt";
import type { IAListFileDetails } from "interfaces/alist";
import TelegramBot from "node-telegram-bot-api";
import { getRandomFile } from "services/alist/fs";
import chat from "services/chatgpt/chat";
import { replyMessageErrorHandler } from "utils/error-handler";
import { getUrlFromFilename } from "utils/image";

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
  const chatId = msg.chat.id;
  const { text } = msg;

  bot
    .sendMessage(chatId, "Hi, this is Telly Bot!")
    .then(() => {
      console.info(`Bot \`say hello\` to ${String(chatId)} successfully.`);
    })
    .catch((err: unknown) => {
      replyMessageErrorHandler(chatId, text, err);
    });
});

bot.onText(/\/echo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const { text } = msg;
  const resp = match?.[1];

  bot
    .sendMessage(chatId, resp ? resp : "echo")
    .then(() => {
      console.info(`Bot \`echo\` to ${String(chatId)} successfully.`);
    })
    .catch((err: unknown) => {
      replyMessageErrorHandler(chatId, text, err);
    });
});

if (IS_ALIST_ENABLED) {
  ALIST_ROUTES.forEach((routeItem) => {
    const { route, type, path } = routeItem;

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    bot.onText(new RegExp(`^${route}$`.replace("-", "_")), async (msg) => {
      const chatId = msg.chat.id;
      const { text } = msg;

      if (type === "random-image") {
        let randomFile: IAListFileDetails | undefined;
        let randomFileType = "";
        let randomFileSize = Infinity; // MB

        while (
          !(
            randomFile &&
            ["jpg", "jpeg", "png"].includes(randomFileType) &&
            // The file must be at most 50 MB in size.
            randomFileSize <= 50
          )
        ) {
          randomFile = await getRandomFile({ path });
          if (randomFile) {
            randomFileType = randomFile.name.split(".").pop() ?? "";
            randomFileSize = Number(
              (randomFile.size / 1024 / 1024).toFixed(2), // Bytes to MB
            );
          }
        }

        const {
          raw_url: randomFileRawUrl,
          name: randomFilename,
          thumb: randomFileThumbnail,
        } = randomFile;

        const randomFileUrl = getUrlFromFilename(randomFilename);
        const messageCaption = `<b>Filename: </b>${randomFilename}
<b>File size: </b>${String(randomFileSize)} MB
${randomFileUrl ? `<a href="${randomFileUrl}">source</a>` : ""}`.trim();

        if (randomFileSize <= 10) {
          // randomFileSize <= 10 MB, use `sendPhoto()`
          bot
            .sendPhoto(chatId, randomFileRawUrl, {
              caption: messageCaption,
              parse_mode: "HTML",
            })
            .then(() => {
              console.info(
                `Bot \`send photo ${randomFilename}\` to ${String(chatId)} successfully.`,
              );
            })
            .catch((err: unknown) => {
              replyMessageErrorHandler(chatId, text, err);
            });
        } else {
          // 10MB <= randomFileSize <= 50 MB, use `sendDocument()`
          bot
            .sendDocument(chatId, randomFileRawUrl, {
              thumbnail: ["jpg", "jpeg"].includes(randomFileType)
                ? randomFileThumbnail
                : undefined,
              caption: messageCaption,
              parse_mode: "HTML",
            })
            .then(() => {
              console.info(
                `Bot \`send document ${randomFilename}\` to ${String(chatId)} successfully.`,
              );
            })
            .catch((err: unknown) => {
              replyMessageErrorHandler(chatId, text, err);
            });
        }
      } else {
        bot
          .sendMessage(chatId, `Not available AList route type: \`${type}\``)
          .then(() => {
            console.info(
              `Bot \`send error message\` to ${String(chatId)} successfully.`,
            );
          })
          .catch((err: unknown) => {
            replyMessageErrorHandler(chatId, text, err);
          });
      }
    });
  });
}

if (IS_CHATGPT_ENABLED) {
  bot.onText(/\/chat(.*)/, (msg, match) => {
    const chatId = msg.chat.id;
    const { text } = msg;
    const message = match?.[1].trim();

    chat(message ? message : "陪我随便聊聊吧")
      .then((resp) => {
        bot
          .sendMessage(chatId, resp)
          .then(() => {
            console.info(`Bot \`chat\` with ${String(chatId)} successfully.`);
          })
          .catch((err: unknown) => {
            replyMessageErrorHandler(chatId, text, err);
          });
      })
      .catch((err: unknown) => {
        replyMessageErrorHandler(chatId, text, err);
      });
  });
}

export default bot;
