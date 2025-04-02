export const getUrlFromFilename = (filename: string) => {
  const pixivFilenameReg = /(\d+)_p(\d+)\.(.+)/;

  const match = pixivFilenameReg.exec(filename);
  if (match) {
    const pixivArtworkId = match[1];
    const pixivArtworkPage = String(Number(match[2]) + 1);
    return `https://www.pixiv.net/artworks/${pixivArtworkId}#${pixivArtworkPage}`;
  }

  return undefined;
};
