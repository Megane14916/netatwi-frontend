"use client";

import { request, type ApiRequestOptions } from "./core";

const assertApiPath = (path: string): void => {
  if (!path.startsWith("/api/")) {
    throw new Error(`Browser API paths must start with /api/: ${path}`);
  }
};

export const browserRequest = <T>(
  path: string,
  options: ApiRequestOptions<T> = {},
): Promise<T> => {
  assertApiPath(path);
  return request<T>(path, {
    credentials: "include",
    ...options,
  });
};
