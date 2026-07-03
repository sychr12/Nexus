"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Save, ShieldCheck, XCircle } from "lucide-react";
import Sidebar from "@/app/_components/layout/Sidebar";
import { useAuthSession } from "@/app/_hooks/useAuthSession";
import { apiJson } from "@/app/_lib/http";
import { getPasswordRules, isPasswordPolicyValid } from "@/app/_lib/passwordPolicy";

const COLORS = {
  background: "#F5F7F5",
  primary: "#2D452F",
  card: "#FFFFFF",
  text: "#1A2E1B",
  textLight: "#6B7C6A",
  border: "#E2E8E0",
  success: "#047857",
  danger: "#B42318",
  soft: "#EEF4EC",
};

export default function SenhaPage() {
  const { username, role, logout, ready } = useAuthSession({ defaultUsername: "Usuário" });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordRules = useMemo(() => getPasswordRules(newPassword), [newPassword]);
  const passwordValid = useMemo(() => isPasswordPolicyValid(newPassword), [newPassword]);
  const confirmationValid = confirmPassword.length > 0 && newPassword === confirmPassword;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!passwordValid) {
      setError("A nova senha ainda não atende todos os requisitos.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas novas não conferem.");
      return;
    }

    setLoading(true);
    try {
      await apiJson<void>(
        "/users/me/password",
        {
          method: "PATCH",
          body: { oldPassword, newPassword },
        },
        "Não foi possível alterar a senha",
      );
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Senha alterada com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível alterar a senha.");
    } finally {
      setLoading(false);
    }
  }

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
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link href="/perfil" className="mb-3 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: COLORS.primary }}>
                <ArrowLeft size={16} />
                Voltar ao perfil
              </Link>
              <h1 className="text-2xl font-bold" style={{ color: COLORS.primary }}>
                Alterar senha
              </h1>
              <p className="mt-1 text-sm" style={{ color: COLORS.textLight }}>
                Atualize sua senha individual de acesso ao SICPR.
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold" style={{ borderColor: "#CFE8D6", backgroundColor: "#F4FBF6", color: COLORS.primary }}>
              <ShieldCheck size={16} />
              Conta autenticada
            </span>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
            <section className="rounded-lg border bg-white p-5 shadow-sm" style={{ borderColor: COLORS.border }}>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg" style={{ backgroundColor: COLORS.soft, color: COLORS.primary }}>
                  <KeyRound size={23} />
                </div>
                <div>
                  <h2 className="font-bold" style={{ color: COLORS.text }}>
                    {username}
                  </h2>
                  <p className="text-sm" style={{ color: COLORS.textLight }}>
                    Informe a senha atual e defina uma nova senha segura.
                  </p>
                </div>
              </div>

              {message && <AlertMessage tone="success" text={message} />}
              {error && <AlertMessage tone="danger" text={error} />}

              <form onSubmit={handleSubmit} className="grid gap-4">
                <PasswordField label="Senha atual" value={oldPassword} onChange={setOldPassword} autoComplete="current-password" />
                <PasswordField label="Nova senha" value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
                <PasswordField label="Confirmar nova senha" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />

                {confirmPassword && (
                  <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: confirmationValid ? COLORS.success : COLORS.danger }}>
                    {confirmationValid ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    {confirmationValid ? "As senhas conferem." : "As senhas ainda não conferem."}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-bold text-white transition hover:brightness-95 disabled:opacity-60"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  <Save size={17} />
                  {loading ? "Salvando..." : "Salvar nova senha"}
                </button>
              </form>
            </section>

            <section className="rounded-lg border bg-white p-5 shadow-sm" style={{ borderColor: COLORS.border }}>
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} style={{ color: COLORS.primary }} />
                <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>
                  Regras da senha
                </h3>
              </div>
              <p className="mt-1 text-sm" style={{ color: COLORS.textLight }}>
                Estas são as mesmas regras aplicadas pelo servidor.
              </p>

              <div className="mt-4 grid gap-2">
                {passwordRules.map((rule) => (
                  <div key={rule.id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold" style={{ borderColor: rule.valid ? "#CFE8D6" : COLORS.border, backgroundColor: rule.valid ? "#F4FBF6" : "#FAFCFA", color: rule.valid ? COLORS.success : COLORS.textLight }}>
                    {rule.valid ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    {rule.label}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function AlertMessage({ tone, text }: { tone: "success" | "danger"; text: string }) {
  const success = tone === "success";
  return (
    <div className="mb-4 rounded-md border px-4 py-3 text-sm font-semibold" style={{ borderColor: success ? "#A7F3D0" : "#FCA5A5", backgroundColor: success ? "#ECFDF3" : "#FEF3F2", color: success ? COLORS.success : COLORS.danger }}>
      {text}
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold" style={{ color: COLORS.primary }}>
        {label}
      </span>
      <div className="relative">
        <KeyRound size={17} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textLight }} />
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
          minLength={8}
          maxLength={120}
          autoComplete={autoComplete}
          className="h-11 w-full rounded-md border pl-10 pr-11 text-sm outline-none focus:ring-2 focus:ring-green-500"
          style={{ backgroundColor: COLORS.background, borderColor: COLORS.border, color: COLORS.text }}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md transition hover:bg-white"
          style={{ color: COLORS.textLight }}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </label>
  );
}
