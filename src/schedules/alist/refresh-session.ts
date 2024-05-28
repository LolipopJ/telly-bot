import { consola } from "consola";
import schedule from "node-schedule";
import { refreshAListSession } from "services/alist";

export default () =>
  schedule.scheduleJob("0 * * * *", async () => {
    try {
      await refreshAListSession();
    } catch (err: unknown) {
      consola.warn(String(err));
    }
  });
