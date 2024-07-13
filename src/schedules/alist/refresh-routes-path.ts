import { consola } from "consola";
import { ALIST_ROUTES } from "constants/alist";
import schedule from "node-schedule";
import { listFiles } from "services/alist/fs";

export default () => {
  const job = schedule.scheduleJob("*/30 * * * *", () => {
    const alistRoutePaths = ALIST_ROUTES.map((route) => route.path).filter(
      (path) => !!path,
    );
    alistRoutePaths.forEach((path) => {
      consola.info(`Start to refresh AList path \`${path}\``);
      listFiles({ path, page: 1, per_page: 1 })
        .then(() => {
          consola.success(`Refresh AList path \`${path}\` successfully.`);
        })
        .catch((error: unknown) => {
          consola.warn(
            `Get a wrong response while refreshing AList path \`${path}\`: ${String(error)}
This may be caused by a service exception or the path contains too many files.`,
          );
        });
    });
  });

  job.invoke();
};
