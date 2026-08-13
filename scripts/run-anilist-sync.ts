import { syncAniList } from "../server/anilist";

const page = Number(process.argv[2] || 1);
const perPage = Number(process.argv[3] || 25);
const result = await syncAniList(page, perPage);
console.log(JSON.stringify(result));
