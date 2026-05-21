const API_URL = "http://localhost:8080";

export function isAdminUser(username: string, role?: string | null) {
  return username.trim().toLowerCase() === "admin" || (role || "").toUpperCase().includes("ADMIN");
}

export async function resolveStoredAuthUser(defaultUsername = "Usuario") {
  const token = localStorage.getItem("token") || "";
  const username = localStorage.getItem("username") || defaultUsername;
  let role = localStorage.getItem("role") || localStorage.getItem("perfil") || "";

  if (!role && token && username) {
    try {
      const response = await fetch(`${API_URL}/api/users/username/${encodeURIComponent(username)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = (await response.json()) as { perfil?: string; role?: string };
        role = data.perfil || data.role || "";
        if (role) {
          localStorage.setItem("perfil", role);
          localStorage.setItem("role", role);
        }
      }
    } catch {
      role = "";
    }
  }

  if (!role) role = isAdminUser(username) ? "ADMIN" : "USUARIO";

  return { username, role };
}
