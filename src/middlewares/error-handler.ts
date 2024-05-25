export const replyMessageErrorHandler = (error: unknown, msg = "") => {
  console.error(`Reply to \`${msg}\` failed:\n${String(error)}`);
};
