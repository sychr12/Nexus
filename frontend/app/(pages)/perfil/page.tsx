"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  ClipboardList,
  IdCard,
  KeyRound,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import Sidebar from "@/app/_components/layout/Sidebar";
import { useAuthSession } from "@/app/_hooks/useAuthSession";
import {
  ROLE_ACCESS_LABELS as CENTRAL_ROLE_ACCESS_LABELS,
  ROLE_DESCRIPTIONS as CENTRAL_ROLE_DESCRIPTIONS,
  ROLE_LABELS as CENTRAL_ROLE_LABELS,
  normalizeRole as normalizeAccessRole,
} from "@/app/_lib/access-control";

const COLORS = {
  background: "#F5F7F5",
  primary: "#2D452F",
  accent: "#6B9D4A",
  card: "#FFFFFF",
  text: "#1A2E1B",
  textLight: "#6B7C6A",
  border: "#E2E8E0",
  soft: "#EEF4EC",
};


export default function PerfilPage() {
  const { username, role, unidadeLocal, logout, ready } = useAuthSession({ defaultUsername: "Usuário" });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const normalizedRole = normalizeAccessRole(role);
  const roleLabel = CENTRAL_ROLE_LABELS[normalizedRole] || normalizedRole;
  const accessItems = CENTRAL_ROLE_ACCESS_LABELS[normalizedRole] || CENTRAL_ROLE_ACCESS_LABELS.USUARIO;
  const initials = useMemo(() => getInitials(username), [username]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: COLORS.background }}>
        <div className="h-8 w-8 animate-spin rounded-full border-b-2" style={{ borderBottomColor: COLORS.primary }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
      <Sidebar
        onLogout={logout}
        username={username || "Usuário"}
        role={role}
        onCollapsedChange={setSidebarCollapsed}
      />

      <main className="min-h-screen transition-all duration-300" style={{ marginLeft: sidebarCollapsed ? "72px" : "260px" }}>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: COLORS.primary }}>
                Perfil
              </h1>
              <p className="mt-1 text-sm" style={{ color: COLORS.textLight }}>
                Dados da sua conta, vínculo institucional e permissões de acesso.
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold" style={{ borderColor: "#CFE8D6", backgroundColor: "#F4FBF6", color: COLORS.primary }}>
              <CheckCircle2 size={16} />
              Sessão ativa
            </span>
          </div>

          <section className="overflow-hidden rounded-lg border bg-white shadow-sm" style={{ borderColor: COLORS.border }}>
            <div className="border-b px-5 py-5" style={{ borderColor: COLORS.border, backgroundColor: COLORS.soft }}>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white" style={{ backgroundColor: COLORS.primary }}>
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.textLight }}>
                    Usuário autenticado
                  </p>
                  <h2 className="mt-1 truncate text-2xl font-bold" style={{ color: COLORS.text }}>
                    {username || "Usuário"}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: COLORS.textLight }}>
                    {CENTRAL_ROLE_DESCRIPTIONS[normalizedRole] || "Acesso definido pelas permissões do sistema."}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-3">
              <InfoCard icon={<ShieldCheck size={18} />} label="Perfil de acesso" value={roleLabel} />
              <InfoCard icon={<IdCard size={18} />} label="Identificação" value={username || "-"} />
              <InfoCard icon={<Building2 size={18} />} label="Unidade local" value={unidadeLocal || getUnitFallback(normalizedRole)} />
            </div>
          </section>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
            <section className="rounded-lg border bg-white p-5 shadow-sm" style={{ borderColor: COLORS.border }}>
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} style={{ color: COLORS.primary }} />
                <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>
                  Acessos deste perfil
                </h3>
              </div>
              <p className="mt-1 text-sm" style={{ color: COLORS.textLight }}>
                Áreas liberadas para o perfil atualmente carregado na sessão.
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {accessItems.map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold" style={{ borderColor: COLORS.border, color: COLORS.text, backgroundColor: "#FAFCFA" }}>
                    <CheckCircle2 size={16} style={{ color: COLORS.accent }} />
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border bg-white p-5 shadow-sm" style={{ borderColor: COLORS.border }}>
              <div className="flex items-center gap-2">
                <KeyRound size={20} style={{ color: COLORS.primary }} />
                <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>
                  Segurança da conta
                </h3>
              </div>
              <p className="mt-1 text-sm" style={{ color: COLORS.textLight }}>
                Mantenha sua senha individual e encerre a sessão quando usar computador compartilhado.
              </p>

              <div className="mt-5 grid gap-3">
                <Link
                  href="/senha"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-bold text-white transition hover:brightness-95"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  <KeyRound size={17} />
                  Alterar senha
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border px-4 text-sm font-bold transition hover:bg-red-50"
                  style={{ borderColor: "#F2C8BB", color: "#B42318" }}
                >
                  <LogOut size={17} />
                  Sair do sistema
                </button>
              </div>
            </section>
          </div>

          <section className="mt-5 rounded-lg border bg-white p-5 shadow-sm" style={{ borderColor: COLORS.border }}>
            <div className="flex items-center gap-2">
              <ClipboardList size={20} style={{ color: COLORS.primary }} />
              <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>
                Boas práticas de uso
              </h3>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <PracticeCard title="Conta individual" text="Não compartilhe seu login ou senha com outros usuários." />
              <PracticeCard title="Unidade correta" text="Confira o vínculo da unidade antes de cadastrar, analisar ou consultar produtores." />
              <PracticeCard title="Rastreabilidade" text="Ações importantes ficam registradas na auditoria para segurança institucional." />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border p-4" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold" style={{ color: COLORS.primary }}>
        {icon}
        {label}
      </div>
      <p className="break-words text-lg font-bold" style={{ color: COLORS.text }}>
        {value}
      </p>
    </div>
  );
}

function PracticeCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md border p-4" style={{ borderColor: COLORS.border, backgroundColor: "#FAFCFA" }}>
      <p className="text-sm font-bold" style={{ color: COLORS.text }}>
        {title}
      </p>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: COLORS.textLight }}>
        {text}
      </p>
    </div>
  );
}

function getInitials(value?: string | null) {
  const parts = (value || "Usuário")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getUnitFallback(role: string) {
  if (role === "ADMIN") return "Acesso geral";
  if (role === "USUARIO") return "Usuário do sistema";
  return "Não vinculada";
}
