import queryBalance from "./balance";
import consola from "consola";

export const validateChatAnywhereKey = async () => {
  consola.info(
    `Try to connect to ChatAnywhere with key: \`${String(process.env.CHATGPT_API_KEY)}\`...`,
  );
  const resp = await queryBalance();
  if (!resp.success) {
    throw new Error(`Connect to ChatAnywhere failed: ${resp.message}`);
  }
  consola.success(
    `Connect to ChatAnywhere successfully. CA coin remaining: \`${String(resp.total - resp.used)}\``,
  );
};

export default validateChatAnywhereKey;
