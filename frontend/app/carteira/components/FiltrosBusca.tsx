// frontend/app/carteira/components/FiltrosBusca.tsx
"use client";

import { Search, X } from "lucide-react";

interface FiltrosBuscaProps {
  searchTerm: string;
  onSearch: (value: string) => void;
  selectedUnloc: string;
  onUnlocChange: (value: string) => void;
  usuarios: string[];
}

export default function FiltrosBusca({
  searchTerm,
  onSearch,
  selectedUnloc,
  onUnlocChange,
  usuarios,
}: FiltrosBuscaProps) {
  const unlocOptions = [
    { value: "", label: "Todos os municípios" },
    { value: "MAO", label: "MAO - Manaus" },
    { value: "PAR", label: "PAR - Parintins" },
    { value: "ITA", label: "ITA - Itacoatiara" },
    { value: "COA", label: "COA - Coari" },
    { value: "TEF", label: "TEF - Tefé" },
    { value: "TAB", label: "TAB - Tabatinga" },
    { value: "HUM", label: "HUM - Humaitá" },
    { value: "LAB", label: "LAB - Lábrea" },
    { value: "MCO", label: "MCO - Manicoré" },
  ];

  const hasFilters = searchTerm !== "" || selectedUnloc !== "";

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Filtrar resultados</h2>
        {hasFilters && (
          <button
            onClick={() => {
              onSearch("");
              onUnlocChange("");
            }}
            className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
          >
            <X size={14} />
            Limpar filtros
          </button>
        )}
      </div>

      <div className="mt-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Buscar por nome, CPF ou registro..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        <select
          value={selectedUnloc}
          onChange={(e) => onUnlocChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        >
          {unlocOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}