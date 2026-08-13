import { syncAniListRelationsPage } from "../server/anilist";

let nextPage = 1;
async function worker() {
  while (true) {
    const page = nextPage++;
    if (page > 40) return;
    let lastError: unknown;
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        console.log(JSON.stringify(await syncAniListRelationsPage(page, 50)));
        lastError = undefined;
        break;
      } catch (error) {
        lastError = error;
        await new Promise(resolve => setTimeout(resolve, attempt * 2500));
      }
    }
    if (lastError) throw lastError;
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
console.log(JSON.stringify({ completed: true, pages: 40 }));
