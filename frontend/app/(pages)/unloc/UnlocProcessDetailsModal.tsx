"use client";

import { Eye, FileText, Paperclip, RotateCcw, Send, X } from "lucide-react";
import { HistoricoResumo, ProcessoTimeline } from "@/app/_features/fluxo/ProcessoTimeline";
import { DetailInfoCard, SICPR_COLORS } from "@/app/_features/fluxo/SharedUi";
import {
  FAC_STATUS_LABELS,
  SITUACAO_LABELS,
  STATUS_COLORS,
  TIPO_PROCESSO_LABELS,
  formatDateTime,
  getDocumentosGerados,
  getFacAssinada,
  getFacStatus,
  getOutrosDocumentos,
} from "@/app/_features/fluxo/storage";
import type { DocumentoGeradoProcesso, DocumentoProcesso, ProcessoSicpr } from "@/app/_features/fluxo/types";
import { DETAIL_TABS, type DetailTab } from "./config";

const COLORS = SICPR_COLORS;

type PreviewTarget =
  | { tipo: "gerado"; processo: ProcessoSicpr; documento: DocumentoGeradoProcesso }
  | { tipo: "anexo"; processo: ProcessoSicpr; documento: DocumentoProcesso };

type Props = {
  processo: ProcessoSicpr;
  message: string;
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
  onClose: () => void;
  onEdit: (processo: ProcessoSicpr) => void;
  onEncaminhar: (id: string) => Promise<boolean>;
  onPreview: (preview: PreviewTarget) => void;
};

export default function UnlocProcessDetailsModal({
  processo,
  message,
  activeTab,
  onTabChange,
  onClose,
  onEdit,
  onEncaminhar,
  onPreview,
}: Props) {
  function editAndClose() {
    onEdit(processo);
    onClose();
  }

  async function encaminharAndClose() {
    if (await onEncaminhar(processo.id)) onClose();
  }

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

        {message && (
          <div className="border-b px-5 py-3" style={{ borderBottomColor: COLORS.border }}>
            <div className="rounded-md border px-3 py-2 text-sm font-semibold" style={{ borderColor: "#F59E0B", backgroundColor: "#FFFBEB", color: "#92400E" }}>
              {message}
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-auto p-5">
          {processo.ultimaJustificativa && (
            <p className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">{processo.ultimaJustificativa}</p>
          )}

          {activeTab === "dados" && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <DetailInfoCard label="Status" value={SITUACAO_LABELS[processo.situacao]} badgeClass={STATUS_COLORS[processo.situacao]} />
              <DetailInfoCard label="Tecnico responsavel" value={processo.tecnicoResponsavel} />
              <DetailInfoCard label="Gerente responsavel" value={processo.gerenteResponsavel || "-"} />
              <DetailInfoCard label="Data de criacao" value={formatDateTime(processo.criadoEm)} />
              <DetailInfoCard label="Encaminhado ao gerente" value={formatDateTime(processo.encaminhadoGerenteEm)} />
              <DetailInfoCard label="Memorando atual" value={processo.memorandoNumero || "-"} />
              <DetailInfoCard label="Status da FAC" value={FAC_STATUS_LABELS[getFacStatus(processo)]} />
              <DetailInfoCard label="FAC gerada em" value={formatDateTime(processo.facGeradaEm)} />
              <DetailInfoCard label="FAC assinada anexada em" value={formatDateTime(processo.facAssinadaAnexadaEm)} />
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
                <p className="mb-2 inline-flex items-center gap-2 font-semibold" style={{ color: COLORS.text }}>
                  <Paperclip size={15} /> Documentos obrigatorios assinados
                </p>
                {getFacAssinada(processo) ? (
                  <button
                    type="button"
                    onClick={() => onPreview({ tipo: "anexo", processo, documento: getFacAssinada(processo)! })}
                    className="mb-3 flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left transition-colors hover:bg-[#F5F7F5]"
                    style={{ color: COLORS.textLight }}
                  >
                    <Eye size={13} style={{ color: COLORS.primary }} />
                    <span className="min-w-0 truncate">FAC assinada pelo produtor</span>
                  </button>
                ) : (
                  <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">A FAC assinada pelo produtor ainda nao foi anexada.</p>
                )}

                <p className="mb-2 inline-flex items-center gap-2 font-semibold" style={{ color: COLORS.text }}>
                  <Paperclip size={15} /> Documentos complementares
                </p>
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

        {["em_elaboracao", "devolvido_gerente", "devolvido_analise"].includes(processo.situacao) && (
          <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t px-5 py-4" style={{ borderTopColor: COLORS.border }}>
            {processo.situacao === "em_elaboracao" && (
              <>
                <button type="button" onClick={editAndClose} className="sicpr-action-button inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white" style={{ backgroundColor: COLORS.primary }}>
                  <RotateCcw size={15} />
                  Editar processo
                </button>
                <button type="button" onClick={encaminharAndClose} className="sicpr-action-button inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white" style={{ backgroundColor: COLORS.accent }}>
                  <Send size={15} />
                  Encaminhar ao gerente
                </button>
              </>
            )}
            {["devolvido_gerente", "devolvido_analise"].includes(processo.situacao) && (
              <>
                <button type="button" onClick={editAndClose} className="sicpr-action-button inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white" style={{ backgroundColor: COLORS.primary }}>
                  <RotateCcw size={15} />
                  Editar correcao
                </button>
                <button type="button" onClick={encaminharAndClose} className="sicpr-action-button inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white" style={{ backgroundColor: COLORS.accent }}>
                  <Send size={15} />
                  Reenviar ao gerente
                </button>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
