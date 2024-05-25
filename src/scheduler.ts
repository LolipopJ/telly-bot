import bot from "bot";
import { IS_CHATGPT_ENABLED } from "constants/chatgpt";
import { baseErrorHandler } from "middlewares/error-handler";
import schedule from "node-schedule";
import queryBalance from "services/chatgpt/balance";

if (IS_CHATGPT_ENABLED) {
  schedule.scheduleJob("0 9 * * *", async () => {
    const queryBalanceResp = await queryBalance();

    if (queryBalanceResp.success) {
      const content = `<strong>ChatAnywhere API Usage</strong>
Total: ${String(queryBalanceResp.total)} CA
Used: ${String(queryBalanceResp.used)} CA
Remaining: ${String(queryBalanceResp.total - queryBalanceResp.used)} CA`;

      bot
        .sendMessage(Number(process.env.TELEGRAM_CHAT_ID), content, {
          parse_mode: "HTML",
        })
        .catch((error: unknown) => {
          baseErrorHandler(
            error,
            "Send ChatAnywhere API usage to target chat failed",
          );
        });
    }
  });
}
