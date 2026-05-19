"use client";

/**
 * Componentes de renderização para a área de análises.
 * Define os cards visuais exibidos na tela:
 * - EmptyState: mensagem quando não há resultados
 * - MemorandoCard: card do memorando com resumo de produtores e status
 * - ProdutorCard: card individual do produtor com tipo identificado e resultado GCC
 * Todos os cards são interativos e abrem o modal de análise ao clicar.
 */


import { FileText } from "lucide-react";
import {
  COLORS,
  DISPATCH_TARGET_LABELS,
  GCC_STATUS_LABELS,
  HOVER_LIFT,
  PRODUCER_STATUS_LABELS,
  STATUS_LABELS,
  TIPO_IDENTIFICADO_LABELS,
} from "./data";
import {
  formatDate,
  formatTime,
  getMemorandoSummary,
  getProcessoGccStatus,
  getProcessoTipo,
  getStatusTone,
} from "./rules";
import type { MemorandoAnalise, ProcessoProdutor, ProducerStatus } from "./types";

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
      <FileText size={34} style={{ color: COLORS.textLight }} />
      <p className="mt-3 text-sm" style={{ color: COLORS.textLight }}>{message}</p>
    </div>
  );
}

export function MemorandoCard({
  memorando,
  onOpen,
}: {
  memorando: MemorandoAnalise;
  onOpen: (memorando: MemorandoAnalise) => void;
}) {
  const statusTone = getStatusTone(memorando.status);
  const summary = getMemorandoSummary(memorando);
  const identificados = memorando.processos.length;
  const divergencia = identificados !== memorando.produtoresInformados;

  return (
    <article className={`w-[620px] shrink-0 rounded-lg border p-4 ${HOVER_LIFT}`} style={{ borderColor: COLORS.border }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{memorando.numero}</p>
          <h3 className="mt-1 text-base font-bold" style={{ color: COLORS.primary }}>{memorando.titulo}</h3>
          <p className="mt-1 text-sm" style={{ color: COLORS.textLight }}>{memorando.localidade} · Tipo definido por análise no sistema de consulta</p>
        </div>
        <span className="w-fit rounded-full border px-2 py-1 text-xs font-semibold" style={statusTone}>
          {STATUS_LABELS[memorando.status]}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Data", formatDate(memorando.recebidoEm)],
          ["Hora", formatTime(memorando.recebidoEm)],
          ["Produtores", memorando.produtoresInformados],
          ["Identificados", identificados],
        ].map(([label, value]) => (
          <InfoBox key={label} label={String(label)} value={String(value)} />
        ))}
      </div>

      {divergencia && (
        <div className="mt-3 rounded-md border px-3 py-2 text-sm" style={{ borderColor: "#FEDF89", backgroundColor: "#FFFAEB", color: COLORS.warning }}>
          O memorando cita {memorando.produtoresInformados} produtor(es), mas o sistema identificou {identificados} processo(s).
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {summary.aptos > 0 && (
          <span className="rounded-full border px-2 py-1 font-medium" style={{ borderColor: "#ABEFC6", backgroundColor: "#ECFDF3", color: "#027A48" }}>
            {summary.aptos} apto(s)
          </span>
        )}
        {summary.pendentes > 0 && (
          <span className="rounded-full border px-2 py-1 font-medium" style={{ borderColor: "#FEDF89", backgroundColor: "#FFFAEB", color: COLORS.warning }}>
            {summary.pendentes} a conferir
          </span>
        )}
        {summary.devolucoes > 0 && (
          <span className="rounded-full border px-2 py-1 font-medium" style={{ borderColor: "#FECDCA", backgroundColor: "#FEF3F2", color: COLORS.danger }}>
            {summary.devolucoes} devolução
          </span>
        )}
      </div>

      {(summary.lancamentosEncaminhados + summary.devolucoesEncaminhadas) > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {summary.lancamentosEncaminhados > 0 && (
            <span className="rounded-full border px-2 py-1 font-medium" style={{ borderColor: "#B2DDFF", backgroundColor: "#EFF8FF", color: COLORS.info }}>
              {summary.lancamentosEncaminhados} em lançamento
            </span>
          )}
          {summary.devolucoesEncaminhadas > 0 && (
            <span className="rounded-full border px-2 py-1 font-medium" style={{ borderColor: "#FECDCA", backgroundColor: "#FEF3F2", color: COLORS.danger }}>
              {summary.devolucoesEncaminhadas} devolvido(s)
            </span>
          )}
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => onOpen(memorando)}
          className="group relative overflow-hidden rounded-md px-4 py-2 text-xs font-semibold transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
          style={{ color: COLORS.primary, border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}
        >
          <span className="absolute inset-0 -translate-x-full bg-[#6B9D4A] transition-transform duration-300 ease-out group-hover:translate-x-0" />
          <span className="absolute inset-y-0 left-0 w-8 -translate-x-10 skew-x-[-18deg] bg-white/35 transition-transform duration-700 ease-out group-hover:translate-x-28" />
          <span className="relative z-10 transition-colors duration-300 group-hover:text-white">Analisar</span>
        </button>
      </div>
    </article>
  );
}

export function ProdutorCard({
  memorando,
  processo,
  producerStatus,
  onOpen,
}: {
  memorando: MemorandoAnalise;
  processo: ProcessoProdutor;
  producerStatus: ProducerStatus;
  onOpen: (memorando: MemorandoAnalise, processo: ProcessoProdutor) => void;
}) {
  const producerTone = getStatusTone(producerStatus);
  const dispatchLabel = processo.encaminhadoPara ? DISPATCH_TARGET_LABELS[processo.encaminhadoPara] : null;
  const dispatchTone =
    processo.encaminhadoPara === "devolucao"
      ? { borderColor: "#FECDCA", backgroundColor: "#FEF3F2", color: COLORS.danger }
      : { borderColor: "#ABEFC6", backgroundColor: "#ECFDF3", color: "#027A48" };

  return (
    <article className={`w-[640px] shrink-0 rounded-lg border p-4 ${HOVER_LIFT}`} style={{ borderColor: COLORS.border, backgroundColor: COLORS.card }}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <button type="button" onClick={() => onOpen(memorando, processo)} className="text-left">
          <h3 className="text-base font-bold hover:underline" style={{ color: COLORS.primary }}>{processo.produtor}</h3>
          <p className="mt-1 text-sm" style={{ color: COLORS.textLight }}>{processo.cpf}</p>
        </button>
        <span className="w-fit rounded-full border px-2 py-1 text-xs font-semibold" style={producerTone}>
          {PRODUCER_STATUS_LABELS[producerStatus]}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <InfoBox label="Memorando" value={memorando.numero} />
        <InfoBox label="Localidade" value={memorando.localidade} />
        <InfoBox label="Recebido" value={`${formatDate(memorando.recebidoEm)} · ${formatTime(memorando.recebidoEm)}`} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border px-2 py-1 font-medium" style={{ borderColor: "#B2DDFF", backgroundColor: "#EFF8FF", color: COLORS.info }}>
          {TIPO_IDENTIFICADO_LABELS[getProcessoTipo(processo)]}
        </span>
        <span className="rounded-full border px-2 py-1 font-medium" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background, color: COLORS.textLight }}>
          {GCC_STATUS_LABELS[getProcessoGccStatus(processo)]}
        </span>
        {dispatchLabel && (
          <span className="rounded-full border px-2 py-1 font-medium" style={dispatchTone}>
            {dispatchLabel}
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => onOpen(memorando, processo)}
          className="group relative overflow-hidden rounded-md px-4 py-2 text-xs font-semibold transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
          style={{ color: COLORS.primary, border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}
        >
          <span className="absolute inset-0 -translate-x-full bg-[#6B9D4A] transition-transform duration-300 ease-out group-hover:translate-x-0" />
          <span className="absolute inset-y-0 left-0 w-8 -translate-x-10 skew-x-[-18deg] bg-white/35 transition-transform duration-700 ease-out group-hover:translate-x-28" />
          <span className="relative z-10 transition-colors duration-300 group-hover:text-white">Analisar produtor</span>
        </button>
      </div>
    </article>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border px-3 py-2" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
      <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>{label}</p>
      <p className="mt-1 text-sm font-medium" style={{ color: COLORS.text }}>{value}</p>
    </div>
  );
}
