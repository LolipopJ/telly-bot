export const baseErrorHandler = (
  title = "Something goes wrong",
  error: unknown,
) => {
  console.error(`${title}\n${String(error)}`);
};

export const replyMessageErrorHandler = (msg = "", error: unknown) => {
  baseErrorHandler(`Reply to \`${msg}\` failed:`, error);
};
