export const SYSTEM_ROLES = ["ADMIN", "GERENTE", "TECNICO", "USUARIO"] as const;

export type SystemRole = (typeof SYSTEM_ROLES)[number];

export const ROLE_LABELS: Record<SystemRole, string> = {
  ADMIN: "Administrador",
  GERENTE: "Gerente",
  TECNICO: "Técnico",
  USUARIO: "Usuário",
};

export const ROLE_DESCRIPTIONS: Record<SystemRole, string> = {
  ADMIN: "Acesso completo às áreas administrativas, operação, usuários e auditoria.",
  GERENTE: "Acompanha indicadores, relatórios, consultas e decisões da unidade vinculada.",
  TECNICO: "Atua nos cadastros e processos da unidade local vinculada.",
  USUARIO: "Atua nas rotinas operacionais liberadas para usuários do sistema.",
};

export const MENU_ACCESS: Record<string, SystemRole[]> = {
  dashboard: ["ADMIN", "GERENTE"],
  relatorios: ["ADMIN", "GERENTE"],
  unloc: ["ADMIN", "TECNICO", "USUARIO"],
  gerente: ["ADMIN", "GERENTE"],
  "memorandos-assinados": ["ADMIN", "GERENTE"],
  memorando: ["ADMIN"],
  carteira: ["ADMIN", "USUARIO"],
  consultar: ["ADMIN", "GERENTE", "TECNICO", "USUARIO"],
  analises: ["ADMIN", "USUARIO"],
  lancamentos: ["ADMIN", "USUARIO"],
  mensagens: ["ADMIN", "TECNICO", "USUARIO"],
  usuarios: ["ADMIN"],
  auditoria: ["ADMIN"],
};

export const ROLE_ACCESS_LABELS: Record<SystemRole, string[]> = {
  ADMIN: [
    "Dashboard e KPIs",
    "Relatórios",
    "Unidade Local",
    "Gerente de Unidade Local",
    "Central de Memorandos",
    "Memorando de Saída",
    "Carteira Digital",
    "Consultar",
    "Análises",
    "Lançamentos",
    "Mensagens",
    "Gerenciamento de Usuários",
    "Auditoria",
    "Perfil",
  ],
  GERENTE: [
    "Dashboard e KPIs",
    "Relatórios",
    "Gerente de Unidade Local",
    "Central de Memorandos",
    "Consultar",
    "Perfil",
  ],
  TECNICO: [
    "Unidade Local",
    "Consultar",
    "Mensagens",
    "Perfil",
  ],
  USUARIO: [
    "Unidade Local",
    "Carteira Digital",
    "Consultar",
    "Análises",
    "Lançamentos",
    "Mensagens",
    "Perfil",
  ],
};

export function normalizeRole(value?: string | null): SystemRole {
  const role = (value || "USUARIO").trim().toUpperCase().replace(/^ROLE_/, "");
  if (role === "CHEFE") return "GERENTE";
  return SYSTEM_ROLES.includes(role as SystemRole) ? (role as SystemRole) : "USUARIO";
}

export function canAccessRole(role: string | null | undefined, allowedRoles?: readonly SystemRole[]) {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(normalizeRole(role));
}
