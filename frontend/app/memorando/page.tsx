"use client";

import { useEffect, useState } from "react";
import MemorandoForm from "./components/MemorandoForm";
import MemorandoPreview from "./components/MemorandoPreview";
import TopBar from "../sidebar/page";
import { useAuthSession } from "../hooks/useAuthSession";
import {
  MemorandoForm as MemorandoFormType,
  Memorando,
} from "./types/memorando";
import { listarMemorandos } from "./services/memorando.service";

const KEYFRAMES = `
@keyframes fadeUp{
  from{
    opacity:0;
    transform:translateY(20px)
  }
  to{
    opacity:1;
    transform:translateY(0)
  }
}

@keyframes bannerIn{
  from{
    opacity:0;
    transform:translateY(-12px) scaleY(.9)
  }
  to{
    opacity:1;
    transform:translateY(0) scaleY(1)
  }
}
`;

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
  const { username, logout, ready } = useAuthSession({ defaultUsername: "Usuario" });

  const [form, setForm] = useState<MemorandoFormType>(initialForm);
  const [memorandos, setMemorandos] = useState<Memorando[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!document.getElementById("kf-page")) {
      const s = document.createElement("style");
      s.id = "kf-page";
      s.textContent = KEYFRAMES;
      document.head.appendChild(s);
    }

    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);


  const carregarMemorandos = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await listarMemorandos();
      setMemorandos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar memorandos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!ready) return;
    carregarMemorandos();
  }, [ready]);

  return (
    <div
      className="min-h-screen font-sans"
      style={{
        backgroundColor: COLORS.background,
        opacity: mounted ? 1 : 0,
        transition: "opacity .3s ease",
      }}
    >
      <TopBar onLogout={logout} username={username} />

      <main style={{ paddingTop: "70px", minHeight: "100vh" }}>
        <div className="px-4 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto">
          {/* Header */}
          <div
            className="mb-5"
            style={{
              animation: mounted ? "fadeUp .5s ease both" : "none",
            }}
          >
            <h1
              className="text-3xl font-black tracking-tight"
              style={{ color: COLORS.primary }}
            >
              Memorando de Saída
            </h1>
            <p
              className="text-sm mt-1"
              style={{ color: COLORS.textLight }}
            >
              Crie e gerencie memorandos
            </p>
          </div>

          {/* Banner erro */}
          {error && (
            <div
              className="mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2"
              style={{
                backgroundColor: "#FEF2F2",
                color: "#DC2626",
                border: "1px solid #FECACA",
                animation: "bannerIn .35s ease both",
              }}
            >
              <span>⚠</span>
              {error}
              <button
                onClick={carregarMemorandos}
                className="ml-auto underline text-xs"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Layout */}
          <div className="flex flex-col lg:flex-row gap-4 items-start">
            {/* Form */}
            <div
              className="w-full lg:w-[42%] sticky top-3"
              style={{
                animation: mounted ? "fadeUp .55s ease both" : "none",
              }}
            >
              <MemorandoForm
                form={form}
                setForm={setForm}
                onSuccess={carregarMemorandos}
              />
            </div>

            {/* Preview */}
            <div
              className="w-full lg:w-[58%]"
              style={{
                animation: mounted ? "fadeUp .55s ease both" : "none",
              }}
            >
              <MemorandoPreview
                form={form}
                memorandos={memorandos}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
