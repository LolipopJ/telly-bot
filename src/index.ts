import { html } from "@elysiajs/html";
import bot from "bot";
import { consola } from "consola/basic";
import { ALIST_ROUTES, IS_ALIST_ENABLED } from "constants/alist";
import { IS_CHATGPT_ENABLED } from "constants/chatgpt";
import { PORT } from "constants/server";
import { Elysia } from "elysia";
import type { IAListFileDetails } from "interfaces/alist";
import "scheduler";
import { getRandomFile } from "services/alist/fs";
import queryBalance from "services/chatgpt/balance";
import chat from "services/chatgpt/chat";
import { getUrlFromFilename } from "utils/image";

new Elysia()
  .use(html())
  //#region Pre-check api token for POST methods
  .onBeforeHandle(({ request, headers, error }) => {
    if (
      request.method === "POST" &&
      !!process.env.API_SECRET_TOKEN &&
      headers.authorization !== process.env.API_SECRET_TOKEN
    ) {
      return error(401, "Unauthorized: headers['Authorization'] is not valid.");
    }
  })
  //#endregion
  //#region Query current bot status
  .get("/bot/status", () => {
    if (bot.isPolling()) return "Telly bot is running!";
    return "Telly bot is not running.";
  })
  .get("/", ({ redirect }) => redirect("/bot/status", 301))
  .get("/bot", ({ redirect }) => redirect("/bot/status", 301))
  //#endregion
  //#region Send message to target chat using bot
  .post("/bot/send-message", async ({ body, error }) => {
    const { content, chatId = Number(process.env.TELEGRAM_CHAT_ID) } = body as {
      content: string;
      chatId?: number;
    };
    if (!content)
      return error(402, "Payment Required: body['content'] is required.");
    if (!chatId)
      return error(402, "Payment Required: body['chatId'] is required.");
    return await bot.sendMessage(chatId, content, { parse_mode: "HTML" });
  })
  //#endregion
  //#region AList
  .get("/alist*", async ({ params, error }) => {
    if (!IS_ALIST_ENABLED)
      return error(
        503,
        "Service Unavailable: process.env['ALIST_ADDRESS'], process.env['ALIST_USERNAME'] and process.env['ALIST_PASSWORD'] are required.",
      );

    const route: string = params["*"];
    const routeItem = ALIST_ROUTES.find(
      (availableAListRoute) => availableAListRoute.route === route,
    );
    if (!routeItem)
      return error(
        404,
        `Not Found: route \`${route}\` is not defined in process.env['ALIST_ROUTES']`,
      );

    const { type: routeType, path: routePath } = routeItem;
    if (routeType === "random-image") {
      let randomFile: IAListFileDetails | undefined;
      let randomFileType = "";

      try {
        while (
          !(randomFile && ["jpg", "jpeg", "png"].includes(randomFileType))
        ) {
          randomFile = await getRandomFile({ path: routePath });
          randomFileType = randomFile.name.split(".").pop() ?? "";
        }
      } catch (err: unknown) {
        return error(500, `Internal Server Error: ${String(err)}`);
      }

      const { raw_url: randomFileRawUrl, name: randomFilename } = randomFile;
      const randomFileUrl = getUrlFromFilename(randomFilename) ?? "";

      return `
<html>
  <head lang="en-US">
    <meta charset="UTF-8">
    <title>${randomFilename}</title>
  </head>
  <body style="margin: 5vh; text-align: center; background: #242424;">
    <a href="${randomFileUrl}" target="${randomFileUrl ? "_blank" : "_self"}">
      <img src="${randomFileRawUrl}" alt="${randomFilename}" style="height: 90vh; border-radius: 1%;">
    </a>
  </body>
</html>`;
    } else {
      return error(
        501,
        `Not Implemented: not available AList route type: \`${routeType}\``,
      );
    }
  })
  //#endregion
  //#region Query balance of ChatAnywhere key
  .get("/chatgpt/balance", async ({ error }) => {
    if (!IS_CHATGPT_ENABLED)
      return error(
        503,
        "Service Unavailable: process.env['CHATGPT_API_KEY'] is required.",
      );

    return await queryBalance();
  })
  //#endregion
  //#region Chat with cat girl
  .post("/chatgpt/chat", async ({ body, error }) => {
    if (!IS_CHATGPT_ENABLED)
      return error(
        503,
        "Service Unavailable: process.env['CHATGPT_API_KEY'] is required.",
      );

    const { content } = body as { content: string };
    if (!content)
      return error(402, "Payment Required: body['content'] is required.");
    return await chat(content);
  })
  //#endregion
  .onError(({ code }) => {
    if (code === "NOT_FOUND") return "Service not found :(";
  })
  .listen(PORT);

consola.info(`Telly bot is running on http://127.0.0.1:${String(PORT)}`);
