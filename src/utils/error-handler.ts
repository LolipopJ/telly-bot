import bot from "bot";
import { consola } from "consola";

export const baseErrorHandler = (
  title = "Something went wrong :(",
  error: unknown,
) => {
  consola.error(`${title}\n${String(error)}`);
};

export const replyMessageErrorHandler = (
  chatId: number,
  msgId: number,
  msg = "",
  error: unknown,
) => {
  baseErrorHandler(
    `Reply to message (${String(msgId)}) \`${msg}\` from ${String(chatId)} failed:`,
    error,
  );

  bot
    .sendMessage(chatId, "Something went wrong, please try it later :(", {
      reply_to_message_id: msgId,
    })
    .catch((err: unknown) => {
      baseErrorHandler(
        `Reply default error message to \`${msg}\` from ${String(chatId)} failed, too:`,
        err,
      );
    });
};
