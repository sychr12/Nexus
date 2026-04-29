"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.token);
        router.push("/dashboard");
      } else {
        alert("Credenciais inválidas");
      }
    } catch (err) {
      alert("Erro no servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F2A1D] via-[#375534] to-[#6B9071] relative overflow-hidden">

      {/* brilho de fundo */}
      <div className="absolute w-[500px] h-[500px] bg-green-400/20 blur-[120px] top-[-100px] left-[-100px]" />
      <div className="absolute w-[400px] h-[400px] bg-green-300/20 blur-[120px] bottom-[-100px] right-[-100px]" />

      <div className="w-full max-w-md p-10 rounded-3xl bg-white/10 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-white/20 z-10">

        {/* LOGO */}
        <div className="flex justify-center mb-6">
          <Image
            src="/logosicprtp.png"
            alt="SICPR"
            width={200}
            height={90}
            className="object-contain drop-shadow-lg"
          />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-white text-2xl font-semibold">
            Bem-vindo de volta
          </h2>
          <p className="text-green-200 text-sm mt-1">
            Acesse o sistema com suas credenciais
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">

          {/* INPUT USUÁRIO */}
          <div className="relative">
            <input
              type="text"
              placeholder=" "
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="peer w-full p-4 rounded-xl bg-white/20 text-white placeholder-transparent outline-none focus:ring-2 focus:ring-green-400"
            />
            <label className="absolute left-4 top-4 text-gray-300 text-sm transition-all 
              peer-placeholder-shown:top-4 
              peer-placeholder-shown:text-gray-400 
              peer-focus:top-1 
              peer-focus:text-green-300 
              peer-focus:text-xs">
              Usuário
            </label>
          </div>

          {/* INPUT SENHA */}
          <div className="relative">
            <input
              type="password"
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="peer w-full p-4 rounded-xl bg-white/20 text-white placeholder-transparent outline-none focus:ring-2 focus:ring-green-400"
            />
            <label className="absolute left-4 top-4 text-gray-300 text-sm transition-all 
              peer-placeholder-shown:top-4 
              peer-placeholder-shown:text-gray-400 
              peer-focus:top-1 
              peer-focus:text-green-300 
              peer-focus:text-xs">
              Senha
            </label>
          </div>

          {/* BOTÃO */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 p-4 rounded-xl bg-gradient-to-r from-[#0F2A1D] to-[#2D452F] hover:scale-[1.02] active:scale-[0.98] transition text-white font-semibold shadow-lg disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {/* FOOTER */}
        <div className="mt-8 text-center text-xs text-green-200 opacity-80">
          SICPR • Sistema de Controle de Acesso
        </div>
      </div>
    </div>
  );
}