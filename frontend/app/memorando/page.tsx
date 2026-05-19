"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MemorandoForm from "./components/MemorandoForm";
import MemorandoPreview from "./components/MemorandoPreview";
import TopBar from "../sidebar/page";
import { MemorandoForm as MemorandoFormType, Memorando } from "./types/memorando";
import { listarMemorandos } from "./services/memorando.service";

const COLORS = {
  background: "#EEF2EC",
  primary: "#1F3A2E",
  textLight: "#6E786F",
};

const initialForm: MemorandoFormType = {
  numero: "",
  descricao: "",
  unloc: "",
  memoEntrada: "",
};

export default function MemorandoPage() {
  const router = useRouter();
  const [form, setForm] = useState<MemorandoFormType>(initialForm);
  const [memorandos, setMemorandos] = useState<Memorando[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarMemorandos = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await listarMemorandos();
      setMemorandos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar memorandos");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarMemorandos();
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    router.push("/login");
  }

  const username =
    typeof window !== "undefined"
      ? localStorage.getItem("username") || "Usuário"
      : "Usuário";

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: COLORS.background }}>
      <TopBar onLogout={handleLogout} username={username} />

      <main className="px-4 sm:px-6 lg:px-10 py-8 max-w-screen-2xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1
            className="text-3xl font-black tracking-tight"
            style={{ color: COLORS.primary, letterSpacing: "-0.02em" }}
          >
            Memorando de Saída
          </h1>
          <p className="text-sm mt-1.5" style={{ color: COLORS.textLight }}>
            Crie e gerencie memorandos de saída do sistema
          </p>
        </div>

        {/* Global error banner */}
        {error && (
          <div
            className="mb-6 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2"
            style={{ backgroundColor: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}
          >
            <span>⚠</span> {error}
            <button
              onClick={carregarMemorandos}
              className="ml-auto underline text-xs hover:opacity-70 transition-opacity"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Two-column layout */}
        <div className="flex gap-6 items-start">
          <div className="w-1/2 sticky top-6">
            <MemorandoForm form={form} setForm={setForm} onSuccess={carregarMemorandos} />
          </div>
          <div className="w-1/2">
            <MemorandoPreview form={form} memorandos={memorandos} isLoading={isLoading} />
          </div>
        </div>
      </main>
    </div>
  );
}