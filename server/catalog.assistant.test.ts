import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const ctx = { user: null, req: { protocol: "https", headers: {} }, res: {} } as TrpcContext;

describe("catalog and assistant contracts", () => {
  it("rejects an empty assistant question", async () => {
    const caller = appRouter.createCaller(ctx);
    await expect(caller.assistant.ask({ question: "" })).rejects.toBeTruthy();
  });

  it("rejects an invalid catalog filter", async () => {
    const caller = appRouter.createCaller(ctx);
    await expect(caller.catalog.search({ type: "not-a-type" as never })).rejects.toBeTruthy();
  });
});
