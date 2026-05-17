const API_PREFIX = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";
const CSRF_STORAGE_KEY = "gym.csrfToken";

const DEV_AUTH_ENABLED =
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_DEV_SKIP_AUTH === "true";

const DEV_SECRET = process.env.NEXT_PUBLIC_DEV_SECRET ?? "dev";

type ApiError = Error & { status?: number };

function readCsrfToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(CSRF_STORAGE_KEY);
}

function writeCsrfToken(value: string | null): void {
  if (typeof window === "undefined") return;
  if (!value) {
    window.sessionStorage.removeItem(CSRF_STORAGE_KEY);
    return;
  }
  window.sessionStorage.setItem(CSRF_STORAGE_KEY, value);
}

async function parseJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) return null;
  return JSON.parse(text) as T;
}

function buildApiError(message: string, status?: number): ApiError {
  const error = new Error(message) as ApiError;
  error.status = status;
  return error;
}

async function request<T>(path: string, init?: RequestInit): Promise<T | null> {
  const devHeaders: Record<string, string> = DEV_AUTH_ENABLED
    ? { "X-Dev-Auth": DEV_SECRET, "X-CSRF-Token": DEV_SECRET }
    : {};

  const response = await fetch(`${API_PREFIX}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...devHeaders,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const payload = await parseJson<{ detail?: string }>(response).catch(() => null);
    throw buildApiError(payload?.detail ?? response.statusText, response.status);
  }

  return parseJson<T>(response);
}

export { readCsrfToken, writeCsrfToken, buildApiError, request, DEV_AUTH_ENABLED, DEV_SECRET };
export type { ApiError };
