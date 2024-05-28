import packageJson from "../../package.json";

export const PORT = Number(process.env.PORT) || 3300;
export const IS_DEVELOPMENT = process.env.NODE_ENV === "development";
export const USER_AGENT = `${packageJson.name}/v${packageJson.version}`;
