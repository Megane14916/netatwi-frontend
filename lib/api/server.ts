import "server-only";

import { request, type ApiRequestOptions } from "./core";

const getBackendUrl = (): string =>
  (process.env.BACKEND_URL || "http://127.0.0.1:5001").replace(/\/$/, "");

export const serverRequest = <T>(
  path: string,
  options: ApiRequestOptions<T> = {},
): Promise<T> => {
  if (!path.startsWith("/api/")) {
    throw new Error(`Server API paths must start with /api/: ${path}`);
  }
  return request<T>(`${getBackendUrl()}${path}`, options);
};
