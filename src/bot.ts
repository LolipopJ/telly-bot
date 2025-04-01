import { consola } from "consola";
import { ALIST_ROUTES, IS_ALIST_ENABLED } from "constants/alist";
import { IS_CHATGPT_ENABLED } from "constants/chatgpt";
import { USER_AGENT } from "constants/server";
import type { IAListFileDetails } from "interfaces/alist";
import { IChatType } from "interfaces/chatgpt";
import TelegramBot from "node-telegram-bot-api";
import { getRandomFile } from "services/alist/fs";
import chat from "services/chatgpt/chat";
import { replyMessageErrorHandler } from "utils/error-handler";
import { getUrlFromFilename } from "utils/image";

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error(
    "process.env['TELEGRAM_BOT_TOKEN'] is required to connect to Telegram bot.",
  );
}
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true,
  request: { uri: "", headers: { "User-Agent": USER_AGENT } },
});

bot.on("message", (msg) => {
  const { message_id, chat, from, text, date } = msg;
  const chatId = chat.id;
  const {
    id: userId = "UNKNOWN",
    username = "UNKNOWN",
    first_name: userFirstName = "UNKNOWN",
    last_name: userLastName = "UNKNOWN",
    is_bot,
  } = from ?? {};
  const dateTime = date * 1000;

  consola.info(
    `Bot received a message: \`${String(text)}\`
From:
  username: \`${username} (${userFirstName} ${userLastName})\`
  userId: \`${String(userId)}\`
  chatId: \`${String(chatId)}\`
  messageId: ${String(message_id)}
  isBot: ${String(is_bot)}
  date: ${new Date(dateTime).toLocaleString()}`,
  );
});

bot.onText(/^\/start$/, (msg) => {
  const chatId = msg.chat.id;
  const { text, message_id } = msg;

  bot
    .sendMessage(chatId, "Hi, this is Telly Bot powered by Lolipop!", {
      reply_to_message_id: message_id,
    })
    .then(() => {
      consola.success(`Bot \`say hello\` to ${String(chatId)} successfully.`);
    })
    .catch((err: unknown) => {
      replyMessageErrorHandler(chatId, message_id, text, err);
    });
});

bot.onText(/\/echo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const { text, message_id } = msg;
  const resp = match?.[1];

  bot
    .sendMessage(chatId, resp ? resp : "echo", {
      reply_to_message_id: message_id,
    })
    .then(() => {
      consola.success(`Bot \`echo\` to ${String(chatId)} successfully.`);
    })
    .catch((err: unknown) => {
      replyMessageErrorHandler(chatId, message_id, text, err);
    });
});

if (IS_ALIST_ENABLED) {
  ALIST_ROUTES.forEach((routeItem) => {
    const { route, type: routeType, path: routePath } = routeItem;

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    bot.onText(new RegExp(`^${route.replaceAll("-", "_")}$`), async (msg) => {
      const chatId = msg.chat.id;
      const { text, message_id } = msg;

      if (routeType === "random-image") {
        let randomFile: IAListFileDetails | undefined;
        let randomFileType = "";
        let randomFileSize = Infinity; // MB

        try {
          while (
            !(
              randomFile &&
              ["jpg", "jpeg", "png"].includes(randomFileType) &&
              // The file must be at most 50 MB in size.
              randomFileSize <= 50
            )
          ) {
            randomFile = await getRandomFile({ path: routePath });
            if (randomFile) {
              randomFileType = randomFile.name.split(".").pop() ?? "";
              randomFileSize = Number(
                (randomFile.size / 1024 / 1024).toFixed(2), // Bytes to MB
              );
            }
          }
        } catch (err: unknown) {
          replyMessageErrorHandler(chatId, message_id, text, err);
          return;
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

        consola.info(
          `Bot try to \`send ${randomFilename}\` to ${String(chatId)}...`,
        );
        if (randomFileSize <= 10) {
          // randomFileSize <= 10 MB, use `sendPhoto()`
          bot
            .sendPhoto(chatId, randomFileRawUrl, {
              reply_to_message_id: message_id,
              caption: messageCaption,
              parse_mode: "HTML",
            })
            .then(() => {
              consola.success(
                `Bot \`send photo ${randomFilename}\` to ${String(chatId)} successfully.`,
              );
            })
            .catch((err: unknown) => {
              replyMessageErrorHandler(chatId, message_id, text, err);
            });
        } else {
          // 10MB <= randomFileSize <= 50 MB, use `sendDocument()`
          bot
            .sendDocument(chatId, randomFileRawUrl, {
              reply_to_message_id: message_id,
              thumbnail: ["jpg", "jpeg"].includes(randomFileType)
                ? randomFileThumbnail
                : undefined,
              caption: messageCaption,
              parse_mode: "HTML",
            })
            .then(() => {
              consola.success(
                `Bot \`send document ${randomFilename}\` to ${String(chatId)} successfully.`,
              );
            })
            .catch((err: unknown) => {
              replyMessageErrorHandler(chatId, message_id, text, err);
            });
        }
      } else {
        bot
          .sendMessage(
            chatId,
            `Not available AList route type: \`${routeType}\``,
            { reply_to_message_id: message_id },
          )
          .then(() => {
            consola.warn(
              `Bot \`send error message\` to ${String(chatId)} successfully.`,
            );
          })
          .catch((err: unknown) => {
            replyMessageErrorHandler(chatId, message_id, text, err);
          });
      }
    });
  });
}

if (IS_CHATGPT_ENABLED) {
  bot.onText(/\/chat(_.*)? (.*)/, (msg, match) => {
    const chatId = msg.chat.id;
    const { text, message_id } = msg;
    const chatType = (match?.[1] ?? "").toLowerCase();
    const message = match?.[2].trim() ?? "";

    let type: IChatType | undefined;
    switch (chatType) {
      case "_dan":
        type = IChatType.DAN;
        break;
      case "_cat-girl":
      case "_cat_girl":
      case "_catgirl":
      case "_猫娘":
      case "_猫娘1":
        type = IChatType.CAT_GIRL;
        break;
      case "_neko":
      case "_nekopara":
      case "_猫娘2":
        type = IChatType.NEKO;
        break;
      case "_succubus":
      case "_魅魔":
        type = IChatType.SUCCUBUS;
        break;
      case "_luna":
      case "_露娜":
      case "_红颜":
      case "_红颜知己":
      case "_红尘知己":
        type = IChatType.LUNA;
        break;
      case "_sexy_girlfriend":
      case "_sexy_girl_friend":
      case "_girlfriend":
      case "_girl_friend":
      case "_gf":
      case "_女友":
      case "_女朋友":
        type = IChatType.SEXY_GIRLFRIEND;
        break;
      case "_poet":
      case "_诗人":
        type = IChatType.POET;
        break;
      case "_translator_to_zh":
      case "_translator":
      case "_翻译":
      case "_中文翻译":
        type = IChatType.TRANSLATOR_TO_ZH;
        break;
      case "_intimate_sister":
      case "_sister":
      case "_姐姐":
      case "_大姐姐":
      case "_知心姐姐":
      case "_邻家姐姐":
        type = IChatType.INTIMATE_SISTER;
        break;
      case "_psychologist":
      case "_心理医生":
        type = IChatType.PSYCHOLOGIST;
        break;
      case "_prompt_generator":
      case "_prompt":
      case "_提示词":
      case "_提示词生成器":
        type = IChatType.PROMPT_GENERATOR;
        break;
      case "_madman":
      case "_mad":
      case "_crazy":
      case "_疯子":
        type = IChatType.MADMAN;
        break;
      case "_drunk":
      case "_醉汉":
      case "_醉鬼":
        type = IChatType.DRUNK;
        break;
      case "_socrates":
      case "_苏格拉底":
        type = IChatType.SOCRATES;
        break;
      case "_redbook":
      case "_red_book":
      case "_小红书":
        type = IChatType.RED_BOOK;
        break;
      case "_selfish":
      case "_自私":
      case "_自私鬼":
      case "_自私基因":
        type = IChatType.SELFISH;
        break;
      case "_mesugaki":
      case "_雌小鬼":
        type = IChatType.MESUGAKI;
        break;
      case "_mesugaki_2":
      case "_mesugaki2":
      case "_雌小鬼2":
        type = IChatType.MESUGAKI_2;
        break;
      case "_default":
      default:
        type = IChatType.DEFAULT;
    }

    chat(chatId, message ? message : "Talk with me casually", type)
      .then((resp) => {
        bot
          .sendMessage(chatId, resp, { reply_to_message_id: message_id })
          .then(() => {
            consola.success(
              `Bot \`chat\` with ${String(chatId)} successfully.
Sended Message:
${message}

Response (${type}):
${resp}`,
            );
          })
          .catch((err: unknown) => {
            replyMessageErrorHandler(chatId, message_id, text, err);
          });
      })
      .catch((err: unknown) => {
        replyMessageErrorHandler(chatId, message_id, text, err);
      });
  });
}

export default bot;
