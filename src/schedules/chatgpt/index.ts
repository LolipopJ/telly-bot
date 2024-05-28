import queryBalance from "./query-balance";
import { IS_CHATGPT_ENABLED } from "constants/chatgpt";

if (IS_CHATGPT_ENABLED) {
  queryBalance();
}
