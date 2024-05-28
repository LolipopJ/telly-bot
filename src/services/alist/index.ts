import consola from "consola";
import type { IAListResponse } from "interfaces/alist";
import axios from "utils/axios";

let session: string | undefined;
export const refreshAListSession = async () => {
  try {
    consola.info(
      `Refreshing AList session with user: \`${String(process.env.ALIST_USERNAME)}:${String(process.env.ALIST_PASSWORD)}\`...`,
    );
    const resp = await axios.post<IAListResponse<{ token: string }>>(
      `${String(process.env.ALIST_URL)}/api/auth/login`,
      {
        username: String(process.env.ALIST_USERNAME),
        password: String(process.env.ALIST_PASSWORD),
      },
    );
    session = resp.data.data?.token;
    consola.success(`Refresh AList session successfully.`);
  } catch (err: unknown) {
    throw new Error(`Refresh AList session failed:\n${String(err)}`);
  }
};

export const getAListSession = () => {
  return session;
};

export default getAListSession;
