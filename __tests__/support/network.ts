type RouteReply = {
  method: string;
  path: string;
  status?: number;
  body?: unknown;
};

export const installApiMock = () => {
  const originalFetch = global.fetch;
  const routes: RouteReply[] = [];
  const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>(async (input, init) => {
    const path = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    const index = routes.findIndex((route) => route.method === method && route.path === path);
    if (index < 0) throw new Error(`Unexpected API request: ${method} ${path}`);
    const [{ status = 200, body }] = routes.splice(index, 1);
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: status >= 400 ? "Request failed" : "OK",
      headers: { get: (name: string) => name.toLowerCase() === "content-type" ? "application/json" : null },
      text: async () => body === undefined ? "" : JSON.stringify(body),
    } as Response;
  });
  Object.defineProperty(global, "fetch", { configurable: true, writable: true, value: fetchMock });

  return {
    fetchMock,
    reply: (method: string, path: string, body?: unknown, status = 200) => {
      routes.push({ method: method.toUpperCase(), path, body, status });
    },
    assertDone: () => expect(routes).toEqual([]),
    restore: () => {
      Object.defineProperty(global, "fetch", { configurable: true, writable: true, value: originalFetch });
    },
  };
};
