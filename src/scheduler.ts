import bot from "bot";
import { IS_ALIST_ENABLED } from "constants/alist";
import { IS_CHATGPT_ENABLED } from "constants/chatgpt";
import schedule from "node-schedule";
import getAListSession from "services/alist/session";
import queryBalance from "services/chatgpt/balance";
import { setAlistSession } from "utils/alist";
import { baseErrorHandler } from "utils/error-handler";

if (IS_ALIST_ENABLED) {
  const refreshAListSessionJob = schedule.scheduleJob("0 * * * *", async () => {
    const resp = await getAListSession();

    if (resp.code === 200 && !!resp.data?.token) {
      console.info("Refresh AList session successfully.");
      setAlistSession(resp.data.token);
    } else {
      baseErrorHandler("Refresh AList session failed:", resp.message);
    }
  });

  refreshAListSessionJob.invoke();
}

if (IS_CHATGPT_ENABLED) {
  schedule.scheduleJob("0 9,21 * * *", async () => {
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
        .then(() => {
          console.info(
            `Bot \`send ChatAnywhere API usage\` to target chat success:\n${content}`,
          );
        })
        .catch((error: unknown) => {
          baseErrorHandler(
            "Send ChatAnywhere API usage to target chat failed:",
            error,
          );
        });
    }
  });
}
