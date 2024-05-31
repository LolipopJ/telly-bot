import {
  DEFAULT_MODEL,
  MESSAGE_MAX_LENGTH,
  MESSAGE_SYSTEM_CONTENT,
} from "constants/chatgpt";
import {
  IChatType,
  type IChatMessage,
  type IChatResponse,
} from "interfaces/chatgpt";
import axios from "utils/axios";

// TODO: If mongodb is enabled, save temp messages to database
const tempMessages: Record<number, Record<IChatType, IChatMessage[]>> = {};
export const chat = async (
  chatId: number,
  content: string,
  type = IChatType.CAT_GIRL,
) => {
  if (typeof tempMessages[chatId] !== "object") {
    // @ts-expect-error: initialize temp messages with empty object
    tempMessages[chatId] = {};
  }

  if (!Array.isArray(tempMessages[chatId][type])) {
    tempMessages[chatId][type] = [];
  }

  if (tempMessages[chatId][type].length > MESSAGE_MAX_LENGTH * 2) {
    tempMessages[chatId][type] = tempMessages[chatId][type].slice(2);
  }

  const userMessage: IChatMessage = { role: "user", content };
  try {
    const resp = await axios.post<IChatResponse>(
      // API docs: https://chatanywhere.apifox.cn/api-92222076
      "https://api.chatanywhere.tech/v1/chat/completions",
      {
        model: String(process.env.CHATGPT_MODEL) || DEFAULT_MODEL,
        messages: [
          { role: "system", content: MESSAGE_SYSTEM_CONTENT[type] },
          ...tempMessages[chatId][type],
          userMessage,
        ] as IChatMessage[],
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

    const respMessage = resp.data.choices[0].message;
    tempMessages[chatId][type].push(userMessage, respMessage);
    return respMessage.content;
  } catch (error: unknown) {
    return `Get chat response failed: ${String(error)}`;
  }
};

export default chat;
