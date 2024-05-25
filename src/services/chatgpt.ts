import axios from "utils/axios";
import {
  DEFAULT_MODEL,
  MESSAGE_MAX_LENGTH,
  MESSAGE_SYSTEM,
} from "constants/chatgpt";
import type { IChatMessage, IChatResponse } from "interfaces/chatgpt";

let tempMessages: IChatMessage[] = [];
export const chat = async (content: string) => {
  if (tempMessages.length > MESSAGE_MAX_LENGTH * 2) {
    tempMessages = tempMessages.slice(2);
  }

  const userMessage: IChatMessage = { role: "user", content };
  const resp = await axios.post<IChatResponse>(
    // API docs: https://chatanywhere.apifox.cn/api-92222076
    "https://api.chatanywhere.tech/v1/chat/completions",
    {
      model: String(process.env.CHATGPT_MODEL) || DEFAULT_MODEL,
      messages: [MESSAGE_SYSTEM, ...tempMessages, userMessage],
      temperature: 1.2,
      presence_penalty: 1,
      frequency_penalty: 1,
    },
    {
      headers: {
        Authorization: `Bearer ${String(process.env.CHATGPT_API_KEY)}`,
      },
    },
  );

  if (resp.status === 200) {
    const respMessage = resp.data.choices[0].message;
    tempMessages.push(userMessage, respMessage);
    return respMessage.content;
  } else {
    return resp.statusText;
  }
};
