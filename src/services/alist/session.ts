import type { IAListResponse } from "interfaces/alist";
import axios from "utils/axios";

export const getAListSession = async () => {
  const resp = await axios.post<IAListResponse<{ token: string }>>(
    `${String(process.env.ALIST_ADDRESS)}/api/auth/login`,
    {
      username: String(process.env.ALIST_USERNAME),
      password: String(process.env.ALIST_PASSWORD),
    },
  );

  return resp.data;
};

export default getAListSession;
