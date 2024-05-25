import axios from "axios";
import packageJson from "../../package.json";

const instance = axios.create({
  timeout: 15000,
  headers: { "X-TELLY-BOT-VERSION": packageJson.version },
});

export default instance;
