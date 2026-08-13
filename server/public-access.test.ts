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

  it("keeps admin status protected without an authenticated user", async () => {
    const caller = appRouter.createCaller(publicContext());
    await expect(caller.admin.status()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
