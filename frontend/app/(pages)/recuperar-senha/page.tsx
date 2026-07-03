"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, IdCard, KeyRound, ShieldCheck, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
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

export default function RecuperarSenhaPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordRules = useMemo(() => getPasswordRules(newPassword), [newPassword]);
  const passwordValid = useMemo(() => isPasswordPolicyValid(newPassword), [newPassword]);
  const tokenValid = /^IDAM-\d{6}$/.test(token);
  const confirmationValid = confirmPassword.length > 0 && newPassword === confirmPassword;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!tokenValid) {
      setError("Informe o código temporário no formato IDAM-000000.");
      return;
    }

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
        "/auth/password-reset/confirm",
        {
          method: "POST",
          auth: false,
          body: { username, token, newPassword },
        },
        "Não foi possível redefinir a senha",
      );
      setUsername("");
      setToken("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Senha redefinida com sucesso. Volte ao login para entrar.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível redefinir a senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-8" style={{ backgroundColor: COLORS.background }}>
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-lg border bg-white shadow-sm lg:grid-cols-[0.9fr_1.1fr]" style={{ borderColor: COLORS.border }}>
          <div className="p-6" style={{ backgroundColor: COLORS.soft }}>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="mb-8 inline-flex items-center gap-2 text-sm font-semibold"
              style={{ color: COLORS.primary }}
            >
              <ArrowLeft size={16} />
              Voltar ao login
            </button>

            <div className="flex h-14 w-14 items-center justify-center rounded-lg" style={{ backgroundColor: COLORS.primary, color: "#FFFFFF" }}>
              <ShieldCheck size={26} />
            </div>
            <h1 className="mt-5 text-2xl font-bold" style={{ color: COLORS.primary }}>
              Recuperar senha
            </h1>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: COLORS.textLight }}>
              Use o código temporário fornecido pelo administrador. Ele é de uso único e expira automaticamente.
            </p>

            <div className="mt-6 rounded-md border bg-white p-4" style={{ borderColor: COLORS.border }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.textLight }}>
                Formato do código
              </p>
              <p className="mt-2 font-mono text-2xl font-bold tracking-widest" style={{ color: COLORS.primary }}>
                IDAM-000000
              </p>
            </div>
          </div>

          <div className="p-6">
            {message && <AlertMessage tone="success" text={message} />}
            {error && <AlertMessage tone="danger" text={error} />}

            <form onSubmit={handleSubmit} className="grid gap-4">
              <TextField label="Usuário" value={username} onChange={setUsername} icon={<IdCard size={17} />} autoComplete="username" />
              <TextField
                label="Código temporário"
                value={token}
                onChange={(value) => setToken(formatResetCodeInput(value))}
                placeholder="IDAM-123456"
                maxLength={11}
                icon={<KeyRound size={17} />}
                autoComplete="one-time-code"
              />
              {token && (
                <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: tokenValid ? COLORS.success : COLORS.danger }}>
                  {tokenValid ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  {tokenValid ? "Código no formato correto." : "Use o formato IDAM-000000."}
                </div>
              )}

              <PasswordField label="Nova senha" value={newPassword} onChange={setNewPassword} />
              <PasswordField label="Confirmar nova senha" value={confirmPassword} onChange={setConfirmPassword} />

              {confirmPassword && (
                <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: confirmationValid ? COLORS.success : COLORS.danger }}>
                  {confirmationValid ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  {confirmationValid ? "As senhas conferem." : "As senhas ainda não conferem."}
                </div>
              )}

              <div className="rounded-md border p-4" style={{ borderColor: COLORS.border, backgroundColor: "#FAFCFA" }}>
                <p className="mb-3 text-sm font-bold" style={{ color: COLORS.text }}>
                  Regras da nova senha
                </p>
                <div className="grid gap-2">
                  {passwordRules.map((rule) => (
                    <div key={rule.id} className="flex items-center gap-2 text-sm font-semibold" style={{ color: rule.valid ? COLORS.success : COLORS.textLight }}>
                      {rule.valid ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                      {rule.label}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-bold text-white transition hover:brightness-95 disabled:opacity-60"
                style={{ backgroundColor: COLORS.primary }}
              >
                <KeyRound size={17} />
                {loading ? "Redefinindo..." : "Redefinir senha"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
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

function TextField({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  icon,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  icon: React.ReactNode;
  autoComplete: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold" style={{ color: COLORS.primary }}>
        {label}
      </span>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textLight }}>
          {icon}
        </span>
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          required
          autoComplete={autoComplete}
          className="h-11 w-full rounded-md border pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-green-500"
          style={{ backgroundColor: COLORS.background, borderColor: COLORS.border, color: COLORS.text }}
        />
      </div>
    </label>
  );
}

function formatResetCodeInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 6);
  if (!digits) return "";
  return `IDAM-${digits}`;
}

function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
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
          autoComplete="new-password"
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
