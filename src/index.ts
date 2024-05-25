import bot from "bot";

const port = Number(process.env.PORT) || 3300;
const isDevelopmentMode = process.env.NODE_ENV === "development";

Bun.serve({
  port,
  development: isDevelopmentMode,
  fetch(request) {
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname === "/") {
      if (bot.isPolling()) return new Response("Telly bot is running!");
      return new Response("Telly bot is not polling.");
    }

    return new Response("404");
  },
});

console.log(`Telly bot is running on http://127.0.0.1:${String(port)}`);
