import packageJson from "../../package.json";
import axios from "axios";

const instance = axios.create({
  timeout: 15000,
  headers: { "X-TELLY-BOT-VERSION": packageJson.version },
});

export default instance;
