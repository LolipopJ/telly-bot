export enum IChatType {
  DEFAULT = "default",
  CAT_GIRL = "cat-girl",
  POET = "poet",
}

export interface IChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface IChatChoice {
  index: number;
  message: IChatMessage;
  finish_reason: string;
}

export interface IChatResponse {
  id: string;
  object: string;
  created: number;
  choices: IChatChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ICAKeyBalance {
  id: number;
  apiKey: string;
  adminKeyId: number;
  balanceTotal: number;
  balanceUsed: number;
  status: number;
}
