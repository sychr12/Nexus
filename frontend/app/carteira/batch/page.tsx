// app/carteira/batch/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import BatchUpload from "../components/BatchUpload";
import TopBar from "../../sidebar/page";

export default function BatchPage() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    router.push("/login");
  };

  const username = typeof window !== "undefined" 
    ? localStorage.getItem("username") || "Usuário" 
    : "Usuário";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  return (
    <>
      <TopBar onLogout={handleLogout} username={username} />
      <div className="min-h-screen bg-gray-50 pt-[104px] lg:pt-[152px]">
        <div className="p-6">
          <div className="mx-auto max-w-5xl space-y-6">
            <header className="rounded-2xl bg-white p-6 shadow-sm">
              <h1 className="text-3xl font-bold text-gray-900">Gerar Carteiras em Lote</h1>
              <p className="mt-2 text-gray-600">
                Processe múltiplas carteiras digitais a partir de arquivos PDF
              </p>
              <div className="mt-4 flex gap-2">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
                  Nome do PDF = CPF do produtor
                </span>
                <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800">
                  Suporte a arquivos ZIP
                </span>
              </div>
            </header>
            <BatchUpload />
          </div>
        </div>
      </div>
    </>
  );
}