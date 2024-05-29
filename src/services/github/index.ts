import consola from "consola";
import { USER_AGENT } from "constants/server";
import { Octokit } from "octokit";

let instance: Octokit | undefined;
export const connectGithub = async () => {
  if (!instance && !!process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
    const octokit = new Octokit({
      auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
      userAgent: USER_AGENT,
    });

    try {
      consola.info(
        `Try to connect to Github with access token: \`${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}\`...`,
      );
      const {
        data: { login },
      } = await octokit.rest.users.getAuthenticated();
      instance = octokit;
      consola.success(`Connect to Github successfully. Hello, \`${login}\``);
    } catch (err: unknown) {
      throw new Error(`Connect to Github failed: ${String(err)}`);
    }
  }

  return instance;
};

export default connectGithub;
