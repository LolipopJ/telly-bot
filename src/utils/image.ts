export const getUrlFromFilename = (filename: string) => {
  const pixivFilenameReg = /(\d+)_p(\d+)\.(.+)/;

  const match = pixivFilenameReg.exec(filename);
  if (match) {
    const pixivArtworkId = match[1];
    return `https://www.pixiv.net/artworks/${pixivArtworkId}`;
  }

  return null;
};
