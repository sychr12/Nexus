"use client";

import { useEffect, useState } from "react";
import { listarCarteiras } from "../services/carteiraService";
import { CarteiraResponse } from "../types/carteira";

export default function HistoricoCarteiraPage() {
  const [historico, setHistorico] = useState<CarteiraResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function carregarHistorico() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await listarCarteiras(0, 100);
        setHistorico(response.content);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar histórico");
      } finally {
        setIsLoading(false);
      }
    }
    carregarHistorico();
  }, []);

  const formatarData = (data: string) => {
    if (!data) return "—";
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatarCpf = (cpf: string) => {
    if (!cpf) return "—";
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="flex items-center justify-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-600 border-t-transparent"></div>
              <span className="text-gray-500">Carregando histórico...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">Histórico da Carteira Digital</h1>
          <p className="mt-2 text-slate-600">
            Visualize todas as carteiras digitais registradas no sistema.
          </p>
          <div className="mt-4 flex gap-2">
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800">
              Total: {historico.length} carteiras
            </span>
          </div>
        </header>

        {error && (
          <div className="rounded-3xl bg-rose-50 p-4 text-rose-700 shadow-sm">
            <strong>Erro:</strong> {error}
          </div>
        )}

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Registro
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Produtor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    CPF
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Propriedade
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    UNLOC
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Data de Criação
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Usuário
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {historico.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      Nenhuma carteira encontrada
                    </td>
                  </tr>
                ) : (
                  historico.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                        {item.registro}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {item.nome}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {formatarCpf(item.cpf)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {item.propriedade}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                          {item.unloc}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {formatarData(item.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {item.usuario}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}