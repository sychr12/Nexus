// frontend/app/carteira/components/ListaCarteiras.tsx
"use client";

import { CarteiraResponse } from "../types/carteira";
import { baixarPdf, visualizarPdf } from "../services/carteiraService";
import { Download, Eye } from "lucide-react";
import { formatAnyDateToDateInput } from "@/app/_lib/dateInput";

interface ListaCarteirasProps {
  carteiras: CarteiraResponse[];
  isLoading?: boolean;
}

export default function ListaCarteiras({ carteiras, isLoading = false }: ListaCarteirasProps) {
  const formatarCpf = (cpf: string) => {
    if (!cpf) return "—";
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatarData = (data: string) => {
    if (!data) return "—";
    return formatAnyDateToDateInput(data);
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
        <div className="flex items-center justify-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-600 border-t-transparent"></div>
          Carregando carteiras...
        </div>
      </div>
    );
  }

  if (carteiras.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
        Nenhuma carteira encontrada
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-white">
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
                Unidade Local
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Validade
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {carteiras.map((carteira) => (
              <tr key={carteira.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                  {carteira.registro}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                  {carteira.nome}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                  {formatarCpf(carteira.cpf)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                  {carteira.propriedade}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                    {carteira.unloc}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                  {formatarData(carteira.validade)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => visualizarPdf(carteira.id)}
                      className="rounded-lg p-1.5 text-blue-600 transition-colors hover:bg-blue-50"
                      title="Visualizar PDF"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => baixarPdf(carteira.id, carteira.nome)}
                      className="rounded-lg p-1.5 text-green-600 transition-colors hover:bg-green-50"
                      title="Baixar PDF"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
