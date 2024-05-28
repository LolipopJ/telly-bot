import type { ICAKeyBalance } from "interfaces/chatgpt";
import axios from "utils/axios";

export const queryBalance = async () => {
  const resp = await axios.post<ICAKeyBalance>(
    "https://api.chatanywhere.org/v1/query/balance",
    null,
    {
      headers: {
        Authorization: String(process.env.CHATGPT_API_KEY),
      },
    },
  );

  return {
    success: resp.status === 200,
    message: resp.statusText,
    total: resp.data.balanceTotal,
    used: resp.data.balanceUsed,
  };
};

export default queryBalance;
