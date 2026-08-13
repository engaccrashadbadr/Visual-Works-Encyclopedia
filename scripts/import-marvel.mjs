import mysql from "mysql2/promise";

const timeline = [
  ["Eyes of Wakanda", "series", 2025],
  ["Captain America: The First Avenger", "film", 2011],
  ["Marvel Studios One Shot: Agent Carter", "animation", 2013],
  ["Captain Marvel", "film", 2019],
  ["Iron Man", "film", 2008],
  ["Iron Man 2", "film", 2010],
  ["The Incredible Hulk", "film", 2008],
  ["A Funny Thing Happened on the Way to Thor's Hammer", "animation", 2011],
  ["Thor", "film", 2011],
  ["The Consultant", "animation", 2011],
  ["The Avengers", "film", 2012],
  ["Item 47", "animation", 2012],
  ["Thor: The Dark World", "film", 2013],
  ["Iron Man 3", "film", 2013],
  ["All Hail the King", "animation", 2014],
  ["Captain America: The Winter Soldier", "film", 2014],
  ["Guardians of the Galaxy", "film", 2014],
  ["Guardians of the Galaxy Vol. 2", "film", 2017],
  ["I Am Groot Season 1", "series", 2022],
  ["I Am Groot Season 2", "series", 2023],
  ["Daredevil Season 1", "series", 2015],
  ["Jessica Jones Season 1", "series", 2015],
  ["Avengers: Age of Ultron", "film", 2015],
  ["Ant-Man", "film", 2015],
  ["Daredevil Season 2", "series", 2016],
  ["Luke Cage Season 1", "series", 2016],
  ["Iron Fist Season 1", "series", 2017],
  ["The Defenders", "series", 2017],
  ["Captain America: Civil War", "film", 2016],
  ["Black Widow", "film", 2021],
  ["Black Panther", "film", 2018],
  ["Spider-Man: Homecoming", "film", 2017],
  ["The Punisher Season 1", "series", 2017],
  ["Doctor Strange", "film", 2016],
  ["Jessica Jones Season 2", "series", 2018],
  ["Luke Cage Season 2", "series", 2018],
  ["Iron Fist Season 2", "series", 2018],
  ["Daredevil Season 3", "series", 2018],
  ["Thor: Ragnarok", "film", 2017],
  ["The Punisher Season 2", "series", 2019],
  ["Jessica Jones Season 3", "series", 2019],
  ["Ant-Man and the Wasp", "film", 2018],
  ["Avengers: Infinity War", "film", 2018],
  ["Avengers: Endgame", "film", 2019],
  ["Loki Season 1", "series", 2021],
  ["What If...? Season 1", "animation", 2021],
  ["Marvel Zombies", "animation", 2025],
  ["WandaVision", "series", 2021],
  ["Shang-Chi and the Legend of the Ten Rings", "film", 2021],
  ["The Falcon and the Winter Soldier", "series", 2021],
  ["Spider-Man: Far From Home", "film", 2019],
  ["Eternals", "film", 2021],
  ["Spider-Man: No Way Home", "film", 2021],
  ["Doctor Strange in the Multiverse of Madness", "film", 2022],
  ["Hawkeye", "series", 2021],
  ["Moon Knight", "series", 2022],
  ["Black Panther: Wakanda Forever", "film", 2022],
  ["Echo", "series", 2024],
  ["She-Hulk: Attorney at Law", "series", 2022],
  ["Ms. Marvel", "series", 2022],
  ["Thor: Love and Thunder", "film", 2022],
  ["Ironheart", "series", 2025],
  ["Werewolf by Night", "animation", 2022],
  ["The Guardians of the Galaxy Holiday Special", "animation", 2022],
  ["Ant-Man and the Wasp: Quantumania", "film", 2023],
  ["Guardians of the Galaxy Vol. 3", "film", 2023],
  ["Secret Invasion", "series", 2023],
  ["The Marvels", "film", 2023],
  ["Loki Season 2", "series", 2023],
  ["What If...? Season 2", "animation", 2023],
  ["Deadpool & Wolverine", "film", 2024],
  ["Agatha All Along", "series", 2024],
  ["What If...? Season 3", "animation", 2024],
  ["Daredevil: Born Again Season 1", "series", 2025],
  ["Captain America: Brave New World", "film", 2025],
  ["Thunderbolts*", "film", 2025],
  ["The Fantastic Four: First Steps", "film", 2025],
  ["Wonder Man", "series", 2026],
  ["Daredevil: Born Again Season 2", "series", 2026],
  ["The Punisher: One Last Kill", "film", 2026]
];

const eventTimeline = [
  "Captain America: The First Avenger", "Captain Marvel", "Iron Man", "Iron Man 2", "The Incredible Hulk", "Thor", "The Avengers", "Iron Man 3", "Thor: The Dark World", "Captain America: The Winter Soldier", "Guardians of the Galaxy", "Guardians of the Galaxy Vol. 2", "Daredevil Season 1", "Jessica Jones Season 1", "Avengers: Age of Ultron", "Ant-Man", "Daredevil Season 2", "Luke Cage Season 1", "Iron Fist Season 1", "The Defenders", "Captain America: Civil War", "Black Widow", "Black Panther", "Spider-Man: Homecoming", "Doctor Strange", "The Punisher Season 1", "Thor: Ragnarok", "The Punisher Season 2", "Jessica Jones Season 2", "Jessica Jones Season 3", "Ant-Man and the Wasp", "Avengers: Infinity War", "Avengers: Endgame", "Loki Season 1", "What If...? Season 1", "WandaVision", "The Falcon and the Winter Soldier", "Shang-Chi and the Legend of the Ten Rings", "Spider-Man: Far From Home", "Eternals", "Spider-Man: No Way Home", "Hawkeye", "Doctor Strange in the Multiverse of Madness", "Moon Knight", "Black Panther: Wakanda Forever", "She-Hulk: Attorney at Law", "Ms. Marvel", "Thor: Love and Thunder", "Werewolf by Night", "The Guardians of the Galaxy Holiday Special", "Ant-Man and the Wasp: Quantumania", "Guardians of the Galaxy Vol. 3", "Secret Invasion", "The Marvels", "Loki Season 2", "What If...? Season 2", "Echo", "Deadpool & Wolverine", "Agatha All Along", "What If...? Season 3", "Ironheart", "Eyes of Wakanda", "Marvel Zombies", "Captain America: Brave New World", "Thunderbolts*", "The Fantastic Four: First Steps", "Daredevil: Born Again Season 1", "Wonder Man", "Daredevil: Born Again Season 2", "The Punisher: One Last Kill", "I Am Groot Season 1", "I Am Groot Season 2", "Marvel Studios One Shot: Agent Carter", "The Consultant", "A Funny Thing Happened on the Way to Thor's Hammer", "Item 47", "All Hail the King"
];
const eventOrderByTitle = new Map(eventTimeline.map((title, index) => [title, index + 1]));
const slug = value => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const conn = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await conn.execute("INSERT IGNORE INTO universes (name, nameAr, description) VALUES (?, ?, ?)", ["Marvel Cinematic Universe", "عالم مارفل السينمائي", "Official Marvel Studios screen timeline; release and story order are kept separately."]);
  const [universeRows] = await conn.execute("SELECT id FROM universes WHERE name = ? LIMIT 1", ["Marvel Cinematic Universe"]);
  const universeId = universeRows[0].id;
  await conn.execute("INSERT IGNORE INTO franchises (universeId, name, nameAr, description) VALUES (?, ?, ?, ?)", [universeId, "Marvel Studios / MCU", "مارفل ستوديوز / MCU", "Official Marvel Studios films, series, specials, and animation timeline."]);
  const [franchiseRows] = await conn.execute("SELECT id FROM franchises WHERE name = ? LIMIT 1", ["Marvel Studios / MCU"]);
  const franchiseId = franchiseRows[0].id;
  for (let index = 0; index < timeline.length; index++) {
    const [title, type, year] = timeline[index];
    await conn.execute(
      `INSERT INTO works (externalId, source, franchiseId, universeId, title, type, releaseYear, brand, storyOrder, eventOrder, canonLabel, summary, popularity)
       VALUES (?, 'marvel', ?, ?, ?, ?, ?, 'marvel', ?, ?, 'MCU official timeline', ?, 900)
       ON DUPLICATE KEY UPDATE franchiseId=VALUES(franchiseId), universeId=VALUES(universeId), title=VALUES(title), type=VALUES(type), releaseYear=VALUES(releaseYear), brand='marvel', storyOrder=VALUES(storyOrder), eventOrder=VALUES(eventOrder), canonLabel=VALUES(canonLabel), summary=VALUES(summary)`,
      [`mcu-${slug(title)}`, franchiseId, universeId, title, type, year, index + 1, eventOrderByTitle.get(title) || 1000 + index, "Entry from Marvel's official MCU Complete Timeline; event order is curated separately from publication order."]
    );
  }
  console.log(JSON.stringify({ source: "marvel", imported: timeline.length, universeId, franchiseId }));
} finally {
  await conn.end();
}
