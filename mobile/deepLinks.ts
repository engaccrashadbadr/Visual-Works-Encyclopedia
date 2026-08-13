export const PRODUCTION_URL = "https://visualworks-cnmtcefg.manus.space";

export function resolveWebUrl(url: string | null) {
  if (!url) return null;
  if (url.startsWith("visualworks://")) {
    const path = url.slice("visualworks://".length).replace(/^\/+/, "");
    return `${PRODUCTION_URL}/${path}`;
  }
  if (url.startsWith(PRODUCTION_URL)) return url;
  return null;
}
