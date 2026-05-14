"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, LogIn, ShieldCheck, Sprout, UserRound } from "lucide-react";

const API_URL = "http://localhost:8080";

async function login(username: string, password: string): Promise<{ token: string }> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    let errorMessage = "Usuário ou senha inválidos";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      const textError = await response.text();
      if (textError) errorMessage = textError;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await login(username, password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", username);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-[#0b241b] p-4 text-white">
      <section className="relative w-full max-w-[1240px] overflow-hidden rounded-[40px] border-[3px] border-white/10 bg-[#0b241b]/75 shadow-2xl shadow-black/40">
        <Image
          src="/login-farm-bg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 object-cover brightness-90"
        />
        <div className="absolute inset-0 bg-[#03110e]/38" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#03110e]/15 via-[#03110e]/72 to-[#03110e]/92" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020c09]/55 via-transparent to-[#020c09]/35" />

        <div className="relative z-10 grid h-full lg:grid-cols-[1fr_0.9fr] lg:px-4">
          <section className="flex min-h-[560px] items-center justify-center px-4 py-8 lg:h-full lg:min-h-0 lg:px-8 xl:px-10">
            <div className="flex w-full max-w-[455px] flex-col items-center text-center">
              <div className="relative h-[100px] w-full overflow-hidden">
                <Image
                  src="/sicpr-badge.png"
                  alt="SICPR Badge"
                  width={1536}
                  height={1024}
                  priority
                  className="absolute left-1/2 top-1/2 w-[198px] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_14px_30px_rgba(0,0,0,0.65)]"
                  style={{ filter: "brightness(0) saturate(100%) invert(55%) sepia(16%) saturate(1146%) hue-rotate(51deg) brightness(92%) contrast(86%)" }}
                />
              </div>
              <div className="relative mt-2 h-[82px] w-full overflow-hidden">
                <Image
                  src="/sicpr-word.png"
                  alt="SICPR"
                  width={1536}
                  height={1024}
                  priority
                  className="absolute left-1/2 top-1/2 w-[405px] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.55)] grayscale brightness-[3.8] contrast-125"
                />
              </div>
              <p className="mt-2 max-w-[390px] text-center text-xs font-semibold uppercase leading-6 tracking-[0.3em] text-[#6B9D4A]">
                Sistema de Identificação
                <br />
                e Cadastro do Produtor Rural
              </p>

              <div className="mt-7 flex w-full max-w-[350px] items-center gap-4 rounded-2xl border border-white/12 bg-white/10 px-5 py-4 text-left shadow-xl shadow-black/30 backdrop-blur-md">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center text-[#6B9D4A]">
                  <ShieldCheck size={32} strokeWidth={1.8} />
                </div>
                <p className="text-sm font-medium leading-6 text-white">
                  Seus dados protegidos com tecnologia e criptografia avançada.
                </p>
              </div>

              <div className="mt-10 inline-flex min-w-[265px] items-center justify-center gap-4 rounded-full border border-white/12 bg-[#0c241d]/82 px-7 py-3 text-sm font-medium text-white shadow-xl shadow-black/30 backdrop-blur-md xl:mt-14">
                <span className="h-3.5 w-3.5 rounded-full bg-[#6B9D4A]" />
                Sistema online e seguro
              </div>
            </div>
          </section>

          <section className="flex min-h-[540px] items-center justify-center px-4 py-8 lg:h-full lg:min-h-0 lg:px-6 xl:px-8">
            <div className="flex w-full max-w-[455px] flex-col rounded-[28px] border-[3px] border-white/12 bg-[#0f2d22]/78 px-7 py-6 shadow-2xl shadow-black/45 backdrop-blur-xl xl:px-8">
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#6B9D4A]/35 bg-[#6B9D4A]/5 text-[#6B9D4A]">
                  <ShieldCheck size={27} strokeWidth={1.9} />
                </div>
                <p className="mt-4 text-sm font-bold uppercase tracking-wide text-[#6B9D4A]">
                  Acesso ao Sistema
                </p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-white drop-shadow-[0_3px_5px_rgba(0,0,0,0.55)]">
                  Faça login para continuar
                </h1>
              </div>

              {error && (
                <div className="mt-5 rounded-2xl border border-red-300/30 bg-red-500/15 px-4 py-3 text-center text-sm text-red-100">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="mt-7 space-y-8">
                <label className="block mb-8">
                  <span className="mb-2 block text-sm font-bold uppercase text-[#6B9D4A]">Usuário</span>
                  <div className="relative">
                    <UserRound size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#6B9D4A]" strokeWidth={1.8} />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="login-autofill h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] pl-14 pr-5 text-base text-white outline-none transition-all placeholder:text-white/35 focus:border-[#6B9D4A]/65 focus:bg-white/[0.06] focus:ring-2 focus:ring-[#6B9D4A]/15"
                      placeholder="Digite seu usuário"
                      required
                    />
                  </div>
                </label>

                <label className="block mb-6">
                  <span className="mb-2 block text-sm font-bold uppercase text-[#6B9D4A]">Senha</span>
                  <div className="relative">
                    <LockKeyhole size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#6B9D4A]" strokeWidth={1.8} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="login-autofill h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] pl-14 pr-12 text-base text-white outline-none transition-all placeholder:text-white/35 focus:border-[#6B9D4A]/65 focus:bg-white/[0.06] focus:ring-2 focus:ring-[#6B9D4A]/15"
                      placeholder="Digite sua senha"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-[#6B9D4A] transition-colors hover:text-[#A8C4A0] focus:outline-none"
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? <EyeOff size={24} strokeWidth={1.8} /> : <Eye size={24} strokeWidth={1.8} />}
                    </button>
                  </div>
                </label>

                <div className="flex justify-end pb-3">
                  <button type="button" className="text-base font-medium text-[#6B9D4A] transition-colors hover:text-[#A8C4A0]">
                    Esqueceu a senha?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex h-12 w-full items-center justify-center gap-4 rounded-xl bg-gradient-to-r from-[#6B9D4A] via-[#5f8a43] to-[#3f5f3f] text-base font-bold text-white shadow-xl shadow-black/30 transition-all duration-300 hover:-translate-y-0.5 hover:from-[#789f4f] hover:via-[#557d3d] hover:to-[#2f4a34] hover:shadow-[0_18px_36px_rgba(44,69,47,0.45)] focus:outline-none focus:ring-2 focus:ring-[#6B9D4A]/35 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  <LogIn size={22} className="transition-transform duration-300 group-hover:translate-x-1" />
                  {loading ? "Entrando..." : "Entrar no Sistema"}
                </button>
              </form>

              <div className="mt-7 grid grid-cols-2 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
                <div className="flex h-14 items-center justify-center gap-2.5 border-r border-white/10 px-3 text-sm font-medium text-white">
                  <ShieldCheck size={22} className="text-[#6B9D4A]" strokeWidth={1.8} />
                  Ambiente seguro
                </div>
                <div className="flex h-14 items-center justify-center gap-2.5 px-3 text-sm font-medium text-white">
                  <Sprout size={24} className="text-[#6B9D4A]" strokeWidth={1.8} />
                  SICPR v2.0
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
