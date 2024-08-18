import type { ICAKeyBalance } from "interfaces/chatgpt";
import axios from "utils/axios";

export const queryBalance = async () => {
  try {
    const resp = await axios.post<ICAKeyBalance>(
      "https://api.chatanywhere.tech/v1/query/balance",
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
  } catch (error: unknown) {
    return {
      success: false,
      message: String(error),
      total: 0,
      used: 0,
    };
  }
};

export default queryBalance;
