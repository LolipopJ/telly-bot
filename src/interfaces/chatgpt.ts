export enum IChatType {
  DEFAULT = "default",
  DAN = "dan",
  CAT_GIRL = "cat-girl",
  NEKO = "neko",
  SUCCUBUS = "succubus",
  LUNA = "luna",
  SEXY_GIRLFRIEND = "sexy-girlfriend",
  POET = "poet",
  TRANSLATOR_TO_ZH = "translator-to-zh",
  INTIMATE_SISTER = "intimate-sister",
  PSYCHOLOGIST = "psychologist",
  PROMPT_GENERATOR = "prompt-generator",
  MADMAN = "madman",
  DRUNK = "drunk",
  SOCRATES = "socrates",
  RED_BOOK = "red-book",
  SELFISH = "selfish",
  MESUGAKI = "mesugaki",
  MESUGAKI_2 = "mesugaki-2",
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
