"use client";

import { CheckCircle2, Eye, FileText, RotateCcw, X } from "lucide-react";
import { HistoricoResumo, ProcessoTimeline } from "@/app/_features/fluxo/ProcessoTimeline";
import { DetailInfoCard, SICPR_COLORS } from "@/app/_features/fluxo/SharedUi";
import {
  SITUACAO_LABELS,
  STATUS_COLORS,
  TIPO_PROCESSO_LABELS,
  formatDateTime,
  getDocumentosGerados,
  getOutrosDocumentos,
} from "@/app/_features/fluxo/storage";
import type { DocumentoGeradoProcesso, DocumentoProcesso, ProcessoSicpr } from "@/app/_features/fluxo/types";
import type { DetailTab } from "./types";

const COLORS = SICPR_COLORS;

type PreviewTarget =
  | { tipo: "gerado"; processo: ProcessoSicpr; documento: DocumentoGeradoProcesso }
  | { tipo: "anexo"; processo: ProcessoSicpr; documento: DocumentoProcesso };

type Props = {
  processo: ProcessoSicpr;
  activeTab: DetailTab;
  selected: boolean;
  justificativa: string;
  onTabChange: (tab: DetailTab) => void;
  onClose: () => void;
  onJustificativaChange: (value: string) => void;
  onToggleSelected: (id: string) => void;
  onDevolver: (id: string) => void;
  onPreview: (preview: PreviewTarget) => void;
};

const DETAIL_TABS: Array<{ key: DetailTab; label: string }> = [
  { key: "dados", label: "Dados" },
  { key: "historico", label: "Historico" },
  { key: "documentos", label: "Documentos" },
];

export default function GerenteProcessDetailsModal({
  processo,
  activeTab,
  selected,
  justificativa,
  onTabChange,
  onClose,
  onJustificativaChange,
  onToggleSelected,
  onDevolver,
  onPreview,
}: Props) {
  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center px-4 py-5">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <section className="relative flex h-[90vh] w-[90vw] max-w-[1400px] flex-col overflow-hidden rounded-lg border shadow-2xl" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderBottomColor: COLORS.border }}>
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Detalhes do processo</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold" style={{ color: COLORS.primary }}>{processo.produtor}</h2>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_COLORS[processo.situacao]}`}>
                {SITUACAO_LABELS[processo.situacao]}
              </span>
            </div>
            <p className="text-sm" style={{ color: COLORS.textLight }}>{processo.cpf} | {processo.unidadeLocal} | {TIPO_PROCESSO_LABELS[processo.tipoProcesso]}</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-gray-100" style={{ color: COLORS.textLight }}>
            <X size={18} />
          </button>
        </div>

        <div className="border-b px-5 pt-3" style={{ borderBottomColor: COLORS.border }}>
          <div className="flex flex-wrap gap-2">
            {DETAIL_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab.key)}
                className="rounded-t-md px-3 py-2 text-sm font-semibold transition-colors"
                style={{
                  backgroundColor: activeTab === tab.key ? COLORS.background : "transparent",
                  color: activeTab === tab.key ? COLORS.primary : COLORS.textLight,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-5">
          {activeTab === "dados" && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <DetailInfoCard label="Status" value={SITUACAO_LABELS[processo.situacao]} badgeClass={STATUS_COLORS[processo.situacao]} />
                <DetailInfoCard label="Tecnico responsavel" value={processo.tecnicoResponsavel} />
                <DetailInfoCard label="Unidade Local" value={processo.unidadeLocal} />
                <DetailInfoCard label="Encaminhado ao gerente" value={formatDateTime(processo.encaminhadoGerenteEm)} />
                <DetailInfoCard label="Formulario" value={processo.formulario} />
                <DetailInfoCard label="Outros anexos" value={String(getOutrosDocumentos(processo).length)} />
              </div>

              <textarea
                value={justificativa}
                onChange={(event) => onJustificativaChange(event.target.value)}
                placeholder="Justificativa obrigatoria para devolucao: documento ilegivel, faltando, dados incorretos..."
                rows={3}
                className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                style={{ borderColor: COLORS.border }}
              />
            </div>
          )}

          {activeTab === "historico" && (
            <div className="grid gap-4">
              <div className="rounded-md border p-4" style={{ borderColor: COLORS.border }}>
                <p className="mb-3 font-semibold" style={{ color: COLORS.text }}>Resumo do historico</p>
                <HistoricoResumo processo={processo} />
              </div>
              <div className="rounded-md border p-4" style={{ borderColor: COLORS.border }}>
                <p className="mb-4 font-semibold" style={{ color: COLORS.text }}>Timeline do processo</p>
                <ProcessoTimeline processo={processo} />
              </div>
            </div>
          )}

          {activeTab === "documentos" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-md border p-4" style={{ borderColor: COLORS.border }}>
                <p className="mb-2 inline-flex items-center gap-2 font-semibold" style={{ color: COLORS.text }}>
                  <FileText size={15} /> Documentos gerados automaticamente
                </p>
                {getDocumentosGerados(processo).map((doc) => (
                  <button
                    key={doc.arquivo}
                    type="button"
                    onClick={() => onPreview({ tipo: "gerado", processo, documento: doc })}
                    className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left transition-colors hover:bg-[#F5F7F5]"
                    style={{ color: COLORS.textLight }}
                  >
                    <Eye size={13} style={{ color: COLORS.primary }} />
                    <span className="min-w-0 truncate">{doc.nome}</span>
                  </button>
                ))}
              </div>
              <div className="rounded-md border p-4" style={{ borderColor: COLORS.border }}>
                <p className="mb-2 font-semibold" style={{ color: COLORS.text }}>Documentos anexados</p>
                {getOutrosDocumentos(processo).length > 0 ? getOutrosDocumentos(processo).map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => onPreview({ tipo: "anexo", processo, documento: doc })}
                    className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left transition-colors hover:bg-[#F5F7F5]"
                    style={{ color: COLORS.textLight }}
                  >
                    <Eye size={13} style={{ color: COLORS.primary }} />
                    <span className="min-w-0 truncate">{doc.arquivo}</span>
                  </button>
                )) : <p className="text-sm" style={{ color: COLORS.textLight }}>Sem anexos extras</p>}
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t px-5 py-4" style={{ borderTopColor: COLORS.border }}>
          <button type="button" onClick={() => onToggleSelected(processo.id)} className="sicpr-action-button inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white" style={{ backgroundColor: selected ? COLORS.accent : COLORS.primary }}>
            <CheckCircle2 size={15} />
            {selected ? "Selecionado" : "Selecionar para lote"}
          </button>
          <button type="button" onClick={() => onDevolver(processo.id)} className="sicpr-danger-button inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white" style={{ backgroundColor: COLORS.danger }}>
            <RotateCcw size={15} />
            Devolver
          </button>
        </div>
      </section>
    </div>
  );
}
