"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import TopBar from "../../sidebar/page";
import FormularioCarteira from "../components/FormularioCarteira";
import { cadastrarCarteira } from "../services/carteiraService";
import { CarteiraRequest } from "../types/carteira";

const COLORS = {
  background: "#EEF2EC",
  primary: "#1F3A2E",
  textLight: "#6E786F",
  danger: "#DC2626",
  success: "#166534",
};

export default function AdicionarCarteiraPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const username = typeof window !== "undefined"
    ? localStorage.getItem("username") || "Usuário"
    : "Usuário";

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    router.push("/login");
  }

  async function handleSubmit(data: CarteiraRequest) {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      await cadastrarCarteira(data);
      setSuccess("Carteira digital cadastrada com sucesso!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar carteira");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
      <TopBar onLogout={handleLogout} username={username} />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight" style={{ color: COLORS.primary }}>
            Nova Carteira Digital
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: COLORS.textLight }}>
            Cadastre uma carteira digital do produtor rural
          </p>
        </div>

        {success && (
          <div
            className="mb-6 rounded-xl px-4 py-3 text-sm font-medium"
            style={{ backgroundColor: "#DCFCE7", color: COLORS.success, border: "1px solid #BBF7D0" }}
          >
            {success}
          </div>
        )}

        {error && (
          <div
            className="mb-6 rounded-xl px-4 py-3 text-sm font-medium"
            style={{ backgroundColor: "#FEF2F2", color: COLORS.danger, border: "1px solid #FECACA" }}
          >
            {error}
          </div>
        )}

        <FormularioCarteira onSubmit={handleSubmit} isLoading={isLoading} />
      </main>
    </div>
  );
}
