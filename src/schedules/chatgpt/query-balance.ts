import bot from "bot";
import { consola } from "consola";
import schedule from "node-schedule";
import queryBalance from "services/chatgpt/balance";
import { baseErrorHandler } from "utils/error-handler";

export default () => {
  if (
    !!process.env.TELEGRAM_CHAT_ID_CHATGPT_BALANCE ||
    !!process.env.TELEGRAM_CHAT_ID_ADMIN
  ) {
    schedule.scheduleJob("0 9,21 * * *", async () => {
      consola.info(`Querying ChatAnywhere key usage...`);
      const queryBalanceResp = await queryBalance();

      if (queryBalanceResp.success) {
        const content = `<strong>ChatAnywhere key Usage</strong>
Total: ${String(queryBalanceResp.total)} CA
Used: ${String(queryBalanceResp.used)} CA
Remaining: ${String(queryBalanceResp.total - queryBalanceResp.used)} CA`;

        bot
          .sendMessage(
            Number(
              process.env.TELEGRAM_CHAT_ID_CHATGPT_BALANCE ??
                process.env.TELEGRAM_CHAT_ID_ADMIN,
            ),
            content,
            {
              parse_mode: "HTML",
            },
          )
          .then(() => {
            consola.success(
              `Bot \`send ChatAnywhere key usage\` to target chat success:\n${content}`,
            );
          })
          .catch((error: unknown) => {
            baseErrorHandler(
              "Send ChatAnywhere key usage to target chat failed:",
              error,
            );
          });
      } else {
        consola.warn(
          `Query ChatAnywhere key usage failed: ${queryBalanceResp.message}`,
        );
      }
    });
  }
};
