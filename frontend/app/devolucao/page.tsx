"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { HistoricoResumo, ProcessoTimeline } from "../fluxo/ProcessoTimeline";
import TopBar from "../sidebar/page";
import {
  SITUACAO_LABELS,
  STATUS_COLORS,
  TIPO_PROCESSO_LABELS,
  formatDateTime,
  getOutrosDocumentos,
  loadProcessos,
} from "../fluxo/storage";
import type { ProcessoSicpr } from "../fluxo/types";
import { useAuthSession } from "../hooks/useAuthSession";

const COLORS = {
  primary: "#2D452F",
  background: "#F5F7F5",
  card: "#FFFFFF",
  text: "#1A2E1B",
  textLight: "#6B7C6A",
  border: "#E2E8E0",
  danger: "#B42318",
};

export default function DevolucaoPage() {
  const { username, logout, ready } = useAuthSession({ defaultUsername: "Usuario" });
  const [processos, setProcessos] = useState<ProcessoSicpr[]>([]);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      setProcessos(loadProcessos());
    }, 0);
    return () => window.clearTimeout(timer);
  }, [ready]);

  const devolvidos = useMemo(
    () => processos.filter((processo) => processo.situacao === "devolvido_gerente" || processo.situacao === "devolvido_analise"),
    [processos],
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
      <TopBar onLogout={logout} username={username} />
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: COLORS.primary }}>Devolucao</h1>
            <p className="text-sm" style={{ color: COLORS.textLight }}>Processos devolvidos ao tecnico responsavel com justificativa e vinculo preservado.</p>
          </div>

          <section className="grid gap-4 lg:grid-cols-2">
            {devolvidos.map((processo) => (
              <article key={processo.id} className="rounded-lg border p-4 shadow-sm" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold" style={{ color: COLORS.text }}>{processo.produtor}</h2>
                    <p className="text-xs" style={{ color: COLORS.textLight }}>{processo.cpf} | {TIPO_PROCESSO_LABELS[processo.tipoProcesso]}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_COLORS[processo.situacao]}`}>
                    {SITUACAO_LABELS[processo.situacao]}
                  </span>
                </div>

                <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
                  {processo.ultimaJustificativa || "Sem justificativa registrada."}
                </div>

                <div className="mt-4 grid gap-2 text-sm md:grid-cols-2" style={{ color: COLORS.text }}>
                  <span>Tecnico: {processo.tecnicoResponsavel}</span>
                  <span>UNLOC: {processo.unidadeLocal}</span>
                  <span>Gerente: {processo.gerenteResponsavel || "-"}</span>
                  <span>Analista: {processo.analistaResponsavel || "-"}</span>
                  <span>Memorando: {processo.memorandoNumero || "-"}</span>
                  <span>Atualizado: {formatDateTime(processo.historico[processo.historico.length - 1]?.dataHora)}</span>
                </div>

                <div className="mt-4 grid gap-3 text-xs md:grid-cols-2">
                  <div className="rounded-md border p-2" style={{ borderColor: COLORS.border }}>
                    <p className="mb-1 font-semibold" style={{ color: COLORS.text }}>Outros anexos</p>
                    {getOutrosDocumentos(processo).length > 0 ? getOutrosDocumentos(processo).map((doc) => <p key={doc.id} style={{ color: COLORS.textLight }}>{doc.arquivo}</p>) : <p style={{ color: COLORS.textLight }}>Sem anexos extras</p>}
                  </div>
                </div>

                <details className="mt-4">
                  <summary className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold" style={{ color: COLORS.danger }}>
                    Historico completo
                  </summary>
                  <div className="mt-3 space-y-3">
                    <HistoricoResumo processo={processo} />
                    <ProcessoTimeline processo={processo} />
                  </div>
                </details>

                <p className="mt-4 inline-flex items-center gap-2 text-xs" style={{ color: COLORS.textLight }}>
                  <RotateCcw size={14} />
                  Corrija e reenvie pela aba UNLOC.
                </p>
              </article>
            ))}
          </section>

          {devolvidos.length === 0 && <div className="rounded-lg border p-10 text-center text-sm" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border, color: COLORS.textLight }}>Nenhum processo devolvido.</div>}
        </div>
      </main>
    </div>
  );
}
