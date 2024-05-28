import bot from "bot";
import { consola } from "consola";
import type { IMinecraftServerPlayer } from "interfaces/minecraft";
import { differenceBy } from "lodash-es";
import schedule from "node-schedule";
import queryMinecraftServerStatus from "services/minecraft/status";
import { baseErrorHandler } from "utils/error-handler";

let prevPlayers: IMinecraftServerPlayer[] | undefined;
export default () => {
  if (
    (!!process.env.TELEGRAM_CHAT_ID_MINECRAFT_MONITOR ||
      !!process.env.TELEGRAM_CHAT_ID_ADMIN) &&
    !!process.env.MINECRAFT_SERVER_HOST
  ) {
    const job = schedule.scheduleJob("*/1 * * * *", async () => {
      consola.info(
        `Try to query status of Minecraft server \`${String(process.env.MINECRAFT_SERVER_HOST)}\`...`,
      );
      const resp = await queryMinecraftServerStatus(
        String(process.env.MINECRAFT_SERVER_HOST),
      );

      if (resp.status === 200) {
        const respData = resp.data;
        const { list: currentPlayers, online, max } = respData.players;

        consola.success(
          `Query status of Minecraft server successfully. Current players (${String(online)} / ${String(max)}): ${currentPlayers.map((player) => player.name_clean).join(", ")}`,
        );

        if (!prevPlayers) {
          prevPlayers = currentPlayers;
          return;
        }

        const newPlayers = differenceBy(currentPlayers, prevPlayers, "uuid");
        const leavedPlayers = differenceBy(prevPlayers, currentPlayers, "uuid");

        prevPlayers = currentPlayers;

        if (newPlayers.length || leavedPlayers.length) {
          const content =
            `<strong>Minecraft monitoring: ${respData.host}</strong>\n\n` +
            (newPlayers.length
              ? `${newPlayers.map((player) => player.name_clean).join(", ")} joined the server.\n\n`
              : "") +
            (leavedPlayers.length
              ? `${leavedPlayers.map((player) => player.name_clean).join(", ")} left the server.\n\n`
              : "") +
            `<i>Current players (${String(online)} / ${String(max)}): ${currentPlayers.map((player) => player.name_clean).join(", ")}</i>`;

          bot
            .sendMessage(
              Number(
                process.env.TELEGRAM_CHAT_ID_MINECRAFT_MONITOR ??
                  process.env.TELEGRAM_CHAT_ID_ADMIN,
              ),
              content,
              {
                parse_mode: "HTML",
              },
            )
            .then(() => {
              consola.success(
                `Bot \`send Minecraft server monitoring\` to target chat success:\n${content}`,
              );
            })
            .catch((error: unknown) => {
              baseErrorHandler(
                "Send Minecraft server monitoring to target chat failed:",
                error,
              );
            });
        }
      } else {
        consola.warn(
          `Query status of Minecraft server failed: ${resp.statusText}`,
        );
      }
    });

    job.invoke();
  }
};
