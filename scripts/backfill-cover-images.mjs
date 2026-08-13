import mysql from "mysql2/promise";

const api = "https://en.wikipedia.org/api/rest_v1/page/summary/";
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function candidates(title) {
  return [
    title,
    title.replace(/ Season \d+$/i, ""),
    title.replace(/ Season \d+$/i, " (TV series)"),
    title.replace(/\*$/, ""),
  ].filter((value, index, list) => value && list.indexOf(value) === index);
}

async function lookup(title) {
  for (const candidate of candidates(title)) {
    const response = await fetch(`${api}${encodeURIComponent(candidate)}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "VisualWorksEncyclopedia/1.0 (cover-backfill)",
      },
    });
    if (!response.ok) {
      if (response.status !== 404) await sleep(350);
      continue;
    }
    const data = await response.json();
    const image = data.originalimage?.source || data.thumbnail?.source;
    if (image)
      return {
        image,
        page: data.content_urls?.desktop?.page || null,
        matchedTitle: data.title || candidate,
      };
  }
  const pageImages = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(title)}&gsrlimit=5&gsrnamespace=0&prop=pageimages|info&piprop=original|thumbnail&pithumbsize=780&inprop=url&format=json&redirects=1`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "VisualWorksEncyclopedia/1.0 (cover-backfill)",
      },
    }
  );
  if (pageImages.ok) {
    const pages = Object.values((await pageImages.json()).query?.pages || {});
    const exactPage =
      pages.find(
        page => String(page.title || "").toLowerCase() === title.toLowerCase()
      ) || pages[0];
    const image = exactPage?.original?.source || exactPage?.thumbnail?.source;
    if (image)
      return {
        image,
        page: exactPage.fullurl || null,
        matchedTitle: exactPage.title,
      };
  }
  const commons = await fetch(
    `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(title)}&gsrlimit=5&gsrnamespace=6&prop=imageinfo&iiprop=url|mime&iiurlwidth=780&format=json`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "VisualWorksEncyclopedia/1.0 (cover-backfill)",
      },
    }
  );
  if (commons.ok) {
    const pages = Object.values((await commons.json()).query?.pages || {});
    const exactFile =
      pages.find(page =>
        String(page.title || "")
          .toLowerCase()
          .includes(title.toLowerCase())
      ) || pages[0];
    const info = exactFile?.imageinfo?.[0];
    if (info?.mime?.startsWith("image/") && (info.thumburl || info.url)) {
      return {
        image: info.thumburl || info.url,
        page: `https://commons.wikimedia.org/wiki/${encodeURIComponent(exactFile.title)}`,
        matchedTitle: exactFile.title,
      };
    }
  }
  const search = await fetch(
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(title)}&language=en&format=json&limit=5`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "VisualWorksEncyclopedia/1.0 (cover-backfill)",
      },
    }
  );
  if (!search.ok) return null;
  const results = (await search.json()).search || [];
  const exact = results.find(
    item => String(item.label || "").toLowerCase() === title.toLowerCase()
  );
  if (!exact?.id) return null;
  const entityResponse = await fetch(
    `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${exact.id}&props=claims|info&format=json`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "VisualWorksEncyclopedia/1.0 (cover-backfill)",
      },
    }
  );
  if (!entityResponse.ok) return null;
  const entity = (await entityResponse.json()).entities?.[exact.id];
  const file = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
  if (!file) return null;
  return {
    image: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=780`,
    page: `https://www.wikidata.org/wiki/${exact.id}`,
    matchedTitle: exact.label,
  };
}

const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await db.execute(
    "SELECT id, title FROM works WHERE (coverImageUrl IS NULL OR coverImageUrl = '') ORDER BY id"
  );
  let updated = 0;
  let missing = 0;
  for (const row of rows) {
    const match = await lookup(row.title);
    if (!match) {
      missing++;
      continue;
    }
    await db.execute(
      "UPDATE works SET coverImageUrl = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND (coverImageUrl IS NULL OR coverImageUrl = '')",
      [match.image, row.id]
    );
    updated++;
    console.log(
      JSON.stringify({
        id: row.id,
        title: row.title,
        matchedTitle: match.matchedTitle,
        image: match.image,
        page: match.page,
      })
    );
    await sleep(120);
  }
  console.log(
    JSON.stringify({
      source: "wikipedia-summary",
      scanned: rows.length,
      updated,
      missing,
    })
  );
} finally {
  await db.end();
}
