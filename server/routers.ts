import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { syncAniList } from "./anilist";
import { compareEntities, getEntityDetails, getFranchiseOrder, getWorkDetails, listFeaturedWorks, listPopularFranchises, listUniverses, searchWorks } from "./db";

const workType = z.enum(["all", "anime", "film", "series", "ova", "animation"]);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 }); return { success: true } as const; }),
  }),
  catalog: router({
    home: publicProcedure.query(async () => ({ featured: await listFeaturedWorks(), franchises: await listPopularFranchises() })),
    search: publicProcedure.input(z.object({ q: z.string().optional(), type: workType.optional(), year: z.number().optional(), studio: z.string().optional(), minScore: z.number().optional(), limit: z.number().min(1).max(50).optional() })).query(({ input }) => searchWorks(input)),
    work: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => getWorkDetails(input.id)),
    entity: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => getEntityDetails(input.id)),
    compare: publicProcedure.input(z.object({ ids: z.array(z.number()).min(1).max(2) })).query(({ input }) => compareEntities(input.ids)),
    universes: publicProcedure.query(() => listUniverses()),
    franchiseOrder: publicProcedure.input(z.object({ franchiseId: z.number(), order: z.enum(["chronological", "release"]).default("chronological") })).query(({ input }) => getFranchiseOrder(input.franchiseId, input.order)),
  }),
  assistant: router({
    ask: publicProcedure.input(z.object({ question: z.string().min(2), context: z.string().optional(), language: z.enum(["ar", "en"]).default("en") })).mutation(async ({ input }) => {
      const response = await invokeLLM({ messages: [
        { role: "system", content: `You are Visual Works Encyclopedia's research assistant. Answer accurately and clearly about anime, films, series, OVAs, characters and units. If the user asks for Arabic, translate or answer in Arabic. Never invent ratings, reviews, citations, or factual sources. State uncertainty when data is unavailable. User language: ${input.language}.` },
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
    status: protectedProcedure.query(({ ctx }) => ({ isAdmin: ctx.user.role === "admin" })),
    syncAniList: protectedProcedure.input(z.object({ page: z.number().min(1).max(100).default(1), perPage: z.number().min(1).max(50).default(25) })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Admin access required");
      return syncAniList(input.page, input.perPage);
    }),
  }),
});

export type AppRouter = typeof appRouter;
