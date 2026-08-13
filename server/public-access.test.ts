import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function publicContext(): TrpcContext {
  return {
    user: undefined,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("public catalog access", () => {
  it("allows partial-name search without an authenticated user", async () => {
    const caller = appRouter.createCaller(publicContext());
    const result = await caller.catalog.searchAll({ q: "nar", limit: 10 });
    expect(result).toHaveProperty("works");
    expect(result).toHaveProperty("characters");
  });

  it("returns a public graph payload without an authenticated user", async () => {
    const caller = appRouter.createCaller(publicContext());
    const result = await caller.catalog.graph();
    expect(result).toHaveProperty("universes");
    expect(result).toHaveProperty("nodes");
    expect(result).toHaveProperty("edges");
    expect(result.nodes.some((node: any) => node.kind === "universe")).toBe(true);
    expect(result.nodes.every((node: any) => typeof node.id === "string" && typeof node.kind === "string")).toBe(true);
    expect(result.edges.every((edge: any) => typeof edge.source === "string" && typeof edge.target === "string" && typeof edge.type === "string")).toBe(true);
    expect(result.edges.some((edge: any) => edge.type === "appearance" || edge.type === "universe_work")).toBe(true);
  });

  it("returns the public Marvel timeline contract without an authenticated user", async () => {
    const caller = appRouter.createCaller(publicContext());
    const result = await caller.catalog.marvelTimeline({ order: "event" });
    expect(result.length).toBeGreaterThanOrEqual(80);
    expect(result.every((row: any) => row.brand === "marvel" && row.source === "marvel")).toBe(true);
    expect(result[0]?.eventOrder).toBeLessThanOrEqual(result.at(-1)?.eventOrder ?? 9999);
  });

  it("keeps admin status protected without an authenticated user", async () => {
    const caller = appRouter.createCaller(publicContext());
    await expect(caller.admin.status()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
