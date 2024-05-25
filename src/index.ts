import { Elysia, redirect } from "elysia";
import bot from "bot";
import chat from "services/chatgpt/chat";
import { checkIsChatGPTEnabled } from "utils/chatgpt";

const port = Number(process.env.PORT) || 3300;
const isChatGPTEnabled = checkIsChatGPTEnabled();

new Elysia()
  /** Pre-check api token for POST methods */
  .onBeforeHandle(({ request, headers, error }) => {
    if (
      request.method === "POST" &&
      !!process.env.API_SECRET_TOKEN &&
      headers.authorization !== process.env.API_SECRET_TOKEN
    ) {
      return error(401, "Unauthorized: headers['Authorization'] is not valid.");
    }
  })
  /** Query current bot status */
  .get("/bot/status", () => {
    if (bot.isPolling()) return "Telly bot is running!";
    return "Telly bot is not running.";
  })
  .get("/", () => redirect("/bot/status"))
  .get("/bot", () => redirect("/bot/status"))
  /** Send message to target chat using bot */
  .post("/bot/send-message", async ({ body, error }) => {
    const { content, chatId = Number(process.env.TELEGRAM_CHAT_ID) } = body as {
      content: string;
      chatId?: number;
    };
    if (!content)
      return error(402, "Payment Required: body['content'] is required.");
    if (!chatId)
      return error(402, "Payment Required: body['chatId'] is required.");
    return await bot.sendMessage(chatId, content, { parse_mode: "MarkdownV2" });
  })
  /** Chat with cat girl */
  .post("/chatgpt/chat", async ({ body, error }) => {
    if (!isChatGPTEnabled)
      return error(
        503,
        "Service Unavailable: process.env['CHATGPT_API_KEY'] is required.",
      );

    const { content } = body as { content: string };
    if (!content)
      return error(402, "Payment Required: body['content'] is required.");
    return await chat(content);
  })
  .onError(({ code }) => {
    if (code === "NOT_FOUND") return "Service not found :(";
  })
  .listen(port);

console.info(`Telly bot is running on http://127.0.0.1:${String(port)}`);
