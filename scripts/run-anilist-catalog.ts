import { syncAniListMediaCatalog } from "../server/anilist";

const mediaType = (process.argv[2] || "ANIME") as "ANIME" | "MANGA";
const target = Number(process.argv[3] || 250);
const fromYear = Number(process.argv[4] || 1970);
const toYear = Number(process.argv[5] || 2026);
const startPage = Number(process.argv[6] || 1);
if (!(["ANIME", "MANGA"] as string[]).includes(mediaType)) throw new Error("mediaType must be ANIME or MANGA");
console.log(JSON.stringify(await syncAniListMediaCatalog(mediaType, target, fromYear, toYear, startPage)));
