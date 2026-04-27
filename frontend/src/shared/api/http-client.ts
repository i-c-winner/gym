import { API_BASE_URL } from "./config";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  csrfToken?: string | null;
};

type ErrorResponse = {
  detail?: unknown;
};

function buildUrl(path: string) {
  if (path.startsWith("http")) {
    return path;
  }

  return `${API_BASE_URL}${path}`;
}

function getErrorMessage(payload: ErrorResponse | null, fallback: string) {
  if (typeof payload?.detail === "string") {
    return payload.detail;
  }

  if (Array.isArray(payload?.detail)) {
    return payload.detail
      .map((item) => {
        if (typeof item === "object" && item !== null && "msg" in item) {
          return String(item.msg);
        }

        return String(item);
      })
      .join(", ");
  }

  return fallback;
}

async function parseJson<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function apiRequest<T>(
  path: string,
  { body, csrfToken, headers, ...init }: ApiRequestOptions = {},
): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...init,
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "include",
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    const payload = await parseJson<ErrorResponse | null>(response).catch(() => null);
    throw new ApiError(getErrorMessage(payload, response.statusText), response.status);
  }

  return parseJson<T>(response);
}
