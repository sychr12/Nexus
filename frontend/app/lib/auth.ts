import { apiJson, getAuthToken } from "./http";

export type StoredAuthUser = {
  username: string;
  role: string;
};

export type LoginResponse = {
  token: string;
  username?: string;
  perfil?: string;
  role?: string;
};

export function isAdminUser(username: string, role?: string | null) {
  return username.trim().toLowerCase() === "admin" || (role || "").toUpperCase().includes("ADMIN");
}

export function hasAuthToken() {
  return Boolean(getAuthToken());
}

export function getStoredUsername(defaultUsername = "Usuario") {
  if (typeof window === "undefined") return defaultUsername;
  return localStorage.getItem("username") || defaultUsername;
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("user");
  localStorage.removeItem("perfil");
  localStorage.removeItem("role");
}

export function storeAuthSession(data: LoginResponse, fallbackUsername: string) {
  localStorage.setItem("token", data.token);
  localStorage.setItem("username", data.username || fallbackUsername);

  const role = data.role || data.perfil;
  if (role) {
    localStorage.setItem("perfil", role);
    localStorage.setItem("role", role);
  }
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  return apiJson<LoginResponse>(
    "/auth/login",
    {
      method: "POST",
      auth: false,
      body: { username, password },
    },
    "Usuario ou senha invalidos",
  );
}

export async function resolveStoredAuthUser(defaultUsername = "Usuario"): Promise<StoredAuthUser> {
  const token = getAuthToken() || "";
  const username = localStorage.getItem("username") || defaultUsername;
  let role = localStorage.getItem("role") || localStorage.getItem("perfil") || "";

  if (!role && token && username) {
    try {
      const data = await apiJson<{ perfil?: string; role?: string }>(`/users/username/${encodeURIComponent(username)}`);
      role = data.perfil || data.role || "";
      if (role) {
        localStorage.setItem("perfil", role);
        localStorage.setItem("role", role);
      }
    } catch {
      role = "";
    }
  }

  if (!role) role = isAdminUser(username) ? "ADMIN" : "USUARIO";

  return { username, role };
}
