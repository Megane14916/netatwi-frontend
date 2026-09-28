import { ApiError, getApiErrorMessage, request } from "@/lib/api/core";

const response = (
  body: string | null,
  { status = 200, contentType = "text/plain", statusText = "" } = {},
): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    statusText,
    headers: { get: (name: string) => name.toLowerCase() === "content-type" ? contentType : null },
    text: jest.fn().mockResolvedValue(body ?? ""),
  }) as unknown as Response;

const jsonResponse = (body: unknown, status = 200) =>
  response(JSON.stringify(body), { status, contentType: "application/json" });

const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>();
const originalFetch = global.fetch;

describe("request", () => {
  beforeEach(() => {
    fetchMock.mockReset();
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

  it("returns validated JSON and serializes a JSON request body", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 1 }));

    const result = await request<{ id: number }>("/api/example", {
      method: "POST",
      json: { name: "example" },
      validate: (value) => {
        if (typeof value !== "object" || value === null || !("id" in value)) {
          throw new Error("invalid response");
        }
        return value as { id: number };
      },
    });

    expect(result).toEqual({ id: 1 });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/example",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "example" }),
        headers: expect.any(Headers),
      }),
    );
  });

  it("supports empty successful responses", async () => {
    fetchMock.mockResolvedValue(response(null, { status: 204 }));

    await expect(request<void>("/api/logout", { method: "POST" })).resolves.toBeUndefined();
  });

  it("throws an HTTP ApiError for JSON error responses", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "Forbidden" }, 403));

    await expect(request("/api/admin")).rejects.toMatchObject({
      name: "ApiError",
      kind: "http",
      status: 403,
      message: "Forbidden",
    });
  });

  it("preserves non-JSON error text", async () => {
    fetchMock.mockResolvedValue(response("Gateway unavailable", { status: 502 }));

    await expect(request("/api/example")).rejects.toMatchObject({
      kind: "http",
      status: 502,
      message: "Gateway unavailable",
    });
  });

  it("classifies network failures", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    await expect(request("/api/example")).rejects.toMatchObject({
      kind: "network",
      status: null,
    });
  });

  it("classifies aborted requests", async () => {
    fetchMock.mockRejectedValue(
      new DOMException("aborted", "AbortError"),
    );

    await expect(request("/api/example")).rejects.toMatchObject({
      kind: "aborted",
    });
  });

  it("passes an AbortSignal to fetch", async () => {
    fetchMock.mockResolvedValue(response(null, { status: 204 }));
    const controller = new AbortController();

    await request<void>("/api/example", { signal: controller.signal });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/example",
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it("classifies aborts while reading a response body", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "",
      headers: { get: () => "application/json" },
      text: jest.fn().mockRejectedValue(new DOMException("aborted", "AbortError")),
    } as unknown as Response);

    await expect(request("/api/example")).rejects.toMatchObject({
      kind: "aborted",
    });
  });

  it("classifies malformed successful JSON", async () => {
    fetchMock.mockResolvedValue(response("{", { contentType: "application/json" }));

    await expect(request("/api/example")).rejects.toMatchObject({
      kind: "parse",
      status: 200,
    });
  });

  it("wraps response validation failures", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: "wrong" }));

    await expect(
      request("/api/example", {
        validate: () => {
          throw new Error("invalid");
        },
      }),
    ).rejects.toEqual(expect.objectContaining({ kind: "validation" }));
  });

  it("rejects a request that supplies both JSON and a body before fetching", async () => {
    await expect(request("/api/example", { body: "raw", json: { id: 1 } })).rejects.toMatchObject({ kind: "validation" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("preserves an ApiError thrown by a response validator", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 1 }));
    const error = new ApiError("custom", { kind: "validation" });
    await expect(request("/api/example", { validate: () => { throw error; } })).rejects.toBe(error);
  });

  it("uses the server message and falls back to status text for empty errors", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "Unavailable" }, 503));
    fetchMock.mockResolvedValueOnce(response("", { status: 503, statusText: "Service Unavailable" }));
    await expect(request("/api/example")).rejects.toMatchObject({ kind: "http", message: "Unavailable" });
    await expect(request("/api/example")).rejects.toMatchObject({ kind: "http", message: "Service Unavailable" });
  });

  it("keeps malformed JSON error bodies as text and classifies body read failures", async () => {
    fetchMock.mockResolvedValueOnce(response("{", { status: 500, contentType: "application/json" }));
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200, headers: { get: () => "application/json" },
      text: jest.fn().mockRejectedValue(new Error("read failed")),
    } as unknown as Response);
    await expect(request("/api/example")).rejects.toMatchObject({ kind: "http", message: "{" });
    await expect(request("/api/example")).rejects.toMatchObject({ kind: "network" });
  });

  it("provides a fallback message for non-Error values", () => {
    expect(getApiErrorMessage(null, "fallback")).toBe("fallback");
    expect(getApiErrorMessage(new Error("reason"), "fallback")).toBe("reason");
  });
});
