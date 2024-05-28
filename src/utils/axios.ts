import axios from "axios";
import { USER_AGENT } from "constants/server";

const instance = axios.create({
  timeout: 15000,
  headers: { "User-Agent": USER_AGENT },
});

export default instance;
