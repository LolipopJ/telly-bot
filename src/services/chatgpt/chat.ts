import {
  DEFAULT_MODEL,
  MESSAGE_MAX_LENGTH,
  MESSAGE_SYSTEM,
} from "constants/chatgpt";
import type { IChatMessage, IChatResponse } from "interfaces/chatgpt";
import axios from "utils/axios";

const tempMessages: Record<number, IChatMessage[]> = {};
export const chat = async (chatId: number, content: string) => {
  if (!Array.isArray(tempMessages[chatId])) {
    tempMessages[chatId] = [];
  }

  if (tempMessages[chatId].length > MESSAGE_MAX_LENGTH * 2) {
    tempMessages[chatId] = tempMessages[chatId].slice(2);
  }

  const userMessage: IChatMessage = { role: "user", content };
  const resp = await axios.post<IChatResponse>(
    // API docs: https://chatanywhere.apifox.cn/api-92222076
    "https://api.chatanywhere.tech/v1/chat/completions",
    {
      model: String(process.env.CHATGPT_MODEL) || DEFAULT_MODEL,
      messages: [MESSAGE_SYSTEM, ...tempMessages[chatId], userMessage],
      temperature: 1.2,
      presence_penalty: 0.8,
      frequency_penalty: 0.8,
    },
    {
      headers: {
        Authorization: `Bearer ${String(process.env.CHATGPT_API_KEY)}`,
      },
    },
  );

  if (resp.status === 200) {
    const respMessage = resp.data.choices[0].message;
    tempMessages[chatId].push(userMessage, respMessage);
    return respMessage.content;
  } else {
    return `Get chat response failed: ${resp.statusText}`;
  }
};

export default chat;
