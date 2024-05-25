export const baseErrorHandler = (
  error: unknown,
  title = "Something goes wrong",
) => {
  console.error(`${title}:\n${String(error)}`);
};

export const replyMessageErrorHandler = (error: unknown, msg = "") => {
  baseErrorHandler(error, `Reply to \`${msg}\` failed`);
};
