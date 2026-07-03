"use client";

import { SITUACAO_LABELS, STATUS_COLORS, formatDateTime } from "./storage";
import type { ProcessoSicpr } from "./types";

const COLORS = {
  primary: "#2D452F",
  text: "#1A2E1B",
  textLight: "#6B7C6A",
  border: "#E2E8E0",
};

export function HistoricoResumo({ processo }: { processo: ProcessoSicpr }) {
  const memorandos = getMemorandosProcesso(processo);
  const devolucoes = processo.historico.filter((item) => normalizeText(item.acao).includes("devolvido pela analise")).length;
  const ultimoMemorando = memorandos.at(-1)?.numero || processo.memorandoNumero || "-";

  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <ResumoItem label="Status atual" value={SITUACAO_LABELS[processo.situacao]} />
      <ResumoItem label="Memorandos" value={String(memorandos.length)} />
      <ResumoItem label="Devoluções" value={String(devolucoes)} />
      <ResumoItem label="Último memorando" value={ultimoMemorando} />
    </div>
  );
}

export function ProcessoTimeline({ processo }: { processo: ProcessoSicpr }) {
  const ciclos = getTimelineCycles(processo);

  return (
    <div className="space-y-3">
      {ciclos.map((ciclo, index) => (
        <details key={ciclo.id} open={index === ciclos.length - 1} className="rounded-md border bg-white" style={{ borderColor: COLORS.border }}>
          <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-4 py-3">
            <span className="font-semibold" style={{ color: COLORS.primary }}>{ciclo.titulo}</span>
            <span className="inline-flex items-center gap-2">
              {!ciclo.atual && <span className="text-xs font-semibold" style={{ color: COLORS.textLight }}>Ver ciclo</span>}
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${ciclo.statusClass}`}>
                {ciclo.status}
              </span>
            </span>
          </summary>
          <div className="border-t px-4 py-3" style={{ borderTopColor: COLORS.border }}>
            <div className="space-y-3">
              {ciclo.etapas.map((etapa) => (
                <div key={`${ciclo.id}-${etapa.titulo}`} className="grid grid-cols-[18px_1fr] gap-3 text-sm">
                  <span className={`mt-1 h-3 w-3 rounded-full ring-4 ${etapa.dotClass}`} />
                  <div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-semibold" style={{ color: COLORS.text }}>{etapa.titulo}</span>
                      {etapa.dataHora && <span style={{ color: COLORS.textLight }}>{formatDateTime(etapa.dataHora)}</span>}
                    </div>
                    {etapa.detalhes.length > 0 && (
                      <div className="mt-1 grid gap-1" style={{ color: COLORS.textLight }}>
                        {etapa.detalhes.map((detalhe) => <span key={detalhe}>{detalhe}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}

function ResumoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[#F5F7F5] px-3 py-2">
      <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>{label}</p>
      <p className="mt-1 truncate text-sm font-semibold" style={{ color: COLORS.text }}>{value}</p>
    </div>
  );
}

function getMemorandosProcesso(processo: ProcessoSicpr) {
  if (processo.memorandos?.length) return processo.memorandos;

  if (processo.memorandoNumero && processo.memorandoLoteId) {
    return [{
      loteId: processo.memorandoLoteId,
      numero: processo.memorandoNumero,
      arquivo: processo.memorandoArquivo || `Memorando ${processo.memorandoNumero}.pdf`,
      criadoEm: processo.memorandoCriadoEm || processo.gerenteAssinadoEm || processo.enviadoAnaliseEm || processo.criadoEm,
      gerenteResponsavel: processo.gerenteResponsavel || "-",
      unidadeLocal: processo.unidadeLocal,
      quantidade: processo.memorandoQuantidade || 1,
      produtores: processo.memorandoProdutores || [{ id: processo.id, produtor: processo.produtor, cpf: processo.cpf, tipoProcesso: processo.tipoProcesso }],
    }];
  }

  return [];
}

function getTimelineCycles(processo: ProcessoSicpr) {
  const memorandos = getMemorandosProcesso(processo);

  if (!memorandos.length) {
    return [{
      id: "sem-memorando",
      titulo: "Fluxo inicial",
      status: SITUACAO_LABELS[processo.situacao],
      statusClass: STATUS_COLORS[processo.situacao],
      atual: true,
      etapas: processo.historico.map((item) => ({
        titulo: item.acao,
        dataHora: item.dataHora,
        detalhes: item.observacao ? [item.observacao] : [],
        dotClass: getTimelineDotClass(item.acao),
      })),
    }];
  }

  return memorandos.map((memorando, index) => {
    const proximoMemorando = memorandos[index + 1];
    const encaminhadoGerente = findLastEventBefore(processo, "Encaminhado ao gerente", memorando.criadoEm);
    const devolucaoAnalise = findFirstEventBetween(processo, "Devolvido pela analise", memorando.criadoEm, proximoMemorando?.criadoEm);
    const isUltimo = index === memorandos.length - 1;

    const etapas = [
      {
        titulo: "Encaminhado ao gerente",
        dataHora: encaminhadoGerente?.dataHora,
        detalhes: [memorando.unidadeLocal],
        dotClass: "bg-amber-500 ring-amber-100",
      },
      {
        titulo: "Aprovação do gerente concluída",
        dataHora: memorando.criadoEm,
        detalhes: [
          `Gerente: ${memorando.gerenteResponsavel || "-"}`,
          `Memorando: ${memorando.numero}`,
          `Lote: ${memorando.quantidade} ${memorando.quantidade === 1 ? "processo" : "processos"}`,
          "Documentos assinados pelo gerente: Memorando e Declaração",
        ],
        dotClass: "bg-emerald-500 ring-emerald-100",
      },
      {
        titulo: "Encaminhado para análise",
        dataHora: memorando.criadoEm,
        detalhes: [],
        dotClass: "bg-indigo-500 ring-indigo-100",
      },
      ...(devolucaoAnalise ? [{
        titulo: "Devolvido pela análise",
        dataHora: devolucaoAnalise.dataHora,
        detalhes: devolucaoAnalise.observacao ? [`Motivo: ${devolucaoAnalise.observacao}`] : [],
        dotClass: "bg-red-500 ring-red-100",
      }] : []),
      ...(isUltimo ? [{
        titulo: "Status atual",
        dataHora: processo.analisadoEm || processo.lancadoEm,
        detalhes: [SITUACAO_LABELS[processo.situacao]],
        dotClass: getStatusDotClass(processo.situacao),
      }] : []),
    ];

    return {
      id: memorando.loteId,
      titulo: `Ciclo ${index + 1} - Memorando ${memorando.numero}`,
      status: isUltimo ? SITUACAO_LABELS[processo.situacao] : devolucaoAnalise ? "Devolvido" : "Histórico",
      statusClass: isUltimo ? STATUS_COLORS[processo.situacao] : devolucaoAnalise ? "bg-red-50 text-red-700 ring-red-100" : "bg-slate-50 text-slate-700 ring-slate-200",
      atual: isUltimo,
      etapas,
    };
  });
}

function findLastEventBefore(processo: ProcessoSicpr, acao: string, beforeIso?: string) {
  const beforeTime = beforeIso ? new Date(beforeIso).getTime() : Number.POSITIVE_INFINITY;
  const normalizedAction = normalizeText(acao);
  return [...processo.historico]
    .reverse()
    .find((item) => normalizeText(item.acao) === normalizedAction && new Date(item.dataHora).getTime() <= beforeTime);
}

function findFirstEventBetween(processo: ProcessoSicpr, acao: string, startIso?: string, endIso?: string) {
  const startTime = startIso ? new Date(startIso).getTime() : Number.NEGATIVE_INFINITY;
  const endTime = endIso ? new Date(endIso).getTime() : Number.POSITIVE_INFINITY;
  const normalizedAction = normalizeText(acao);
  return processo.historico.find((item) => {
    const time = new Date(item.dataHora).getTime();
    return normalizeText(item.acao) === normalizedAction && time >= startTime && time < endTime;
  });
}

function getTimelineDotClass(acao: string) {
  const value = normalizeText(acao);
  if (value.includes("devolvido")) return "bg-red-500 ring-red-100";
  if (value.includes("aprovado") || value.includes("concluido") || value.includes("criado")) return "bg-emerald-500 ring-emerald-100";
  if (value.includes("encaminhado")) return "bg-amber-500 ring-amber-100";
  return "bg-slate-400 ring-slate-100";
}

function getStatusDotClass(situacao: ProcessoSicpr["situacao"]) {
  if (situacao === "devolvido_analise" || situacao === "devolvido_gerente") return "bg-red-500 ring-red-100";
  if (situacao === "em_analise") return "bg-indigo-500 ring-indigo-100";
  if (situacao === "encaminhado_gerente") return "bg-amber-500 ring-amber-100";
  return "bg-emerald-500 ring-emerald-100";
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
