import refreshRoutesPath from "./alist/refresh-routes-path";
import refreshSession from "./alist/refresh-session";
import queryBalance from "./chatgpt/query-balance";
import monitorMinecraftServer from "./minecraft/monitor";
import { IS_ALIST_ENABLED } from "constants/alist";
import { IS_CHATGPT_ENABLED } from "constants/chatgpt";
import { IS_GITHUB_API_ENABLED } from "constants/github";
import { IS_MINECRAFT_ENABLED } from "constants/minecraft";

export default () => {
  if (IS_ALIST_ENABLED) {
    refreshSession();
    refreshRoutesPath();
  }

  if (IS_CHATGPT_ENABLED) {
    queryBalance();
  }

  if (IS_GITHUB_API_ENABLED) {
    // to be added.
  }

  if (IS_MINECRAFT_ENABLED) {
    monitorMinecraftServer();
  }
};
