import consola from "consola";
import type { IAListResponse } from "interfaces/alist";
import axios from "utils/axios";

let session: string | undefined;
export const refreshAListSession = async () => {
  try {
    consola.info(
      `Try to refresh AList session with uri: \`${String(process.env.ALIST_URL)}/api/auth/login\`, user: \`${String(process.env.ALIST_USERNAME)}:${String(process.env.ALIST_PASSWORD)}\`...`,
    );
    const resp = await axios.post<IAListResponse<{ token: string }>>(
      `${String(process.env.ALIST_URL)}/api/auth/login`,
      {
        username: String(process.env.ALIST_USERNAME),
        password: String(process.env.ALIST_PASSWORD),
      },
    );
    const token = resp.data.data?.token;
    if (!token) throw new Error(resp.data.message);

    session = token;
    consola.success(
      `Refresh AList session successfully. Session token: ${token}`,
    );
  } catch (err: unknown) {
    throw new Error(`Refresh AList session failed: ${String(err)}`);
  }
};

export const getAListSession = () => {
  return session;
};

export default getAListSession;
