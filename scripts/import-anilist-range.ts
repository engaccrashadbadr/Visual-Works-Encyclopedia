import { syncAniList } from "../server/anilist";

const start = Math.max(1, Number(process.argv[2] || 1));
const end = Math.max(start, Number(process.argv[3] || 40));
const perPage = 50;
const concurrency = 3;
let nextPage = start;

async function runPage(page: number) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const result = await syncAniList(page, perPage);
      console.log(JSON.stringify({ page, processed: result.processed, attempt }));
      return;
    } catch (error) {
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, attempt * 3000));
    }
  }
  throw lastError;
}

async function worker() {
  while (true) {
    const page = nextPage++;
    if (page > end) return;
    await runPage(page);
    await new Promise(resolve => setTimeout(resolve, 700));
  }
}

await Promise.all(Array.from({ length: concurrency }, worker));
console.log(JSON.stringify({ start, end, completed: true }));
