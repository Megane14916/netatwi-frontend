import { browserRequest } from "@/lib/api/browser";

const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>();
const originalFetch = global.fetch;

describe("browserRequest", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 204,
      statusText: "",
      headers: { get: () => null },
      text: jest.fn().mockResolvedValue(""),
    } as unknown as Response);
    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: fetchMock,
    });
  });

  afterEach(() => {
    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: originalFetch,
    });
  });

  it("includes credentials for same-origin API requests", async () => {
    await browserRequest<void>("/api/session");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/session",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("rejects paths outside the same-origin API boundary", () => {
    expect(() => browserRequest("https://example.com/api/session")).toThrow(
      "Browser API paths must start with /api/",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
