// frontend/app/carteira/components/AnalysisDesigner.tsx
"use client";

import { CarteiraEstatistica } from "../types/carteira";

interface AnalysisDesignerProps {
  estatisticas: CarteiraEstatistica;
}

export default function AnalysisDesigner({ estatisticas }: AnalysisDesignerProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">Indicadores</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          <p className="text-sm text-gray-500">Total de Carteiras</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {estatisticas.totalCarteiras}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          <p className="text-sm text-gray-500">Produtores Ativos</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {estatisticas.totalUsuarios}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          <p className="text-sm text-gray-500">Municípios Atendidos</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {Object.keys(estatisticas.totalPorUnloc).length}
          </p>
        </div>
      </div>
    </div>
  );
}