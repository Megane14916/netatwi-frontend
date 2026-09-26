import { resolveMetadata } from "@/lib/metadata";

describe("resolveMetadata", () => {
  it("取得成功時は取得データからmetadataを作る", async () => {
    await expect(
      resolveMetadata(
        () => Promise.resolve({ name: "大会" }),
        (value) => ({ title: value.name }),
        { title: "fallback" },
        "contest",
      ),
    ).resolves.toEqual({ title: "大会" });
  });

  it("backend障害時は共通のフォールバックを返す", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
    await expect(
      resolveMetadata(
        () => Promise.reject(new Error("offline")),
        () => ({ title: "unused" }),
        { title: "大会" },
        "contest",
      ),
    ).resolves.toEqual({ title: "大会" });
  });
});
