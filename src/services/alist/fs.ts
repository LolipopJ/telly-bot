import type {
  IAListResponse,
  IAListFile,
  IAListFileDetails,
} from "interfaces/alist";
import { getAlistSession } from "utils/alist";
import axios from "utils/axios";
import { baseErrorHandler } from "utils/error-handler";
import { genRandomNumber } from "utils/math";

export const listFiles = async (options: {
  path: string;
  password?: string;
  page?: number;
  per_page?: number;
  refresh?: boolean;
}) => {
  const resp = await axios.post<
    IAListResponse<{
      content: IAListFile[];
      total: number;
      readme: string;
      header: string;
      write: boolean;
      provider: string;
    }>
  >(`${String(process.env.ALIST_ADDRESS)}/api/fs/list`, options, {
    headers: { Authorization: getAlistSession() },
  });

  return resp.data;
};

export const getFileDetails = async (options: {
  path: string;
  password?: string;
  refresh?: boolean;
}) => {
  const resp = await axios.post<IAListResponse<IAListFileDetails>>(
    `${String(process.env.ALIST_ADDRESS)}/api/fs/get`,
    options,
    {
      headers: { Authorization: getAlistSession() },
    },
  );

  return resp.data;
};

export const getRandomFile = async (options: {
  path: string;
  password?: string;
  refresh?: boolean;
}) => {
  const listFilesResp = await listFiles({ ...options, page: 1, per_page: 1 });

  if (listFilesResp.code === 200 && !!listFilesResp.data) {
    const total = listFilesResp.data.total;
    const randomNumber = genRandomNumber(1, total);

    const listRandomFileResp = await listFiles({
      ...options,
      page: randomNumber,
      per_page: 1,
    });

    if (listRandomFileResp.code === 200 && !!listRandomFileResp.data) {
      const filename = listRandomFileResp.data.content[0].name;
      const filePath = `${options.path}/${filename}`;

      const getFileDetailsResp = await getFileDetails({
        ...options,
        path: filePath,
      });

      if (getFileDetailsResp.code === 200 && !!getFileDetailsResp.data) {
        return getFileDetailsResp.data;
      } else {
        baseErrorHandler(
          "Get random file from AList failed:",
          `Get file \`${filePath}\` details failed.\n${JSON.stringify(getFileDetailsResp)}`,
        );
      }
    } else {
      baseErrorHandler(
        "Get random file from AList failed:",
        `Get basic info of random file \`${options.path}[#${String(randomNumber)}]\` failed.\n${JSON.stringify(listRandomFileResp)}`,
      );
    }
  } else {
    baseErrorHandler(
      "Get random file from AList failed:",
      `List file list in \`${options.path}\` failed.\n${JSON.stringify(listFilesResp)}`,
    );
  }
};
