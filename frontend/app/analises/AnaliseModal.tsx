"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Inbox,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import {
  COLORS,
  HOVER_LIFT,
  HOVER_SOFT,
  MEMORANDO_DEVOLUCAO_MOTIVOS,
  MOTIVO_LABELS,
  PROCESSO_DEVOLUCAO_MOTIVOS,
  PRODUCER_STATUS_LABELS,
  STATUS_LABELS,
} from "./data";
import {
  formatDate,
  formatDateTime,
  formatTime,
  getDeclarationInfo,
  getDerivedMemoStatus,
  getMemorandoSummary,
  getProcessoStatus,
  getStatusTone,
} from "./rules";
import type {
  DispatchTarget,
  MemorandoAnalise,
  ModalScope,
  ModalTab,
  MotivoMemorandoDevolucao,
  MotivoProcessoDevolucao,
  ProcessoProdutor,
  ViewerKind,
} from "./types";

type AnaliseModalProps = {
  selectedMemorando: MemorandoAnalise;
  selectedProcesso: ProcessoProdutor | null;
  modalScope: ModalScope;
  activeTab: ModalTab;
  viewerKind: ViewerKind;
  flowNotice: string;
  isAdmin: boolean;
  selectedMemorandoReadOnly: boolean;
  selectedProcessoLocked: boolean;
  onClose: () => void;
  onTabChange: (tab: ModalTab) => void;
  onSelectProcesso: (processoId: number) => void;
  onViewerKindChange: (kind: ViewerKind) => void;
  onSetMemorandoDecision: (decision: "correto" | "incorreto") => void;
  onReturnMemorando: (motivo: MotivoMemorandoDevolucao, observacao: string) => void;
  onUpdateDeclarationDate: (value: string) => void;
  onUpdateObservation: (value: string) => void;
  onDecideProcesso: (target: DispatchTarget, motivo?: MotivoProcessoDevolucao, observacao?: string) => void;
};

export default function AnaliseModal({
  selectedMemorando,
  selectedProcesso,
  modalScope,
  activeTab,
  viewerKind,
  flowNotice,
  isAdmin,
  selectedMemorandoReadOnly,
  selectedProcessoLocked,
  onClose,
  onTabChange,
  onSelectProcesso,
  onViewerKindChange,
  onSetMemorandoDecision,
  onReturnMemorando,
  onUpdateDeclarationDate,
  onUpdateObservation,
  onDecideProcesso,
}: AnaliseModalProps) {
  const summary = getMemorandoSummary(selectedMemorando);
  const scopedProcessos = modalScope === "produtor" && selectedProcesso ? [selectedProcesso] : selectedMemorando.processos;
  const [memoMotivo, setMemoMotivo] = useState<MotivoMemorandoDevolucao>("Documento invalido");
  const [memoObs, setMemoObs] = useState(selectedMemorando.observacaoMemorando || "");
  const [processoMotivo, setProcessoMotivo] = useState<MotivoProcessoDevolucao>("Documento ausente");
  const [pendingDecision, setPendingDecision] = useState<DispatchTarget | null>(null);
  const processoObs = selectedProcesso?.observacao || "";
  const memoStatus = getDerivedMemoStatus(selectedMemorando);
  const memoStatusTone = getStatusTone(memoStatus);
  const memoBlocked = selectedMemorando.memorandoDecisao === "incorreto" && !isAdmin;

  const handleSelectProcesso = (processoId: number) => {
    const processo = scopedProcessos.find((item) => item.id === processoId);
    const declaration = processo ? getDeclarationInfo(processo) : null;
    setProcessoMotivo(declaration?.autoMotivo || processo?.motivoDevolucao || "Documento ausente");
    setPendingDecision(null);
    onSelectProcesso(processoId);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <section className="relative flex max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-lg border shadow-2xl" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Painel de analise do memorando</p>
            <h2 className="mt-1 text-lg font-semibold" style={{ color: COLORS.primary }}>{selectedMemorando.numero}</h2>
            <p className="mt-1 text-sm" style={{ color: COLORS.textLight }}>{selectedMemorando.titulo}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border px-2 py-1 text-xs font-semibold" style={memoStatusTone}>{STATUS_LABELS[memoStatus]}</span>
            <button type="button" onClick={onClose} title="Fechar" className={`inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100 ${HOVER_SOFT}`} style={{ color: COLORS.textLight }}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 px-5 py-3" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
          {[
            { id: "resumo", label: "Resumo", icon: CheckCircle2 },
            { id: "memorando", label: "Memorando", icon: FileText },
            { id: "processos", label: "Processos", icon: Inbox },
            { id: "decisao", label: "Decisao", icon: Send },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id as ModalTab)}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${HOVER_LIFT}`}
                style={{
                  backgroundColor: isActive ? COLORS.accent : COLORS.background,
                  border: `1px solid ${isActive ? COLORS.accent : COLORS.border}`,
                  color: isActive ? "#FFFFFF" : COLORS.text,
                }}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden xl:grid-cols-[1fr_320px]">
          <div className="overflow-y-auto p-5">
            {activeTab === "resumo" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <InfoBox label="Memorando" value={selectedMemorando.numero} />
                  <InfoBox label="Tipo importado" value={`${MOTIVO_LABELS[selectedMemorando.motivo]} (nao definitivo)`} />
                  <InfoBox label="Localidade" value={selectedMemorando.localidade} />
                  <InfoBox label="Recebido" value={`${formatDate(selectedMemorando.recebidoEm)} - ${formatTime(selectedMemorando.recebidoEm)}`} />
                  <InfoBox label="Produtores" value={String(selectedMemorando.produtoresInformados)} />
                  <InfoBox label="Identificados" value={String(selectedMemorando.processos.length)} />
                  <InfoBox label="Lancamentos" value={String(summary.lancamentos)} />
                  <InfoBox label="Devolucoes" value={String(summary.devolucoes)} />
                </div>
              </div>
            )}

            {activeTab === "memorando" && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
                <div className="space-y-4">
                  <div className="rounded-md border p-4" style={{ borderColor: COLORS.border }}>
                    <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Arquivo do memorando</p>
                    <p className="mt-2 text-sm font-semibold" style={{ color: COLORS.text }}>{selectedMemorando.memorandoPdf}</p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={selectedMemorandoReadOnly}
                        onClick={() => onSetMemorandoDecision("correto")}
                        className={`rounded-md px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${HOVER_SOFT}`}
                        style={{
                          backgroundColor: selectedMemorando.memorandoDecisao === "correto" ? "#ECFDF3" : COLORS.background,
                          border: `1px solid ${selectedMemorando.memorandoDecisao === "correto" ? "#ABEFC6" : COLORS.border}`,
                          color: selectedMemorando.memorandoDecisao === "correto" ? "#027A48" : COLORS.text,
                        }}
                      >
                        Correto
                      </button>
                      <button
                        type="button"
                        disabled={selectedMemorandoReadOnly}
                        onClick={() => onSetMemorandoDecision("incorreto")}
                        className={`rounded-md px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${HOVER_SOFT}`}
                        style={{
                          backgroundColor: selectedMemorando.memorandoDecisao === "incorreto" ? "#FEF3F2" : COLORS.background,
                          border: `1px solid ${selectedMemorando.memorandoDecisao === "incorreto" ? "#FECDCA" : COLORS.border}`,
                          color: selectedMemorando.memorandoDecisao === "incorreto" ? COLORS.danger : COLORS.text,
                        }}
                      >
                        Incorreto
                      </button>
                    </div>
                  </div>

                  {selectedMemorando.memorandoDecisao === "incorreto" && (
                    <div className="rounded-md border p-4" style={{ borderColor: "#FECDCA", backgroundColor: "#FEF3F2" }}>
                      <label className="text-xs font-semibold uppercase" style={{ color: COLORS.danger }}>Motivo padrao</label>
                      <select
                        value={memoMotivo}
                        onChange={(event) => setMemoMotivo(event.target.value as MotivoMemorandoDevolucao)}
                        className="mt-2 w-full rounded-md px-2 py-2 text-sm outline-none"
                        style={{ border: `1px solid ${COLORS.border}`, color: COLORS.text, backgroundColor: COLORS.card }}
                      >
                        {MEMORANDO_DEVOLUCAO_MOTIVOS.map((motivo) => <option key={motivo} value={motivo}>{motivo}</option>)}
                      </select>
                      <textarea
                        value={memoObs}
                        onChange={(event) => setMemoObs(event.target.value.slice(0, 500))}
                        rows={4}
                        className="mt-3 w-full resize-none rounded-md px-3 py-2 text-sm outline-none"
                        style={{ border: `1px solid ${COLORS.border}`, color: COLORS.text, backgroundColor: COLORS.card }}
                        placeholder="Observacao contextual do memorando"
                      />
                      {!memoObs.trim() && (
                        <p className="mt-2 text-xs font-medium" style={{ color: COLORS.danger }}>
                          A observacao escrita e obrigatoria para devolver o memorando.
                        </p>
                      )}
                      <button
                        type="button"
                        disabled={!memoObs.trim()}
                        onClick={() => onReturnMemorando(memoMotivo, memoObs)}
                        className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${HOVER_LIFT}`}
                        style={{ backgroundColor: COLORS.danger }}
                      >
                        <RotateCcw size={16} />
                        Enviar para devolucao
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex min-h-[430px] flex-col items-center justify-center rounded-md border border-dashed text-center" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
                  <FileText size={52} style={{ color: COLORS.primary }} />
                  <p className="mt-3 text-sm font-semibold" style={{ color: COLORS.text }}>Previa do PDF do memorando</p>
                  <p className="mt-2 max-w-lg text-sm leading-6" style={{ color: COLORS.textLight }}>{selectedMemorando.memorandoPdf}</p>
                </div>
              </div>
            )}

            {activeTab === "processos" && selectedProcesso && (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[330px_1fr]">
                <div className="rounded-md border" style={{ borderColor: COLORS.border }}>
                  <div className="px-4 py-3" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{modalScope === "produtor" ? "Produtor selecionado" : "Produtores do memorando"}</p>
                    <p className="text-xs" style={{ color: COLORS.textLight }}>{scopedProcessos.length} processo(s)</p>
                  </div>
                  <div className={modalScope === "produtor" ? "" : "max-h-[560px] overflow-y-auto"}>
                    {scopedProcessos.map((processo) => {
                      const isActive = selectedProcesso.id === processo.id;
                      const status = getProcessoStatus(processo);
                      const tone = getStatusTone(status);
                      return (
                        <button
                          key={processo.id}
                          type="button"
                          onClick={() => handleSelectProcesso(processo.id)}
                          className={`block w-full border-b px-4 py-3 text-left hover:bg-gray-50 ${HOVER_SOFT}`}
                          style={{ borderBottomColor: COLORS.border, backgroundColor: isActive ? `${COLORS.light}70` : COLORS.card }}
                        >
                          <p className="truncate text-sm font-semibold" style={{ color: COLORS.text }}>{processo.produtor}</p>
                          <p className="text-xs" style={{ color: COLORS.textLight }}>{processo.cpf}</p>
                          <span className="mt-2 inline-flex rounded-full border px-2 py-1 text-xs font-medium" style={tone}>{PRODUCER_STATUS_LABELS[status]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <ProcessoPanel
                  selectedProcesso={selectedProcesso}
                  selectedProcessoLocked={selectedProcessoLocked}
                  viewerKind={viewerKind}
                  onViewerKindChange={onViewerKindChange}
                  onUpdateDeclarationDate={onUpdateDeclarationDate}
                />
              </div>
            )}

            {activeTab === "decisao" && selectedProcesso && (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[330px_1fr]">
                <div className="rounded-md border" style={{ borderColor: COLORS.border }}>
                  <div className="px-4 py-3" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{modalScope === "produtor" ? "Produtor selecionado" : "Escolha o produtor"}</p>
                    <p className="text-xs" style={{ color: COLORS.textLight }}>{scopedProcessos.length} processo(s)</p>
                  </div>
                  <div className={modalScope === "produtor" ? "" : "max-h-[560px] overflow-y-auto"}>
                    {scopedProcessos.map((processo) => {
                      const isActive = selectedProcesso.id === processo.id;
                      const status = getProcessoStatus(processo);
                      const tone = getStatusTone(status);
                      return (
                        <button
                          key={processo.id}
                          type="button"
                          onClick={() => handleSelectProcesso(processo.id)}
                          className={`block w-full border-b px-4 py-3 text-left hover:bg-gray-50 ${HOVER_SOFT}`}
                          style={{ borderBottomColor: COLORS.border, backgroundColor: isActive ? `${COLORS.light}70` : COLORS.card }}
                        >
                          <p className="truncate text-sm font-semibold" style={{ color: COLORS.text }}>{processo.produtor}</p>
                          <p className="text-xs" style={{ color: COLORS.textLight }}>{processo.cpf}</p>
                          <span className="mt-2 inline-flex rounded-full border px-2 py-1 text-xs font-medium" style={tone}>{PRODUCER_STATUS_LABELS[status]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <DecisionPanel
                  selectedProcesso={selectedProcesso}
                  selectedProcessoLocked={selectedProcessoLocked}
                  memoBlocked={memoBlocked}
                  pendingDecision={pendingDecision}
                  processoMotivo={processoMotivo}
                  processoObs={processoObs}
                  onUpdateObservation={onUpdateObservation}
                  onSetMotivo={setProcessoMotivo}
                  onSetPendingDecision={setPendingDecision}
                  onConfirm={(target) => {
                    if (target === "lancamento") onDecideProcesso("lancamento");
                    if (target === "devolucao") onDecideProcesso("devolucao", processoMotivo, processoObs);
                    setPendingDecision(null);
                  }}
                />
              </div>
            )}
          </div>

          <aside className="min-h-0 overflow-y-auto border-t p-4 xl:border-l xl:border-t-0" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
            <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Timeline</p>
            <p className="text-xs" style={{ color: COLORS.textLight }}>Eventos automaticos do memorando.</p>
            <div className="mt-4 space-y-3">
              {(selectedMemorando.timeline || []).slice().reverse().map((item) => (
                <div key={item.id} className="rounded-md border bg-white p-3" style={{ borderColor: COLORS.border }}>
                  <div className="flex items-start gap-2">
                    <Clock3 size={15} style={{ color: COLORS.accent }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{item.acao}</p>
                      {item.detalhe && <p className="mt-1 text-xs leading-5" style={{ color: COLORS.textLight }}>{item.detalhe}</p>}
                      <p className="mt-2 text-xs" style={{ color: COLORS.textLight }}>{item.usuario} - {formatDateTime(item.dataHora)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {flowNotice && (
              <div className="mt-4 flex gap-2 rounded-md border px-3 py-3 text-sm" style={{ borderColor: "#ABEFC6", backgroundColor: "#ECFDF3", color: COLORS.primary }}>
                <CheckCircle2 size={18} />
                <span>{flowNotice}</span>
              </div>
            )}
            {isAdmin && selectedMemorandoReadOnly && (
              <p className="mt-4 text-xs" style={{ color: COLORS.textLight }}>Administrador visualizando item finalizado.</p>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}

function ProcessoPanel({
  selectedProcesso,
  selectedProcessoLocked,
  viewerKind,
  onViewerKindChange,
  onUpdateDeclarationDate,
}: {
  selectedProcesso: ProcessoProdutor;
  selectedProcessoLocked: boolean;
  viewerKind: ViewerKind;
  onViewerKindChange: (kind: ViewerKind) => void;
  onUpdateDeclarationDate: (value: string) => void;
}) {
  const declaration = getDeclarationInfo(selectedProcesso);

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-4" style={{ borderColor: COLORS.border }}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Processo selecionado</p>
            <h3 className="mt-1 text-lg font-semibold" style={{ color: COLORS.primary }}>{selectedProcesso.produtor}</h3>
            <p className="text-sm" style={{ color: COLORS.textLight }}>{selectedProcesso.cpf}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <IconButton active={viewerKind === "processo"} onClick={() => onViewerKindChange("processo")} label="Ver processo" />
            <IconButton active={viewerKind === "declaracao"} onClick={() => onViewerKindChange("declaracao")} label="Ver declaracao" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
        <PdfPreview title={viewerKind === "processo" ? "Processo" : "Declaracao"} file={viewerKind === "processo" ? selectedProcesso.processoPdf : selectedProcesso.declaracaoPdf} />

        <aside className="space-y-4">
          {viewerKind === "declaracao" && (
            <div className="rounded-md border p-4" style={{ borderColor: COLORS.border }}>
              <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Declaracao</p>
              <input
                type="date"
                value={selectedProcesso.dataDeclaracao}
                onChange={(event) => onUpdateDeclarationDate(event.target.value)}
                disabled={selectedProcessoLocked}
                className="mt-2 w-full rounded-md px-3 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
                style={{ border: `1px solid ${COLORS.border}`, color: COLORS.text }}
              />
              <div
                className="mt-3 rounded-md border px-3 py-2 text-sm"
                style={{
                  borderColor: declaration.tone === "success" ? "#ABEFC6" : declaration.tone === "warning" ? "#FEDF89" : "#FECDCA",
                  backgroundColor: declaration.tone === "success" ? "#ECFDF3" : declaration.tone === "warning" ? "#FFFAEB" : "#FEF3F2",
                  color: declaration.tone === "success" ? "#027A48" : declaration.tone === "warning" ? COLORS.warning : COLORS.danger,
                }}
              >
                <p className="font-semibold">{declaration.validade === "-" ? declaration.label : `${declaration.label} ate ${declaration.validade}`}</p>
                <p className="mt-1 leading-5">{declaration.detail}</p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function DecisionPanel({
  selectedProcesso,
  selectedProcessoLocked,
  memoBlocked,
  pendingDecision,
  processoMotivo,
  processoObs,
  onUpdateObservation,
  onSetMotivo,
  onSetPendingDecision,
  onConfirm,
}: {
  selectedProcesso: ProcessoProdutor;
  selectedProcessoLocked: boolean;
  memoBlocked: boolean;
  pendingDecision: DispatchTarget | null;
  processoMotivo: MotivoProcessoDevolucao;
  processoObs: string;
  onUpdateObservation: (value: string) => void;
  onSetMotivo: (motivo: MotivoProcessoDevolucao) => void;
  onSetPendingDecision: (target: DispatchTarget | null) => void;
  onConfirm: (target: DispatchTarget) => void;
}) {
  const declaration = getDeclarationInfo(selectedProcesso);
  const decisionBlocked = selectedProcessoLocked || memoBlocked;
  const lancamentoBlocked = decisionBlocked || declaration.blocking;

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-4" style={{ borderColor: COLORS.border }}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Decisao do produtor</p>
            <h3 className="mt-1 text-lg font-semibold" style={{ color: COLORS.primary }}>{selectedProcesso.produtor}</h3>
            <p className="text-sm" style={{ color: COLORS.textLight }}>{selectedProcesso.cpf}</p>
          </div>
        </div>
      </div>

      {(memoBlocked || selectedProcessoLocked) && (
        <div className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: "#FEDF89", backgroundColor: "#FFFAEB", color: COLORS.warning }}>
          {memoBlocked ? "Memorando incorreto: analise individual bloqueada." : "Processo ja decidido. Apenas administrador pode alterar."}
        </div>
      )}

      <div className="max-w-xl">
          <div className="rounded-md border p-4" style={{ borderColor: COLORS.border }}>
            <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Decisao</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={lancamentoBlocked}
                onClick={() => onSetPendingDecision("lancamento")}
                className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${HOVER_LIFT}`}
                style={{ backgroundColor: COLORS.info }}
              >
                <Send size={16} />
                Lancamento
              </button>
              <button
                type="button"
                disabled={decisionBlocked}
                onClick={() => {
                  onSetMotivo(declaration.autoMotivo || processoMotivo);
                  onSetPendingDecision("devolucao");
                }}
                className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${HOVER_LIFT}`}
                style={{ backgroundColor: COLORS.danger }}
              >
                <RotateCcw size={16} />
                Devolucao
              </button>
            </div>
            {pendingDecision === "devolucao" && (
              <div className="mt-3">
                <select
                  value={processoMotivo}
                  onChange={(event) => onSetMotivo(event.target.value as MotivoProcessoDevolucao)}
                  className="w-full rounded-md px-2 py-2 text-sm outline-none"
                  style={{ border: `1px solid ${COLORS.border}`, color: COLORS.text, backgroundColor: COLORS.card }}
                >
                  {PROCESSO_DEVOLUCAO_MOTIVOS.map((motivo) => <option key={motivo} value={motivo}>{motivo}</option>)}
                </select>
                <textarea
                  value={processoObs}
                  onChange={(event) => onUpdateObservation(event.target.value.slice(0, 500))}
                  rows={4}
                  className="mt-3 w-full resize-none rounded-md px-3 py-2 text-sm outline-none"
                  style={{ border: `1px solid ${COLORS.border}`, color: COLORS.text, backgroundColor: COLORS.background }}
                  placeholder="Observacao da devolucao"
                />
                {!processoObs.trim() && (
                  <p className="mt-2 text-xs font-medium" style={{ color: COLORS.danger }}>
                    Escreva o motivo detalhado da devolucao para confirmar.
                  </p>
                )}
              </div>
            )}

            {pendingDecision && (
              <button
                type="button"
                disabled={pendingDecision === "devolucao" && !processoObs.trim()}
                onClick={() => onConfirm(pendingDecision)}
                className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${HOVER_LIFT}`}
                style={{ backgroundColor: pendingDecision === "lancamento" ? COLORS.info : COLORS.danger }}
              >
                Confirmar {pendingDecision === "lancamento" ? "lancamento" : "devolucao"}
              </button>
            )}
          </div>
      </div>
    </div>
  );
}

function IconButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${HOVER_SOFT}`}
      style={{
        backgroundColor: active ? COLORS.accent : COLORS.background,
        border: `1px solid ${active ? COLORS.accent : COLORS.border}`,
        color: active ? "#FFFFFF" : COLORS.text,
      }}
    >
      <Eye size={16} />
      {label}
    </button>
  );
}

function PdfPreview({ title, file }: { title: string; file: string }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-md border border-dashed px-4 text-center" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
      <FileText size={42} style={{ color: COLORS.primary }} />
      <p className="mt-3 text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>{title}</p>
      <p className="mt-2 text-sm font-semibold" style={{ color: COLORS.text }}>{file}</p>
      <p className="mt-2 max-w-md text-sm leading-6" style={{ color: COLORS.textLight }}>Previa do PDF.</p>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border px-3 py-2" style={{ borderColor: COLORS.border }}>
      <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>{label}</p>
      <p className="mt-1 text-sm" style={{ color: COLORS.text }}>{value}</p>
    </div>
  );
}
