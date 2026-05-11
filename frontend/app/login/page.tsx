"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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

  const features = [
    { label: "Relatórios", color: "bg-emerald-500/20" },
    { label: "Lançamentos", color: "bg-blue-500/20" },
    { label: "Análises", color: "bg-purple-500/20" },
    { label: "Segurança", color: "bg-amber-500/20" },
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1f16] via-[#1a3a2a] to-[#2d5a3f] relative overflow-hidden">

      {/* Background animated blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[800px] h-[800px] bg-emerald-400/10 rounded-full animate-pulse"
             style={{ top: "-400px", left: "-400px", animationDuration: "8s" }} />
        <div className="absolute w-[600px] h-[600px] bg-teal-400/10 rounded-full animate-pulse"
             style={{ bottom: "-300px", right: "-300px", animationDuration: "6s", animationDelay: "2s" }} />
        <div className="absolute w-[400px] h-[400px] bg-green-400/10 rounded-full animate-pulse"
             style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", animationDuration: "10s", animationDelay: "4s" }} />
      </div>

      <div className={`w-full max-w-6xl mx-4 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>

        {/* Main Card */}
        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">

          {/* Header */}
          <div className="bg-black/30 px-6 py-4 border-b border-white/10">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl font-bold">S</span>
                </div>
                <div>
                  <h1 className="text-white font-bold text-xl">SICPR</h1>
                  <p className="text-emerald-300 text-xs">Sistema Integrado de Controle</p>
                </div>
              </div>
              <div className="flex gap-1 bg-white/5 rounded-full p-1">
                {["Dashboard", "Relatórios", "Lançamentos", "Análises"].map((tab, idx) => (
                  <button key={idx} disabled
                    className="px-4 py-1.5 text-sm text-white/60 cursor-default">
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-0">

            {/* Left — Login Form */}
            <div className="p-8 lg:p-12">
              <div className="max-w-md mx-auto">
                <div className="mb-8">
                  <div className="flex justify-center mb-6 lg:hidden">
                    <Image src="/logosicprtp.png" alt="SICPR" width={180} height={80} className="object-contain drop-shadow-lg" />
                  </div>
                  <h2 className="text-white text-3xl font-bold mb-2">Bem-vindo</h2>
                  <p className="text-emerald-200/80 text-sm">Acesse o sistema com suas credenciais de acesso</p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center">
                    {error}
                  </div>
                )}

                <form onSubmit={handleLogin} className="flex flex-col gap-6">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-4 rounded-xl bg-white/10 text-white outline-none focus:ring-2 focus:ring-emerald-400/60 border border-white/20 focus:border-emerald-400 transition-all placeholder:text-white/40"
                    placeholder="Usuário"
                    required
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-4 rounded-xl bg-white/10 text-white outline-none focus:ring-2 focus:ring-emerald-400/60 border border-white/20 focus:border-emerald-400 transition-all placeholder:text-white/40"
                    placeholder="Senha"
                    required
                  />
                  <div className="text-right">
                    <button type="button" className="text-xs text-emerald-300 hover:text-emerald-200 transition-colors">
                      Esqueceu a senha?
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full p-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all duration-300 font-semibold text-white shadow-lg disabled:opacity-60"
                  >
                    {loading ? "Entrando..." : "Acessar Sistema"}
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-emerald-200/60">
                  SICPR v2.0 • Sistema de Controle de Acesso
                </div>
              </div>
            </div>

            {/* Right — Features */}
            <div className="relative bg-black/30 p-8 lg:p-12">
              <div className="h-full flex flex-col justify-between">
                <div className="hidden lg:flex justify-center mb-8">
                  <Image src="/logosicprtp.png" alt="SICPR" width={200} height={90} className="object-contain drop-shadow-lg" />
                </div>

                <div>
                  <h3 className="text-white font-semibold text-lg mb-6">Módulos do Sistema</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {features.map((feature, idx) => (
                      <div
                        key={idx}
                        className={`${feature.color} rounded-xl p-4 border border-white/10 backdrop-blur-sm hover:scale-105 hover:border-emerald-400/50 transition-all duration-300 cursor-default`}
                        style={{ animation: "fadeInUp 0.5s ease-out forwards", animationDelay: `${idx * 100}ms`, opacity: 0 }}
                      >
                        <p className="text-white font-medium text-sm">{feature.label}</p>
                        <p className="text-emerald-200/50 text-xs mt-1">Módulo ativo</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-emerald-200/70">Sistema online</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full">
                    <span className="text-[10px] text-emerald-200/60">Criptografia SSL • Ambiente Seguro</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom nav preview — mobile */}
        <div className="mt-6 flex justify-center lg:hidden">
          <div className="bg-black/40 backdrop-blur-lg rounded-full px-6 py-2 border border-white/10 inline-flex gap-6">
            {["Home", "Dashboard", "Lançamentos", "Análises", "Mais"].map((item, idx) => (
              <button key={idx} disabled className="text-white/50 text-xs py-2 cursor-default">{item}</button>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}