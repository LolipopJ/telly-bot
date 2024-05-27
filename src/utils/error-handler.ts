import bot from "bot";

export const baseErrorHandler = (
  title = "Something goes wrong",
  error: unknown,
) => {
  console.error(`${title}\n${String(error)}`);
};

export const replyMessageErrorHandler = (
  chatId: number,
  msg = "",
  error: unknown,
) => {
  baseErrorHandler(`Reply to \`${msg}\` from ${String(chatId)} failed:`, error);

  bot
    .sendMessage(chatId, "Something goes wrong, try it later :(")
    .catch((err: unknown) => {
      baseErrorHandler(
        `Reply default error message to \`${msg}\` from ${String(chatId)} failed, too:`,
        err,
      );
    });
};
