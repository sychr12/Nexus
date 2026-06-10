export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

type ApiRequestOptions = Omit<RequestInit, "body" | "headers"> & {
  body?: BodyInit | unknown;
  headers?: HeadersInit;
  auth?: boolean;
};

export function getAuthToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function getAuthHeaders(headers?: HeadersInit): HeadersInit {
  const token = getAuthToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };
}

export function apiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
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
  const requestHeaders: HeadersInit = {
    ...(!isFormData && body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(auth ? getAuthHeaders() : {}),
    ...headers,
  };

  return fetch(apiUrl(path), {
    ...init,
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
