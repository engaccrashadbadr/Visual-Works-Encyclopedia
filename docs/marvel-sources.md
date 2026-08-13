# Marvel data sources

The requested Marvel catalog is scoped to the Marvel Studios/MCU screen catalog rather than all Marvel Comics publications. The official Marvel movies page lists Marvel Studios films and separates an "Other Movies" section for related Marvel films: https://www.marvel.com/movies

Marvel's official June 2, 2026 timeline article states that the complete MCU timeline on Disney+ includes films and TV seasons, and provides an ordered list beginning with Eyes of Wakanda and Captain America: The First Avenger and continuing through current entries such as Wonder Man and Daredevil: Born Again: https://www.marvel.com/articles/movies/mcu-timeline-order-disney-plus

AniList provides a source record for Marvel Future Avengers, including format, dates, studio, and Marvel/Disney producer metadata: https://anilist.co/anime/98872/Marvel-Future-Avengers

Implementation note: use the official Marvel timeline for event/story order, the work release year for release-year sorting, and workRelations releaseOrder/chronologicalOrder when explicit relation data exists. Do not present unreleased or announced titles as released works; preserve their status/source metadata if imported.
