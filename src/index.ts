import { html } from "@elysiajs/html";
import bot from "bot";
import { consola } from "consola";
import { ALIST_ROUTES, IS_ALIST_ENABLED } from "constants/alist";
import { IS_CHATGPT_ENABLED } from "constants/chatgpt";
import { IS_GITHUB_API_ENABLED } from "constants/github";
import { IS_MONGO_ENABLED } from "constants/mongodb";
import { PORT } from "constants/server";
import connectMongoDB from "databases";
import { Elysia } from "elysia";
import type { IAListFileDetails } from "interfaces/alist";
import "schedules";
import { refreshAListSession } from "services/alist";
import { getRandomFile } from "services/alist/fs";
import validateChatAnywhereKey from "services/chatgpt";
import queryBalance from "services/chatgpt/balance";
import chat from "services/chatgpt/chat";
import { connectGithub } from "services/github";
import { getUrlFromFilename } from "utils/image";

if (IS_MONGO_ENABLED) {
  await connectMongoDB();
}

if (IS_ALIST_ENABLED) {
  await refreshAListSession();
}

if (IS_CHATGPT_ENABLED) {
  await validateChatAnywhereKey();
}

if (IS_GITHUB_API_ENABLED) {
  await connectGithub();
}

new Elysia()
  .use(html())
  //#region Pre-check api token for POST methods
  .onBeforeHandle(({ request, headers, error }) => {
    if (request.url.startsWith("/alist")) {
      if (!IS_ALIST_ENABLED)
        return error(
          503,
          "Service Unavailable: process.env['ALIST_URL'], process.env['ALIST_USERNAME'] and process.env['ALIST_PASSWORD'] are required.",
        );
    }

    if (request.url.startsWith("/chatgpt")) {
      if (!IS_CHATGPT_ENABLED)
        return error(
          503,
          "Service Unavailable: process.env['CHATGPT_API_KEY'] is required.",
        );
    }

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
  .get("/", ({ redirect }) => redirect("/bot/status", 301))
  .get("/bot", ({ redirect }) => redirect("/bot/status", 301))
  .get("/bot/status", () => {
    if (bot.isPolling()) return "Telly bot is polling!";
    return "Telly bot is not polling.";
  })
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
  .get("/chatgpt/balance", async () => {
    return await queryBalance();
  })
  //#endregion
  //#region Chat with cat girl
  .post("/chatgpt/chat", async ({ body, error }) => {
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

consola.box(`Telly bot is running on \`http://127.0.0.1:${String(PORT)}\``);
