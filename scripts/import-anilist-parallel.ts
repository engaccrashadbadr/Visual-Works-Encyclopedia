import { syncAniList } from "../server/anilist";

const target = Math.min(Math.max(Number(process.argv[2] || 2000), 1), 2000);
const perPage = 50;
const totalPages = Math.ceil(target / perPage);
const concurrency = 4;
let nextPage = 1;
let processed = 0;

async function worker() {
  while (true) {
    const page = nextPage++;
    if (page > totalPages) return;
    const result = await syncAniList(page, perPage);
    processed += result.processed;
    console.log(JSON.stringify({ page, processed: result.processed, totalProcessed: processed }));
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

await Promise.all(Array.from({ length: concurrency }, worker));
console.log(JSON.stringify({ target, processed, pages: totalPages, concurrency }));
