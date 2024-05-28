import refreshSession from "./refresh-session";
import { IS_ALIST_ENABLED } from "constants/alist";

if (IS_ALIST_ENABLED) {
  refreshSession();
}
