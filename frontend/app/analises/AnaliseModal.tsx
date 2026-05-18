"use client";

import { AlertTriangle, ArrowDownToLine, CheckCircle2, ClipboardList, Eye, FileText, Inbox, Mail, Send, X } from "lucide-react";
import {
  COLORS,
  DISPATCH_TARGET_LABELS,
  GCC_STATUS_LABELS,
  HOVER_LIFT,
  HOVER_SOFT,
  MOTIVO_LABELS,
  PRODUCER_STATUS_LABELS,
  STATUS_LABELS,
  TIPO_IDENTIFICADO_LABELS,
} from "./data";
import {
  formatDate,
  formatDateTime,
  formatTime,
  getChecklistTone,
  getDeclarationInfo,
  getMaxDeclarationDate,
  getMemorandoChecklist,
  getMemorandoSummary,
  getProcessoGccStatus,
  getProcessoStatus,
  getProcessoTipo,
  getStatusTone,
  isGccDataChecked,
} from "./rules";
import type {
  ChecklistStatus,
  DispatchTarget,
  GccStatus,
  MemorandoAnalise,
  MemoStatus,
  ModalScope,
  ModalTab,
  PendingFlowAction,
  ProcessoProdutor,
  TipoIdentificado,
  ViewerKind,
} from "./types";

type AnaliseModalProps = {
  selectedMemorando: MemorandoAnalise;
  selectedProcesso: ProcessoProdutor | null;
  modalScope: ModalScope;
  activeTab: ModalTab;
  viewerKind: ViewerKind;
  pendingFlowAction: PendingFlowAction | null;
  flowNotice: string;
  isAdmin: boolean;
  selectedMemorandoReadOnly: boolean;
  selectedProcessoLocked: boolean;
  onClose: () => void;
  onTabChange: (tab: ModalTab) => void;
  onSelectProcesso: (processoId: number) => void;
  onViewerKindChange: (kind: ViewerKind) => void;
  onUpdateMemorandoChecklist: (itemName: string, status: ChecklistStatus) => void;
  onUpdateChecklist: (itemName: string, status: ChecklistStatus) => void;
  onUpdateProcessoField: <K extends keyof ProcessoProdutor>(field: K, value: ProcessoProdutor[K]) => void;
  onUpdateDeclarationDate: (value: string) => void;
  onUpdateObservation: (value: string) => void;
  onRequestStatus: (status: MemoStatus) => void;
  onApplyMemorandoStatus: (status: MemoStatus, notice?: string) => void;
  onCompleteProcessos: (target: DispatchTarget) => void;
  onCompleteSelectedProcesso: (target: DispatchTarget) => void;
  onCancelPendingFlow: () => void;
};

export default function AnaliseModal({
  selectedMemorando,
  selectedProcesso,
  modalScope,
  activeTab,
  viewerKind,
  pendingFlowAction,
  flowNotice,
  isAdmin,
  selectedMemorandoReadOnly,
  selectedProcessoLocked,
  onClose,
  onTabChange,
  onSelectProcesso,
  onViewerKindChange,
  onUpdateMemorandoChecklist,
  onUpdateChecklist,
  onUpdateProcessoField,
  onUpdateDeclarationDate,
  onUpdateObservation,
  onRequestStatus,
  onApplyMemorandoStatus,
  onCompleteProcessos,
  onCompleteSelectedProcesso,
  onCancelPendingFlow,
}: AnaliseModalProps) {
  const selectedMemorandoSummary = getMemorandoSummary(selectedMemorando);
  const scopedProcessos = modalScope === "produtor" && selectedProcesso ? [selectedProcesso] : selectedMemorando.processos;
  const scopedSummary = getMemorandoSummary({ ...selectedMemorando, processos: scopedProcessos });
  const selectedDispatchColor = selectedProcesso?.encaminhadoPara === "devolucao" ? COLORS.danger : COLORS.accent;
  const flowLocked = modalScope === "produtor" ? selectedProcessoLocked : selectedMemorandoReadOnly;
  const flowMetrics: Array<{ label: string; value: number; color: string }> = [
    { label: "Aptos", value: scopedSummary.aptos, color: "#027A48" },
    { label: "A conferir", value: scopedSummary.pendentes, color: COLORS.warning },
    { label: "Devoluções", value: scopedSummary.devolucoes, color: COLORS.danger },
    { label: "Concluídos", value: scopedSummary.concluidos, color: COLORS.primary },
  ];

  return (        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-6">
          <div className="absolute inset-0 bg-black/45" onClick={onClose} />
          <section className="relative flex max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg border shadow-2xl" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
            <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              <div>
                <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Painel de análise do memorando</p>
                <h2 className="mt-1 text-lg font-semibold" style={{ color: COLORS.primary }}>{selectedMemorando.numero}</h2>
                <p className="mt-1 text-sm" style={{ color: COLORS.textLight }}>{selectedMemorando.titulo}</p>
              </div>

              <button
                type="button"
                onClick={onClose}
                title="Fechar"
                className={`inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100 ${HOVER_SOFT}`}
                style={{ color: COLORS.textLight }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 px-5 py-3" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              {[
                { id: "resumo", label: "Resumo", icon: Mail },
                { id: "memorando", label: "Memorando", icon: FileText },
                { id: "processos", label: "Processos", icon: Inbox },
                { id: "observacoes", label: "Observações", icon: ClipboardList },
                { id: "fluxo", label: "Fluxo", icon: Send },
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

            <div className="overflow-y-auto p-5">
              {activeTab === "resumo" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      ["Memorando", selectedMemorando.numero],
                      ["Tipo importado", `${MOTIVO_LABELS[selectedMemorando.motivo]} (não definitivo)`],
                      ["Localidade", selectedMemorando.localidade],
                      ["Data", formatDate(selectedMemorando.recebidoEm)],
                      ["Hora", formatTime(selectedMemorando.recebidoEm)],
                      ["Produtores no memorando", selectedMemorando.produtoresInformados],
                      ["Processos identificados", selectedMemorando.processos.length],
                      ["Lista atual", STATUS_LABELS[selectedMemorando.status]],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-md border px-3 py-2" style={{ borderColor: COLORS.border }}>
                        <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>{label}</p>
                        <p className="mt-1 text-sm" style={{ color: COLORS.text }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-md border p-4" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
                    <div className="flex gap-3">
                      <Mail size={18} style={{ color: COLORS.primary }} />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{selectedMemorando.emailOrigem}</p>
                        <p className="mt-1 text-sm" style={{ color: COLORS.textLight }}>
                          O memorando organiza o lote e acompanha cada encaminhamento. A decisão de inscrição, renovação/alteração, lançamento ou devolução acontece processo por processo após consulta no sistema de busca.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "memorando" && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
                  <div className="rounded-md border p-4" style={{ borderColor: COLORS.border }}>
                    <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Arquivo do memorando</p>
                    <p className="mt-2 text-sm font-semibold" style={{ color: COLORS.text }}>{selectedMemorando.memorandoPdf}</p>
                    <p className="mt-2 text-sm leading-6" style={{ color: COLORS.textLight }}>
                      Confira se o memorando pode acompanhar os processos encaminhados para lançamentos ou devolução.
                    </p>
                    {selectedMemorandoReadOnly && (
                      <div className="mt-3 rounded-md border px-3 py-2 text-xs font-medium" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background, color: COLORS.textLight }}>
                        {isAdmin
                          ? "Este memorando já foi concluído na análise e está bloqueado para alterações."
                          : "Este memorando já foi concluído na análise. Apenas o administrador pode alterar concluídos."}
                      </div>
                    )}
                    <div className="mt-4 space-y-2">
                      {getMemorandoChecklist(selectedMemorando).map((item) => {
                        const tone = getChecklistTone(item.status);
                        return (
                          <div key={item.nome} className="rounded-md border p-2" style={{ borderColor: tone.border, backgroundColor: tone.background }}>
                            <p className="text-sm font-medium" style={{ color: COLORS.text }}>{item.nome}</p>
                            <select
                              value={item.status}
                              onChange={(event) => onUpdateMemorandoChecklist(item.nome, event.target.value as ChecklistStatus)}
                              disabled={selectedMemorandoReadOnly}
                              className="mt-2 w-full rounded-md px-2 py-1 text-xs outline-none disabled:cursor-not-allowed disabled:opacity-60"
                              style={{ border: `1px solid ${COLORS.border}`, color: tone.color, backgroundColor: COLORS.card }}
                            >
                              <option value="recebido">Ok</option>
                              <option value="faltando">Faltando</option>
                              <option value="nao_obrigatorio">Não obrigatório</option>
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex min-h-[430px] flex-col items-center justify-center rounded-md border border-dashed text-center" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
                    <FileText size={52} style={{ color: COLORS.primary }} />
                    <p className="mt-3 text-sm font-semibold" style={{ color: COLORS.text }}>Prévia do PDF do memorando</p>
                    <p className="mt-2 max-w-lg text-sm leading-6" style={{ color: COLORS.textLight }}>
                      Aqui ficará a visualização do memorando anexado ao e-mail, sem misturar com os PDFs individuais dos produtores.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "processos" && selectedProcesso && (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[330px_1fr]">
                  <div className="rounded-md border" style={{ borderColor: COLORS.border }}>
                    <div className="px-4 py-3" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <p className="text-sm font-semibold" style={{ color: COLORS.text }}>
                        {modalScope === "produtor" ? "Produtor selecionado" : "Produtores do memorando"}
                      </p>
                      <p className="text-xs" style={{ color: COLORS.textLight }}>{scopedProcessos.length} processo(s) exibido(s)</p>
                    </div>

                    <div className={modalScope === "produtor" ? "" : "max-h-[520px] overflow-y-auto"}>
                      {scopedProcessos.map((processo) => {
                        const isActive = selectedProcesso.id === processo.id;
                        const producerStatus = getProcessoStatus(processo);
                        const statusTone = getStatusTone(producerStatus);
                        return (
                          <button
                            key={processo.id}
                            type="button"
                            onClick={() => onSelectProcesso(processo.id)}
                            className={`block w-full border-b px-4 py-3 text-left hover:bg-gray-50 ${HOVER_SOFT}`}
                            style={{
                              borderBottomColor: COLORS.border,
                              backgroundColor: isActive ? `${COLORS.light}70` : COLORS.card,
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold" style={{ color: COLORS.text }}>{processo.produtor}</p>
                                <p className="text-xs" style={{ color: COLORS.textLight }}>{processo.cpf}</p>
                              </div>
                            </div>
                            <span className="mt-2 inline-flex rounded-full border px-2 py-1 text-xs font-medium" style={statusTone}>
                              {PRODUCER_STATUS_LABELS[producerStatus]}
                            </span>
                            <p className="mt-2 text-xs" style={{ color: COLORS.textLight }}>
                              {TIPO_IDENTIFICADO_LABELS[getProcessoTipo(processo)]} · {GCC_STATUS_LABELS[getProcessoGccStatus(processo)]}
                            </p>
                            {processo.encaminhadoPara && (
                              <p className="mt-2 text-xs" style={{ color: COLORS.textLight }}>
                                {DISPATCH_TARGET_LABELS[processo.encaminhadoPara]}
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-md border p-4" style={{ borderColor: COLORS.border }}>
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Processo selecionado</p>
                          <h3 className="mt-1 text-lg font-semibold" style={{ color: COLORS.primary }}>{selectedProcesso.produtor}</h3>
                          <p className="text-sm" style={{ color: COLORS.textLight }}>{selectedProcesso.cpf}</p>
                          <p className="mt-1 text-sm" style={{ color: COLORS.textLight }}>
                            {TIPO_IDENTIFICADO_LABELS[getProcessoTipo(selectedProcesso)]} · {GCC_STATUS_LABELS[getProcessoGccStatus(selectedProcesso)]}
                          </p>
                          {selectedProcesso.encaminhadoPara && (
                            <p className="mt-1 text-sm font-medium" style={{ color: selectedDispatchColor }}>
                              {DISPATCH_TARGET_LABELS[selectedProcesso.encaminhadoPara]}
                              {selectedProcesso.encaminhadoEm ? ` em ${formatDateTime(selectedProcesso.encaminhadoEm)}` : ""}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => onViewerKindChange("processo")}
                            className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${HOVER_SOFT}`}
                            style={{
                              backgroundColor: viewerKind === "processo" ? COLORS.accent : COLORS.background,
                              border: `1px solid ${viewerKind === "processo" ? COLORS.accent : COLORS.border}`,
                              color: viewerKind === "processo" ? "#FFFFFF" : COLORS.text,
                            }}
                          >
                            <Eye size={16} />
                            Ver processo
                          </button>
                          <button
                            type="button"
                            onClick={() => onViewerKindChange("declaracao")}
                            className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${HOVER_SOFT}`}
                            style={{
                              backgroundColor: viewerKind === "declaracao" ? COLORS.accent : COLORS.background,
                              border: `1px solid ${viewerKind === "declaracao" ? COLORS.accent : COLORS.border}`,
                              color: viewerKind === "declaracao" ? "#FFFFFF" : COLORS.text,
                            }}
                          >
                            <Eye size={16} />
                            Ver declaração
                          </button>
                        </div>
                      </div>
                    </div>

                    {selectedProcessoLocked && (
                      <div className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background, color: COLORS.textLight }}>
                        {isAdmin
                          ? "Este produtor já foi concluído na análise. Os dados ficam disponíveis apenas para consulta."
                          : "Este produtor já foi concluído na análise. Apenas o administrador pode alterar concluídos."}
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
                      <div className="flex min-h-[380px] flex-col items-center justify-center rounded-md border border-dashed text-center" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
                        <FileText size={48} style={{ color: COLORS.primary }} />
                        <p className="mt-3 text-sm font-semibold" style={{ color: COLORS.text }}>
                          {viewerKind === "processo" ? selectedProcesso.processoPdf : selectedProcesso.declaracaoPdf}
                        </p>
                        <p className="mt-2 max-w-md text-sm leading-6" style={{ color: COLORS.textLight }}>
                          {viewerKind === "processo"
                            ? "Prévia do PDF do processo individual do produtor."
                            : "Prévia do PDF da declaração usada para calcular a validade de 6 meses."}
                        </p>
                      </div>

                      <aside className="space-y-4">
                        {viewerKind === "processo" ? (
                          <>
                          <div className="rounded-md border p-4" style={{ borderColor: COLORS.border }}>
                            <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Documentos do produtor</p>
                            <p className="mt-1 text-xs leading-5" style={{ color: COLORS.textLight }}>
                              Marque o que veio dentro do processo individual deste produtor.
                            </p>
                            <div className="mt-3 space-y-2">
                              {selectedProcesso.checklist.map((item) => {
                                const tone = getChecklistTone(item.status);
                                return (
                                  <div key={item.nome} className="rounded-md border p-2" style={{ borderColor: tone.border, backgroundColor: tone.background }}>
                                    <p className="text-sm font-medium" style={{ color: COLORS.text }}>{item.nome}</p>
                                    <select
                                      value={item.status}
                                      onChange={(event) => onUpdateChecklist(item.nome, event.target.value as ChecklistStatus)}
                                      disabled={selectedProcessoLocked}
                                      className="mt-2 w-full rounded-md px-2 py-1 text-xs outline-none disabled:cursor-not-allowed disabled:opacity-60"
                                      style={{ border: `1px solid ${COLORS.border}`, color: tone.color, backgroundColor: COLORS.card }}
                                    >
                                      <option value="recebido">Recebido</option>
                                      <option value="faltando">Faltando</option>
                                      <option value="nao_obrigatorio">Não obrigatório</option>
                                    </select>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div className="rounded-md border p-4" style={{ borderColor: COLORS.border }}>
                            <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Conferência no sistema de consulta</p>
                            <p className="mt-1 text-xs leading-5" style={{ color: COLORS.textLight }}>
                              Use o sistema de busca para identificar se o processo é inscrição ou renovação/alteração.
                            </p>

                            <label className="mt-3 block text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Tipo identificado</label>
                            <select
                              value={getProcessoTipo(selectedProcesso)}
                              onChange={(event) => onUpdateProcessoField("tipoIdentificado", event.target.value as TipoIdentificado)}
                              disabled={selectedProcessoLocked}
                              className="mt-1 w-full rounded-md px-2 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
                              style={{ border: `1px solid ${COLORS.border}`, color: COLORS.text, backgroundColor: COLORS.card }}
                            >
                              {Object.entries(TIPO_IDENTIFICADO_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                              ))}
                            </select>

                            <label className="mt-3 block text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Resultado no sistema de consulta</label>
                            <select
                              value={getProcessoGccStatus(selectedProcesso)}
                              onChange={(event) => onUpdateProcessoField("gccStatus", event.target.value as GccStatus)}
                              disabled={selectedProcessoLocked}
                              className="mt-1 w-full rounded-md px-2 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
                              style={{ border: `1px solid ${COLORS.border}`, color: COLORS.text, backgroundColor: COLORS.card }}
                            >
                              {Object.entries(GCC_STATUS_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                              ))}
                            </select>

                            {getProcessoTipo(selectedProcesso) === "inscricao" && getProcessoGccStatus(selectedProcesso) === "sem_cadastro" ? (
                              <div className="mt-3 rounded-md border px-3 py-2 text-sm" style={{ borderColor: "#ABEFC6", backgroundColor: "#ECFDF3", color: "#027A48" }}>
                                CPF sem cadastro no sistema de consulta. Para inscrição, essa conferência já está correta.
                              </div>
                            ) : (
                            <div className="mt-3 space-y-2">
                              {[
                                ["dadosGccConferidos", "Os dados do processo estão de acordo com o sistema"],
                              ].map(([field, label]) => (
                                <label key={field} className="flex items-start gap-2 rounded-md border px-2 py-2 text-sm" style={{ borderColor: COLORS.border, color: COLORS.text }}>
                                  <input
                                    type="checkbox"
                                    checked={isGccDataChecked(selectedProcesso)}
                                    onChange={(event) => onUpdateProcessoField(field as "dadosGccConferidos", event.target.checked)}
                                    disabled={selectedProcessoLocked}
                                    className="mt-1 disabled:cursor-not-allowed"
                                  />
                                  <span>{label}</span>
                                </label>
                              ))}
                            </div>
                            )}
                          </div>
                          </>
                        ) : (
                          <div className="rounded-md border p-4" style={{ borderColor: COLORS.border }}>
                            <label className="text-sm font-semibold" style={{ color: COLORS.text }}>Data da declaração</label>
                            <p className="mt-1 text-xs leading-5" style={{ color: COLORS.textLight }}>
                              Use a data da declaração para conferir a validade de 6 meses.
                            </p>
                            <input
                              type="date"
                              value={selectedProcesso.dataDeclaracao}
                              max={getMaxDeclarationDate(selectedProcesso)}
                              onChange={(event) => onUpdateDeclarationDate(event.target.value)}
                              disabled={selectedProcessoLocked}
                              className="mt-2 w-full rounded-md px-3 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
                              style={{ border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                            />
                            {(() => {
                              const declaration = getDeclarationInfo(selectedProcesso);
                              const tone =
                                declaration.tone === "success"
                                  ? { background: "#ECFDF3", color: "#027A48", border: "#ABEFC6" }
                                  : declaration.tone === "warning"
                                    ? { background: "#FFFAEB", color: COLORS.warning, border: "#FEDF89" }
                                    : { background: "#FEF3F2", color: COLORS.danger, border: "#FECDCA" };
                              return (
                                <div className="mt-3 rounded-md border px-3 py-2 text-sm" style={tone}>
                                  <p className="font-semibold">
                                    {declaration.validade === "-" ? declaration.label : `${declaration.label} até ${declaration.validade}`}
                                  </p>
                                  <p className="mt-1 leading-5">{declaration.detail}</p>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </aside>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "observacoes" && selectedProcesso && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
                  <div className="rounded-md border" style={{ borderColor: COLORS.border }}>
                    <div className="px-4 py-3" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <p className="text-sm font-semibold" style={{ color: COLORS.text }}>
                        {modalScope === "produtor" ? "Produtor selecionado" : "Produtores"}
                      </p>
                      <p className="text-xs" style={{ color: COLORS.textLight }}>Indicador mostra quem já possui observação</p>
                    </div>
                    <div className={modalScope === "produtor" ? "" : "max-h-[520px] overflow-y-auto"}>
                      {scopedProcessos.map((processo) => {
                        const hasObservation = processo.observacao.trim().length > 0;
                        return (
                          <button
                            key={processo.id}
                            type="button"
                            onClick={() => onSelectProcesso(processo.id)}
                            className={`block w-full border-b px-4 py-3 text-left hover:bg-gray-50 ${HOVER_SOFT}`}
                            style={{
                              borderBottomColor: COLORS.border,
                              backgroundColor: selectedProcesso.id === processo.id ? `${COLORS.light}70` : COLORS.card,
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{processo.produtor}</p>
                                <p className="text-xs" style={{ color: COLORS.textLight }}>{processo.cpf}</p>
                                {processo.observacaoAtualizadaEm && (
                                  <p className="mt-1 text-xs" style={{ color: COLORS.textLight }}>
                                    Última: {formatDateTime(processo.observacaoAtualizadaEm)}
                                  </p>
                                )}
                              </div>
                              {hasObservation && <ClipboardList size={16} style={{ color: COLORS.accent }} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-md border p-4" style={{ borderColor: COLORS.border }}>
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Observação de {selectedProcesso.produtor}</p>
                        <p className="text-xs" style={{ color: COLORS.textLight }}>{selectedProcesso.cpf}</p>
                      </div>
                      <span className="text-xs" style={{ color: COLORS.textLight }}>{selectedProcesso.observacao.length}/500</span>
                    </div>
                    <textarea
                      value={selectedProcesso.observacao}
                      onChange={(event) => onUpdateObservation(event.target.value)}
                      rows={9}
                      disabled={selectedProcessoLocked}
                      className="mt-4 w-full resize-none rounded-md px-3 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
                      style={{ border: `1px solid ${COLORS.border}`, color: COLORS.text, backgroundColor: COLORS.background }}
                      placeholder="Registre o que foi analisado neste produtor: divergências, documentos faltantes, declaração vencida, encaminhamento..."
                    />
                    {selectedProcesso.observacaoAtualizadaEm && (
                      <p className="mt-2 text-xs" style={{ color: COLORS.textLight }}>
                        Última observação em {formatDateTime(selectedProcesso.observacaoAtualizadaEm)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "fluxo" && (
                <div className="space-y-4">
                  <div className="rounded-md border p-4" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
                    <p className="text-sm font-semibold" style={{ color: COLORS.text }}>
                      {modalScope === "produtor" ? "Fluxo do produtor" : "Fluxo do memorando"}
                    </p>
                    <p className="mt-1 text-sm" style={{ color: COLORS.textLight }}>
                      {modalScope === "produtor"
                        ? "Esta ação altera somente o produtor selecionado e mantém o memorando vinculado ao encaminhamento."
                        : "O memorando entra como lote recebido por e-mail. A análise decide o destino de cada produtor após conferir o processo e consultar o sistema de busca."}
                    </p>
                    {flowLocked && (
                      <div className="mt-3 rounded-md border px-3 py-2 text-sm" style={{ borderColor: COLORS.border, backgroundColor: COLORS.card, color: COLORS.textLight }}>
                        {modalScope === "produtor"
                          ? "Este produtor já foi concluído. Apenas o administrador pode alterar concluídos."
                          : "Este lote já foi concluído. Apenas o administrador pode alterar concluídos."}
                      </div>
                    )}
                  </div>

                  {selectedMemorandoSummary && (
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                      {flowMetrics.map((metric) => (
                        <div key={metric.label} className={`rounded-md border px-3 py-2 ${HOVER_LIFT}`} style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
                          <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>{metric.label}</p>
                          <p className="mt-1 text-lg font-bold tabular-nums" style={{ color: metric.color }}>{metric.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <button
                      type="button"
                      disabled={flowLocked}
                      onClick={() => onRequestStatus("em_analise")}
                      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 ${HOVER_SOFT}`}
                      style={{ border: `1px solid ${COLORS.border}`, color: COLORS.primary }}
                    >
                      <Inbox size={16} />
                      Em análise
                    </button>
                    <button
                      type="button"
                      disabled={flowLocked}
                      onClick={() => onRequestStatus("lancamento")}
                      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${HOVER_LIFT}`}
                      style={{ backgroundColor: COLORS.info }}
                    >
                      <Send size={16} />
                      {modalScope === "produtor" ? "Enviar produtor para lançamento" : "Enviar aptos para lançamento"}
                    </button>
                    <button
                      type="button"
                      disabled={flowLocked}
                      onClick={() => onRequestStatus("devolucao")}
                      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${HOVER_LIFT}`}
                      style={{ backgroundColor: COLORS.danger }}
                    >
                      <ArrowDownToLine size={16} />
                      {modalScope === "produtor" ? "Enviar produtor para devolução" : "Separar devoluções"}
                    </button>
                  </div>

                  {pendingFlowAction && (
                    <div
                      className="rounded-md border px-4 py-3 text-sm"
                      style={{
                        borderColor: pendingFlowAction.tone === "danger" ? "#FECDCA" : pendingFlowAction.tone === "info" ? "#B2DDFF" : "#FEDF89",
                        backgroundColor: pendingFlowAction.tone === "danger" ? "#FEF3F2" : pendingFlowAction.tone === "info" ? "#EFF8FF" : "#FFFAEB",
                        color: pendingFlowAction.tone === "danger" ? COLORS.danger : pendingFlowAction.tone === "info" ? COLORS.info : COLORS.warning,
                      }}
                    >
                      <div className="flex gap-2">
                        <AlertTriangle size={18} />
                        <div>
                          <p className="font-semibold">{pendingFlowAction.title}</p>
                          <p className="mt-1 leading-6">{pendingFlowAction.message}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (pendingFlowAction.completionAction === "lancamento_aptos") {
                              onCompleteProcessos("lancamento");
                              return;
                            }

                            if (pendingFlowAction.completionAction === "devolucao_processos") {
                              onCompleteProcessos("devolucao");
                              return;
                            }

                            if (pendingFlowAction.completionAction === "lancamento_produtor") {
                              onCompleteSelectedProcesso("lancamento");
                              return;
                            }

                            if (pendingFlowAction.completionAction === "devolucao_produtor") {
                              onCompleteSelectedProcesso("devolucao");
                              return;
                            }

                            if (pendingFlowAction.applyStatus) {
                              onApplyMemorandoStatus(pendingFlowAction.applyStatus, pendingFlowAction.notice);
                              return;
                            }

                            onCancelPendingFlow();
                          }}
                          className="rounded-md px-3 py-2 text-xs font-semibold text-white"
                          style={{ backgroundColor: pendingFlowAction.tone === "danger" ? COLORS.danger : pendingFlowAction.tone === "info" ? COLORS.info : COLORS.warning }}
                        >
                          {pendingFlowAction.confirmLabel}
                        </button>
                        <button
                          type="button"
                          onClick={() => onCancelPendingFlow()}
                          className="rounded-md px-3 py-2 text-xs font-semibold"
                          style={{ border: `1px solid ${COLORS.border}`, color: COLORS.text, backgroundColor: COLORS.card }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {flowNotice && (
                    <div className="flex gap-2 rounded-md border px-3 py-3 text-sm" style={{ borderColor: "#ABEFC6", backgroundColor: "#ECFDF3", color: COLORS.primary }}>
                      <CheckCircle2 size={18} />
                      <span>{flowNotice}</span>
                    </div>
                  )}

                  {scopedProcessos.some((processo) => getProcessoStatus(processo) === "devolucao") && (
                    <div className="rounded-md border px-3 py-3 text-sm" style={{ borderColor: "#FEDF89", backgroundColor: "#FFFAEB", color: COLORS.warning }}>
                      Há processo classificado para devolução. Só esse produtor deve ser encaminhado para devolução; os demais seguem conforme a análise individual.
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
  );
}
