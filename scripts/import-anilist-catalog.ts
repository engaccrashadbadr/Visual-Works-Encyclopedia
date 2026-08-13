import { syncAniListCatalog } from "../server/anilist";

const target = Number(process.argv[2] || 2000);
const result = await syncAniListCatalog(Math.min(Math.max(target, 1), 2000));
console.log(JSON.stringify(result));
