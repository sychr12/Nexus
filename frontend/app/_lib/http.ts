export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
const CSRF_COOKIE = "XSRF-TOKEN";
const CSRF_HEADER = "X-XSRF-TOKEN";
const CSRF_SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS", "TRACE"]);

type ApiRequestOptions = Omit<RequestInit, "body" | "headers"> & {
  body?: BodyInit | unknown;
  headers?: HeadersInit;
  auth?: boolean;
};

export function getAuthHeaders(headers?: HeadersInit): HeadersInit {
  return {
    ...headers,
  };
}

export function apiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  return (
    document.cookie
      .split(";")
      .map((value) => value.trim())
      .find((value) => value.startsWith(prefix))
      ?.slice(prefix.length) || null
  );
}

function isUnsafeMethod(method?: string) {
  return !CSRF_SAFE_METHODS.has((method || "GET").toUpperCase());
}

function isCsrfExempt(path: string) {
  const resolved = apiUrl(path);
  return resolved.endsWith("/auth/login");
}

async function ensureCsrfToken(path: string, method?: string) {
  if (typeof document === "undefined" || !isUnsafeMethod(method) || isCsrfExempt(path)) return null;

  let token = getCookie(CSRF_COOKIE);
  if (!token) {
    await fetch(apiUrl("/auth/csrf"), {
      credentials: "include",
    });
    token = getCookie(CSRF_COOKIE);
  }

  return token ? decodeURIComponent(token) : null;
}

export async function readErrorMessage(response: Response, fallback = "Erro na requisicao") {
  try {
    const data = await response.clone().json();
    if (typeof data?.message === "string") return data.message;
    if (typeof data?.error === "string") return data.error;
  } catch {
    const text = await response.text().catch(() => "");
    if (text) return text;
  }

  return fallback;
}

export async function throwIfNotOk(response: Response, fallback?: string) {
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, fallback || `HTTP ${response.status}`));
  }

  return response;
}

export async function apiFetch(path: string, options: ApiRequestOptions = {}) {
  const { auth = true, body, headers, ...init } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const csrfToken = await ensureCsrfToken(path, init.method);
  const requestHeaders: HeadersInit = {
    ...(!isFormData && body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(csrfToken ? { [CSRF_HEADER]: csrfToken } : {}),
    ...(auth ? getAuthHeaders() : {}),
    ...headers,
  };

  return fetch(apiUrl(path), {
    ...init,
    credentials: init.credentials || "include",
    headers: requestHeaders,
    body: isFormData || typeof body === "string" || body instanceof Blob ? body : body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function apiJson<T>(path: string, options?: ApiRequestOptions, fallback?: string): Promise<T> {
  const response = await apiFetch(path, options);
  await throwIfNotOk(response, fallback);
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}
