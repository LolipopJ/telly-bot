import type { IMinecraftServerStatus } from "interfaces/minecraft";
import axios from "utils/axios";

export const queryMinecraftServerStatus = async (host: string) => {
  return await axios.get<IMinecraftServerStatus>(
    `https://api.mcstatus.io/v2/status/java/${host}`,
  );
};

export default queryMinecraftServerStatus;
