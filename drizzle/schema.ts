import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, index, uniqueIndex } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const universes = mysqlTable("universes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ nameIdx: uniqueIndex("universes_name_idx").on(table.name) }));

export const franchises = mysqlTable("franchises", {
  id: int("id").autoincrement().primaryKey(),
  universeId: int("universeId"),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }),
  description: text("description"),
  coverImageUrl: varchar("coverImageUrl", { length: 1024 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ universeIdx: index("franchises_universe_idx").on(table.universeId) }));

export const works = mysqlTable("works", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 128 }),
  source: varchar("source", { length: 32 }),
  franchiseId: int("franchiseId"),
  universeId: int("universeId"),
  title: varchar("title", { length: 500 }).notNull(),
  titleAr: varchar("titleAr", { length: 500 }),
  type: mysqlEnum("type", ["anime", "manga", "film", "series", "ova", "animation"]).notNull(),
  releaseYear: int("releaseYear"),
  releaseDate: timestamp("releaseDate"),
  studio: varchar("studio", { length: 255 }),
  director: varchar("director", { length: 255 }),
  ageRating: varchar("ageRating", { length: 32 }),
  score: decimal("score", { precision: 4, scale: 2 }),
  summary: text("summary"),
  summaryAr: text("summaryAr"),
  episodeCount: int("episodeCount"),
  durationMinutes: int("durationMinutes"),
  coverImageUrl: varchar("coverImageUrl", { length: 1024 }),
  bannerImageUrl: varchar("bannerImageUrl", { length: 1024 }),
  canonLabel: varchar("canonLabel", { length: 128 }),
  brand: varchar("brand", { length: 64 }),
  storyOrder: int("storyOrder"),
  eventOrder: int("eventOrder"),
  popularity: int("popularity").default(0).notNull(),
  isFeatured: int("isFeatured").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ searchIdx: index("works_search_idx").on(table.title, table.titleAr), filtersIdx: index("works_filters_idx").on(table.type, table.releaseYear, table.studio), extIdx: uniqueIndex("works_external_idx").on(table.source, table.externalId) }));

export const workRelations = mysqlTable("workRelations", {
  id: int("id").autoincrement().primaryKey(),
  fromWorkId: int("fromWorkId").notNull(),
  toWorkId: int("toWorkId").notNull(),
  relationType: mysqlEnum("relationType", ["sequel", "side_story", "remake", "reboot", "prequel", "spin_off"]).notNull(),
  chronologicalOrder: int("chronologicalOrder"),
  releaseOrder: int("releaseOrder"),
}, table => ({ fromIdx: index("work_rel_from_idx").on(table.fromWorkId), toIdx: index("work_rel_to_idx").on(table.toWorkId) }));

export const entities = mysqlTable("entities", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 128 }),
  source: varchar("source", { length: 32 }),
  kind: mysqlEnum("kind", ["character", "unit", "weapon", "vehicle", "creature"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }),
  imageUrl: varchar("imageUrl", { length: 1024 }),
  description: text("description"),
  descriptionAr: text("descriptionAr"),
  abilities: text("abilities"),
  relationships: text("relationships"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ kindIdx: index("entities_kind_idx").on(table.kind), nameIdx: index("entities_name_idx").on(table.name, table.nameAr), externalIdx: uniqueIndex("entities_external_idx").on(table.source, table.externalId) }));

export const entityRelations = mysqlTable("entityRelations", {
  id: int("id").autoincrement().primaryKey(),
  fromEntityId: int("fromEntityId").notNull(),
  toEntityId: int("toEntityId").notNull(),
  relationType: mysqlEnum("relationType", ["co_appearance", "family", "ally", "rival", "mentor", "team"]).notNull(),
  label: varchar("label", { length: 255 }),
}, table => ({
  fromIdx: index("entity_rel_from_idx").on(table.fromEntityId),
  toIdx: index("entity_rel_to_idx").on(table.toEntityId),
  uniqueLink: uniqueIndex("entity_rel_unique_idx").on(table.fromEntityId, table.toEntityId, table.relationType),
}));

export const workEntities = mysqlTable("workEntities", {
  id: int("id").autoincrement().primaryKey(),
  workId: int("workId").notNull(),
  entityId: int("entityId").notNull(),
  role: varchar("role", { length: 128 }),
  isMain: int("isMain").default(0).notNull(),
}, table => ({ workIdx: index("work_entities_work_idx").on(table.workId), entityIdx: index("work_entities_entity_idx").on(table.entityId), uniqueLink: uniqueIndex("work_entity_unique_idx").on(table.workId, table.entityId) }));

export const syncRuns = mysqlTable("syncRuns", {
  id: int("id").autoincrement().primaryKey(),
  source: varchar("source", { length: 32 }).notNull(),
  status: mysqlEnum("status", ["running", "success", "failed"]).notNull(),
  itemsProcessed: int("itemsProcessed").default(0).notNull(),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  finishedAt: timestamp("finishedAt"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Work = typeof works.$inferSelect;
export type Entity = typeof entities.$inferSelect;
export type Franchise = typeof franchises.$inferSelect;
