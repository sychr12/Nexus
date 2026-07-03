import { apiJson } from "./http";

export type StoredAuthUser = {
  username: string;
  role: string;
  unidadeLocal?: string | null;
};

export type LoginResponse = {
  token?: string | null;
  username?: string;
  perfil?: string;
  role?: string;
  unidadeLocal?: string | null;
};

export function isAdminUser(username: string, role?: string | null) {
  return username.trim().toLowerCase() === "admin" || (role || "").toUpperCase().includes("ADMIN");
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  // Remove chaves antigas que existiam antes da sessao por cookie HttpOnly.
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("user");
  localStorage.removeItem("perfil");
  localStorage.removeItem("role");
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

export async function getCurrentSession(defaultUsername = "Usuario"): Promise<StoredAuthUser> {
  const data = await apiJson<LoginResponse>("/auth/session", undefined, "Sessao expirada");
  const username = data.username || defaultUsername;
  const role = data.role || data.perfil || (isAdminUser(username) ? "ADMIN" : "USUARIO");

  return { username, role, unidadeLocal: data.unidadeLocal || null };
}

export async function logout() {
  try {
    await apiJson<void>("/auth/logout", { method: "POST" });
  } finally {
    clearAuthSession();
  }
}

export async function resolveStoredAuthUser(defaultUsername = "Usuario"): Promise<StoredAuthUser> {
  try {
    return await getCurrentSession(defaultUsername);
  } catch {
    clearAuthSession();
    throw new Error("Sessao expirada");
  }
}
