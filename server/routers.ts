import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { syncAniList, syncAniListCatalog } from "./anilist";
import { compareEntities, createEntity, createWork, deleteEntity, deleteWork, getEntityDetails, getEntityRelations, getFranchiseOrder, getLatestSync, getUniverseGraph, getWorkDetails, listFeaturedWorks, listMarvelTimeline, listPopularFranchises, listUniverses, searchCatalog, searchWorks, setEntityImage, setWorkImage, updateEntity, updateWork } from "./db";
import { storagePut } from "./storage";
import { isTmdbEnabled, syncTmdb } from "./tmdb";

const workType = z.enum(["all", "anime", "manga", "film", "series", "ova", "animation"]);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 }); return { success: true } as const; }),
  }),
  catalog: router({
    home: publicProcedure.query(async () => ({ featured: await listFeaturedWorks(), franchises: await listPopularFranchises() })),
    search: publicProcedure.input(z.object({ q: z.string().optional(), type: workType.optional(), year: z.number().optional(), studio: z.string().optional(), minScore: z.number().optional(), limit: z.number().min(1).max(50).optional() })).query(({ input }) => searchWorks(input)),
    searchAll: publicProcedure.input(z.object({ q: z.string().min(1), limit: z.number().min(1).max(50).optional() })).query(({ input }) => searchCatalog(input.q, input.limit)),
    work: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => getWorkDetails(input.id)),
    entity: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => getEntityDetails(input.id)),
    entityRelations: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => getEntityRelations(input.id)),
    compare: publicProcedure.input(z.object({ ids: z.array(z.number()).min(1).max(2) })).query(({ input }) => compareEntities(input.ids)),
    universes: publicProcedure.query(() => listUniverses()),
    graph: publicProcedure.input(z.object({ universeId: z.number().optional() }).optional()).query(({ input }) => getUniverseGraph(input?.universeId)),
    franchiseOrder: publicProcedure.input(z.object({ franchiseId: z.number(), order: z.enum(["chronological", "release"]).default("chronological") })).query(({ input }) => getFranchiseOrder(input.franchiseId, input.order)),
    marvelTimeline: publicProcedure.input(z.object({ order: z.enum(["story", "release", "event"]).default("story") }).optional()).query(({ input }) => listMarvelTimeline(input?.order ?? "story")),
  }),
  assistant: router({
    ask: publicProcedure.input(z.object({ question: z.string().min(2), context: z.string().optional(), language: z.enum(["ar", "en"]).default("en") })).mutation(async ({ input }) => {
      const response = await invokeLLM({ messages: [
        { role: "system", content: `You are Visual Works Encyclopedia's research assistant. Answer accurately and clearly about anime, manga, films, series, OVAs, characters and units. If the user asks for Arabic, translate or answer in Arabic. Never invent ratings, reviews, citations, or factual sources. State uncertainty when data is unavailable. User language: ${input.language}.` },
        { role: "user", content: `${input.context ? `Catalog context:\n${input.context}\n\n` : ""}${input.question}` },
      ] });
      const content = response.choices?.[0]?.message?.content;
      return { answer: typeof content === "string" ? content : "لم أتمكن من توليد إجابة الآن." };
    }),
    translateSummary: publicProcedure.input(z.object({ summary: z.string().min(2) })).mutation(async ({ input }) => {
      const response = await invokeLLM({ messages: [{ role: "system", content: "Translate the following story summary into natural Modern Standard Arabic. Preserve names and meaning. Return only the translation." }, { role: "user", content: input.summary }] });
      const content = response.choices?.[0]?.message?.content;
      return { translation: typeof content === "string" ? content : "" };
    }),
  }),
  admin: router({
    status: protectedProcedure.query(async ({ ctx }) => ({ isAdmin: ctx.user.role === "admin", latestSync: await getLatestSync("anilist"), sources: { anilist: true, tmdb: isTmdbEnabled() } })),
    syncAniList: protectedProcedure.input(z.object({ page: z.number().min(1).max(100).default(1), perPage: z.number().min(1).max(50).default(25) })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Admin access required");
      return syncAniList(input.page, input.perPage);
    }),
    syncAniListCatalog: protectedProcedure.input(z.object({ target: z.number().min(1).max(2000).default(2000) })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Admin access required");
      return syncAniListCatalog(input.target);
    }),
    syncTmdb: protectedProcedure.input(z.object({ page: z.number().min(1).max(20).default(1) })).mutation(async ({ ctx, input }) => { if (ctx.user.role !== "admin") throw new Error("Admin access required"); return syncTmdb(input.page); }),
    createWork: protectedProcedure.input(z.object({ title: z.string().min(1), type: z.enum(["anime", "manga", "film", "series", "ova", "animation"]), titleAr: z.string().optional(), releaseYear: z.number().optional(), studio: z.string().optional(), summary: z.string().optional(), score: z.string().optional() })).mutation(({ ctx, input }) => { if (ctx.user.role !== "admin") throw new Error("Admin access required"); return createWork(input); }),
    updateWork: protectedProcedure.input(z.object({ id: z.number(), title: z.string().min(1).optional(), titleAr: z.string().optional(), summary: z.string().optional(), studio: z.string().optional(), director: z.string().optional(), score: z.string().optional(), releaseYear: z.number().optional(), coverImageUrl: z.string().url().optional() })).mutation(({ ctx, input }) => { if (ctx.user.role !== "admin") throw new Error("Admin access required"); const { id, ...data } = input; return updateWork(id, data); }),
    deleteWork: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ ctx, input }) => { if (ctx.user.role !== "admin") throw new Error("Admin access required"); return deleteWork(input.id); }),
    createEntity: protectedProcedure.input(z.object({ kind: z.enum(["character", "unit", "weapon", "vehicle", "creature"]), name: z.string().min(1), nameAr: z.string().optional(), description: z.string().optional(), abilities: z.string().optional(), relationships: z.string().optional(), imageUrl: z.string().url().optional() })).mutation(({ ctx, input }) => { if (ctx.user.role !== "admin") throw new Error("Admin access required"); return createEntity(input); }),
    updateEntity: protectedProcedure.input(z.object({ id: z.number(), name: z.string().min(1).optional(), nameAr: z.string().optional(), description: z.string().optional(), abilities: z.string().optional(), relationships: z.string().optional(), imageUrl: z.string().url().optional() })).mutation(({ ctx, input }) => { if (ctx.user.role !== "admin") throw new Error("Admin access required"); const { id, ...data } = input; return updateEntity(id, data); }),
    deleteEntity: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ ctx, input }) => { if (ctx.user.role !== "admin") throw new Error("Admin access required"); return deleteEntity(input.id); }),
    uploadImage: protectedProcedure.input(z.object({ filename: z.string().min(1).max(120), contentType: z.string().regex(/^image\//), base64: z.string().min(20), target: z.enum(["work", "entity"]), id: z.number() })).mutation(async ({ ctx, input }) => { if (ctx.user.role !== "admin") throw new Error("Admin access required"); const safeName = input.filename.replace(/[^a-zA-Z0-9._-]/g, "-"); const buffer = Buffer.from(input.base64, "base64"); const uploaded = await storagePut(`visual-works/${input.target}/${input.id}-${Date.now()}-${safeName}`, buffer, input.contentType); if (input.target === "work") await setWorkImage(input.id, uploaded.url); else await setEntityImage(input.id, uploaded.url); return uploaded; }),
  }),
});

export type AppRouter = typeof appRouter;
