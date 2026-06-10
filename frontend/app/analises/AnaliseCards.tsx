"use client";

import { CheckCircle2, FileText, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
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
  getDerivedMemoStatus,
  getMemorandoSummary,
  getProcessoGccStatus,
  getProcessoStatus,
  getProcessoTipo,
  getStatusTone,
} from "./rules";
import type { MemorandoAnalise, ProcessoProdutor } from "./types";

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
  const derivedStatus = getDerivedMemoStatus(memorando);
  const statusTone = getStatusTone(derivedStatus);
  const summary = getMemorandoSummary(memorando);
  const identificados = memorando.processos.length;
  const divergencia = identificados !== memorando.produtoresInformados;

  return (
    <article className={`w-[620px] shrink-0 rounded-lg border p-4 ${HOVER_LIFT}`} style={{ borderColor: COLORS.border, backgroundColor: COLORS.card }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{memorando.numero}</p>
          <h3 className="mt-1 text-base font-bold" style={{ color: COLORS.primary }}>{memorando.titulo}</h3>
          <p className="mt-1 text-sm" style={{ color: COLORS.textLight }}>{memorando.localidade}</p>
        </div>
        <span className="w-fit rounded-full border px-2 py-1 text-xs font-semibold" style={statusTone}>
          {STATUS_LABELS[derivedStatus]}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <InfoBox label="Data" value={formatDate(memorando.recebidoEm)} />
        <InfoBox label="Hora" value={formatTime(memorando.recebidoEm)} />
        <InfoBox label="Informados" value={String(memorando.produtoresInformados)} />
        <InfoBox label="Identificados" value={String(identificados)} />
      </div>

      {divergencia && (
        <div className="mt-3 rounded-md border px-3 py-2 text-sm" style={{ borderColor: "#FEDF89", backgroundColor: "#FFFAEB", color: COLORS.warning }}>
          O memorando cita {memorando.produtoresInformados} produtor(es), mas foram identificados {identificados} processo(s).
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <Badge tone="neutral">{summary.naoAnalisados} sem decisao</Badge>
        <Badge tone="success">{summary.lancamentos} lancamento(s)</Badge>
        <Badge tone="danger">{summary.devolucoes} devolucao(oes)</Badge>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => onOpen(memorando)}
          className="group relative overflow-hidden rounded-md px-4 py-2 text-xs font-semibold transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
          style={{ color: COLORS.primary, border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}
        >
          <span className="absolute inset-0 -translate-x-full bg-[#6B9D4A] transition-transform duration-300 ease-out group-hover:translate-x-0" />
          <span className="relative z-10 transition-colors duration-300 group-hover:text-white">Analisar</span>
        </button>
      </div>
    </article>
  );
}

export function ProdutorCard({
  memorando,
  processo,
  onOpen,
}: {
  memorando: MemorandoAnalise;
  processo: ProcessoProdutor;
  onOpen: (memorando: MemorandoAnalise, processo: ProcessoProdutor) => void;
}) {
  const producerStatus = getProcessoStatus(processo);
  const producerTone = getStatusTone(producerStatus);
  const dispatchLabel = processo.encaminhadoPara ? DISPATCH_TARGET_LABELS[processo.encaminhadoPara] : null;

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

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoBox label="Memorando" value={memorando.numero} />
        <InfoBox label="Recebido" value={`${formatDate(memorando.recebidoEm)} - ${formatTime(memorando.recebidoEm)}`} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <Badge tone="info">{TIPO_IDENTIFICADO_LABELS[getProcessoTipo(processo)]}</Badge>
        <Badge tone="neutral">{GCC_STATUS_LABELS[getProcessoGccStatus(processo)]}</Badge>
        {dispatchLabel && <Badge tone={processo.encaminhadoPara === "devolucao" ? "danger" : "success"}>{dispatchLabel}</Badge>}
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => onOpen(memorando, processo)}
          className="group relative overflow-hidden rounded-md px-4 py-2 text-xs font-semibold transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
          style={{ color: COLORS.primary, border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}
        >
          <span className="absolute inset-0 -translate-x-full bg-[#6B9D4A] transition-transform duration-300 ease-out group-hover:translate-x-0" />
          <span className="relative z-10 transition-colors duration-300 group-hover:text-white">Analisar produtor</span>
        </button>
      </div>
    </article>
  );
}

function Badge({ children, tone }: { children: ReactNode; tone: "success" | "danger" | "warning" | "info" | "neutral" }) {
  const styles = {
    success: { borderColor: "#ABEFC6", backgroundColor: "#ECFDF3", color: "#027A48" },
    danger: { borderColor: "#FECDCA", backgroundColor: "#FEF3F2", color: COLORS.danger },
    warning: { borderColor: "#FEDF89", backgroundColor: "#FFFAEB", color: COLORS.warning },
    info: { borderColor: "#B2DDFF", backgroundColor: "#EFF8FF", color: COLORS.info },
    neutral: { borderColor: COLORS.border, backgroundColor: COLORS.background, color: COLORS.textLight },
  }[tone];

  const Icon = tone === "success" ? CheckCircle2 : tone === "danger" ? RotateCcw : null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 font-medium" style={styles}>
      {Icon && <Icon size={12} />}
      {children}
    </span>
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
