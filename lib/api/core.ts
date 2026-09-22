export type ApiErrorKind = "http" | "network" | "aborted" | "parse" | "validation";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  readonly data: unknown;

  constructor(
    message: string,
    options: {
      kind: ApiErrorKind;
      status?: number | null;
      data?: unknown;
      cause?: unknown;
    },
  ) {
    super(message, { cause: options.cause });
    this.name = "ApiError";
    this.kind = options.kind;
    this.status = options.status ?? null;
    this.data = options.data;
  }
}

export type ResponseValidator<T> = (value: unknown) => T;

export interface ApiRequestOptions<T> extends Omit<RequestInit, "body"> {
  body?: BodyInit | null;
  json?: unknown;
  validate?: ResponseValidator<T>;
}

const getErrorMessage = (data: unknown, response: Response): string => {
  if (typeof data === "string" && data.trim()) return data;
  if (typeof data === "object" && data !== null) {
    const record = data as Record<string, unknown>;
    if (typeof record.error === "string" && record.error.trim()) return record.error;
    if (typeof record.message === "string" && record.message.trim()) return record.message;
  }
  return response.statusText || `Request failed with status ${response.status}`;
};

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException
    ? error.name === "AbortError"
    : typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "AbortError";

export async function request<T>(
  input: string | URL,
  options: ApiRequestOptions<T> = {},
): Promise<T> {
  const { json, validate, headers: suppliedHeaders, ...requestInit } = options;
  const headers = new Headers(suppliedHeaders);
  let body = requestInit.body;

  if (json !== undefined) {
    if (body !== undefined && body !== null) {
      throw new ApiError("body and json cannot be used together", {
        kind: "validation",
      });
    }
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(json);
  }

  let response: Response;
  try {
    response = await fetch(input, { ...requestInit, headers, body });
  } catch (error) {
    if (isAbortError(error)) {
      throw new ApiError("Request was aborted", {
        kind: "aborted",
        cause: error,
      });
    }
    throw new ApiError("Network request failed", {
      kind: "network",
      cause: error,
    });
  }

  const responseText = response.status === 204 ? "" : await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  let data: unknown;

  if (!responseText) {
    data = undefined;
  } else if (contentType.includes("json")) {
    try {
      data = JSON.parse(responseText) as unknown;
    } catch (error) {
      if (!response.ok) data = responseText;
      else {
        throw new ApiError("API returned invalid JSON", {
          kind: "parse",
          status: response.status,
          data: responseText,
          cause: error,
        });
      }
    }
  } else {
    data = responseText;
  }

  if (!response.ok) {
    throw new ApiError(getErrorMessage(data, response), {
      kind: "http",
      status: response.status,
      data,
    });
  }

  if (!validate) return data as T;

  try {
    return validate(data);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("API response validation failed", {
      kind: "validation",
      status: response.status,
      data,
      cause: error,
    });
  }
}

export const getApiErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;
