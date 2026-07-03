"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Clock, Eye, FileText, History, Info, MapPin, RotateCcw, Search, Send } from "lucide-react";
import { ProcessoTimeline } from "@/app/_features/fluxo/ProcessoTimeline";
import ConfirmActionDialog from "@/app/_components/ConfirmActionDialog";
import Sidebar from "@/app/_components/layout/Sidebar";
import StyledSelect from "@/app/_components/StyledSelect";
import {
  SITUACAO_LABELS,
  STATUS_COLORS,
  TIPO_PROCESSO_LABELS,
  formatDateTime,
  getDocumentosGerados,
  getOutrosDocumentos,
} from "@/app/_features/fluxo/storage";
import { fluxoApi } from "@/app/_features/fluxo/api";
import type { ProcessoSicpr } from "@/app/_features/fluxo/types";
import { useClientMounted } from "@/app/_hooks/useClientMounted";
import { useAuthSession } from "@/app/_hooks/useAuthSession";
import { COLORS, FILTERS, PAGE_SIZE_OPTIONS } from "./config";
import type { ExpandedTab, LancamentoFilter } from "./config";
import LancamentoPreviewModal from "./LancamentoPreviewModal";
import type { LancamentoPreviewTarget } from "./LancamentoPreviewModal";

export default function LancamentosPage() {
  const { username, role, logout, ready } = useAuthSession({
    defaultUsername: "Lancamento",
    allowedRoles: ["ADMIN", "USUARIO"],
  });
  const mounted = useClientMounted();
  const [processos, setProcessos] = useState<ProcessoSicpr[]>([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<LancamentoFilter>("aguardando");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedTab, setExpandedTab] = useState<ExpandedTab>("dados");
  const [justificativas, setJustificativas] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingAction, setPendingAction] = useState<null | { type: "concluir" | "devolver"; processo: ProcessoSicpr }>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [preview, setPreview] = useState<LancamentoPreviewTarget | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!ready || !mounted) return;
    const timer = window.setTimeout(() => {
      void fluxoApi.listarPendentesAnalise()
        .then(setProcessos)
        .catch((error) => {
          setMessageType("error");
          setMessage(error instanceof Error ? error.message : "Não foi possível carregar os processos de lançamento.");
        });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [ready, mounted]);

  const processosLancamento = useMemo(
    () => processos.filter((processo) => processo.situacao === "aprovado_lancamento" || processo.situacao === "concluido"),
    [processos],
  );

  const stats = useMemo(() => {
    const hoje = new Date().toLocaleDateString("pt-BR");
    const mesAtual = new Date().getMonth();
    const anoAtual = new Date().getFullYear();
    const concluidos = processosLancamento.filter((processo) => processo.situacao === "concluido");

    return {
      aguardando: processosLancamento.filter((processo) => processo.situacao === "aprovado_lancamento").length,
      concluidosHoje: concluidos.filter((processo) => processo.lancadoEm && new Date(processo.lancadoEm).toLocaleDateString("pt-BR") === hoje).length,
      concluidosMes: concluidos.filter((processo) => {
        if (!processo.lancadoEm) return false;
        const date = new Date(processo.lancadoEm);
        return date.getMonth() === mesAtual && date.getFullYear() === anoAtual;
      }).length,
    };
  }, [processosLancamento]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return processosLancamento
      .filter((processo) => {
        if (filter === "aguardando") return processo.situacao === "aprovado_lancamento";
        if (filter === "concluidos") return processo.situacao === "concluido";
        return true;
      })
      .filter((processo) =>
        !term ||
        processo.produtor.toLowerCase().includes(term) ||
        processo.cpf.includes(term) ||
        processo.unidadeLocal.toLowerCase().includes(term) ||
        (processo.memorandoNumero || "").toLowerCase().includes(term)
      );
  }, [filter, processosLancamento, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function applyFilter(next: LancamentoFilter) {
    setFilter(next);
    setPage(1);
  }

  async function concluir(id: string) {
    try {
      const updated = await fluxoApi.concluirLancamento(id);
      setProcessos((current) => fluxoApi.replaceProcesso(current, updated));
      setMessageType("success");
      setMessage("Lançamento concluído e histórico preservado.");
      setTimeout(() => setMessage(""), 5000);
      setExpandedId(null);
      return true;
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Não foi possível concluir o lançamento.");
      return false;
    }
  }

  async function devolverParaAnalise(id: string) {
    const justificativa = justificativas[id]?.trim();
    if (!justificativa) {
      setErrors((current) => ({ ...current, [id]: "A justificativa é obrigatória para devolver o processo à Análise." }));
      setExpandedTab("dados");
      return false;
    }

    try {
      const updated = await fluxoApi.devolverLancamento(id, justificativa);
      setProcessos((current) => fluxoApi.replaceProcesso(current, updated));
      setMessageType("success");
      setMessage("Processo devolvido para Análise com justificativa registrada.");
      setTimeout(() => setMessage(""), 5000);
      setExpandedId(null);
      return true;
    } catch (error) {
      setErrors((current) => ({
        ...current,
        [id]: error instanceof Error ? error.message : "Não foi possível devolver o processo.",
      }));
      return false;
    }
  }

  function requestConcluir(processo: ProcessoSicpr) {
    setErrors((current) => ({ ...current, [processo.id]: "" }));
    setPendingAction({ type: "concluir", processo });
  }

  function requestDevolver(processo: ProcessoSicpr) {
    if (!justificativas[processo.id]?.trim()) {
      setErrors((current) => ({ ...current, [processo.id]: "A justificativa é obrigatória para devolver o processo à Análise." }));
      setExpandedTab("dados");
      return;
    }
    setPendingAction({ type: "devolver", processo });
  }

  async function confirmPendingAction() {
    if (!pendingAction) return;
    setActionLoading(true);
    const success = pendingAction.type === "concluir"
      ? await concluir(pendingAction.processo.id)
      : await devolverParaAnalise(pendingAction.processo.id);
    setActionLoading(false);
    if (success) setPendingAction(null);
  }

  function toggleExpanded(id: string) {
    setExpandedId((current) => current === id ? null : id);
    setExpandedTab("dados");
  }

  if (!mounted || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.background }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderBottomColor: COLORS.primary }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
      <Sidebar
        onLogout={logout}
        username={username || "Lançamento"}
        role={role}
        onCollapsedChange={setSidebarCollapsed}
      />

      <main
        className="transition-all duration-300 min-h-screen"
        style={{ marginLeft: sidebarCollapsed ? '72px' : '260px' }}
      >
        <div className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: COLORS.primary }}>Lançamentos</h1>
                <p className="text-sm" style={{ color: COLORS.textLight }}>Fila operacional de processos aprovados pela Análise e aguardando lançamento.</p>
              </div>
              <div className="relative lg:w-96">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textLight }} />
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Buscar nome, CPF, município ou memorando..."
                  className="w-full rounded-md border py-2 pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-green-500"
                  style={{ borderColor: COLORS.border }}
                />
              </div>
            </div>

            {message && (
              <div
                className="flex items-start gap-3 rounded-md border px-4 py-3 text-sm font-medium"
                style={{
                  backgroundColor: messageType === "error" ? "#FEF3F2" : COLORS.card,
                  borderColor: messageType === "error" ? "#FCA5A5" : COLORS.border,
                  color: messageType === "error" ? COLORS.danger : COLORS.primary,
                }}
              >
                {messageType === "error" ? <AlertTriangle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
                <span>{message}</span>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard label="Aguardando lançamento" value={stats.aguardando} active={filter === "aguardando"} onClick={() => applyFilter("aguardando")} />
              <StatCard label="Concluídos hoje" value={stats.concluidosHoje} active={filter === "concluidos"} onClick={() => applyFilter("concluidos")} />
              <StatCard label="Concluídos no mês" value={stats.concluidosMes} active={filter === "concluidos"} onClick={() => applyFilter("concluidos")} />
            </div>

            <div className="flex flex-wrap gap-2">
              {FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => applyFilter(item.id)}
                  className="rounded-full px-3 py-1.5 text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: filter === item.id ? COLORS.primary : COLORS.card,
                    border: `1px solid ${filter === item.id ? COLORS.primary : COLORS.border}`,
                    color: filter === item.id ? COLORS.card : COLORS.text,
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <section className="grid gap-3">
              {pageItems.map((processo) => {
                const isExpanded = expandedId === processo.id;
                const docs = getDocumentosGerados(processo);
                const anexos = getOutrosDocumentos(processo);
                const isAguardando = processo.situacao === "aprovado_lancamento";

                return (
                  <article key={processo.id} className="rounded-lg border px-4 py-3 shadow-sm transition-all duration-300 hover:shadow-md" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
                    <button
                      type="button"
                      onClick={() => toggleExpanded(processo.id)}
                      className="flex w-full flex-wrap items-start justify-between gap-4 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_COLORS[processo.situacao]}`}>
                          {SITUACAO_LABELS[processo.situacao]}
                        </span>
                        <h2 className="mt-2 truncate text-base font-semibold" style={{ color: COLORS.text }}>{processo.produtor}</h2>
                        <p className="mt-1 text-sm" style={{ color: COLORS.textLight }}>CPF: {processo.cpf}</p>
                        <div className="mt-2 grid gap-1 text-sm" style={{ color: COLORS.textLight }}>
                          <span className="inline-flex items-center gap-2"><MapPin size={14} /> {processo.unidadeLocal}</span>
                          <span className="inline-flex items-center gap-2"><FileText size={14} /> Memorando {processo.memorandoNumero || "-"}</span>
                          <span className="inline-flex items-center gap-2"><Clock size={14} /> {formatDateTime(processo.analisadoEm || processo.lancadoEm)}</span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-[#F5F7F5]" style={{ color: COLORS.textLight }}>
                        {isExpanded ? "Recolher" : "Expandir"}
                        <ChevronDown size={14} className={isExpanded ? "rotate-180 transition-transform" : "transition-transform"} />
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="mt-4 border-t pt-4" style={{ borderTopColor: COLORS.border }}>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setExpandedTab("dados")}
                            className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors"
                            style={{
                              backgroundColor: expandedTab === "dados" ? COLORS.background : "transparent",
                              color: expandedTab === "dados" ? COLORS.primary : COLORS.textLight,
                            }}
                          >
                            <Info size={15} /> Dados
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpandedTab("historico")}
                            className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors"
                            style={{
                              backgroundColor: expandedTab === "historico" ? COLORS.background : "transparent",
                              color: expandedTab === "historico" ? COLORS.primary : COLORS.textLight,
                            }}
                          >
                            <History size={15} /> Histórico
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpandedTab("documentos")}
                            className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors"
                            style={{
                              backgroundColor: expandedTab === "documentos" ? COLORS.background : "transparent",
                              color: expandedTab === "documentos" ? COLORS.primary : COLORS.textLight,
                            }}
                          >
                            <FileText size={15} /> Documentos ({docs.length + anexos.length})
                          </button>
                        </div>

                        {expandedTab === "dados" && (
                          <div className="mt-4 space-y-4">
                            <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3" style={{ color: COLORS.text }}>
                              <InfoItem label="Status" value={SITUACAO_LABELS[processo.situacao]} />
                              <InfoItem label="Tipo" value={TIPO_PROCESSO_LABELS[processo.tipoProcesso]} />
                              <InfoItem label="Unidade Local" value={processo.unidadeLocal} />
                              <InfoItem label="Memorando" value={processo.memorandoNumero || "-"} />
                              <InfoItem label="Analista" value={processo.analistaResponsavel || "-"} />
                              <InfoItem label="Aprovado em" value={formatDateTime(processo.analisadoEm)} />
                              <InfoItem label="Lançado em" value={formatDateTime(processo.lancadoEm)} />
                            </div>

                            {isAguardando && (
                              <div className="grid gap-3">
                                {errors[processo.id] && (
                                  <div
                                    role="alert"
                                    className="flex items-start gap-2 rounded-md border px-3 py-2 text-sm font-medium"
                                    style={{ backgroundColor: "#FEF3F2", borderColor: "#FCA5A5", color: COLORS.danger }}
                                  >
                                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                                    <span>{errors[processo.id]}</span>
                                  </div>
                                )}
                                <textarea
                                  value={justificativas[processo.id] || ""}
                                  onChange={(event) => {
                                    setJustificativas((current) => ({ ...current, [processo.id]: event.target.value }));
                                    if (errors[processo.id]) setErrors((current) => ({ ...current, [processo.id]: "" }));
                                  }}
                                  placeholder="Justificativa obrigatória somente para devolver à Análise."
                                  rows={3}
                                  className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-green-500"
                                  style={{ borderColor: COLORS.border }}
                                />
                                <div className="flex flex-wrap justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => requestDevolver(processo)}
                                    className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
                                    style={{ backgroundColor: COLORS.danger }}
                                  >
                                    <RotateCcw size={15} /> Devolver para análise
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => requestConcluir(processo)}
                                    className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
                                    style={{ backgroundColor: COLORS.primary }}
                                  >
                                    <Send size={15} /> Concluir lançamento
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {expandedTab === "historico" && (
                          <div className="mt-4 rounded-md border p-4" style={{ borderColor: COLORS.border }}>
                            <ProcessoTimeline processo={processo} />
                          </div>
                        )}

                        {expandedTab === "documentos" && (
                          <div className="mt-4 grid gap-3">
                            <div className="rounded-md border p-3" style={{ borderColor: COLORS.border }}>
                              <p className="mb-2 font-semibold" style={{ color: COLORS.text }}>Documentos gerados automaticamente</p>
                              <div className="grid gap-1">
                                {docs.map((doc) => (
                                  <button
                                    key={doc.arquivo}
                                    type="button"
                                    onClick={() => setPreview({ tipo: "gerado", processo, documento: doc })}
                                    className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-[#F5F7F5]"
                                    style={{ color: COLORS.textLight }}
                                  >
                                    <Eye size={14} style={{ color: COLORS.primary }} />
                                    <span className="font-semibold" style={{ color: COLORS.text }}>{doc.nome}</span>
                                    <span className="min-w-0 truncate">{doc.arquivo}</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="rounded-md border p-3" style={{ borderColor: COLORS.border }}>
                              <p className="mb-2 font-semibold" style={{ color: COLORS.text }}>Documentos anexados</p>
                              {anexos.length > 0 ? (
                                <div className="grid gap-1">
                                  {anexos.map((doc) => (
                                    <button
                                      key={doc.id}
                                      type="button"
                                      onClick={() => setPreview({ tipo: "anexo", processo, documento: doc })}
                                      className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-[#F5F7F5]"
                                      style={{ color: COLORS.textLight }}
                                    >
                                      <Eye size={14} style={{ color: COLORS.primary }} />
                                      <span className="min-w-0 truncate">{doc.arquivo}</span>
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm" style={{ color: COLORS.textLight }}>Sem anexos extras</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </section>

            {filtered.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border, color: COLORS.text }}>
                <span>Página {currentPage} de {totalPages} | {filtered.length} processo(s)</span>
                <div className="flex flex-wrap items-center gap-2">
                  <StyledSelect
                    value={String(pageSize)}
                    onChange={(value) => { setPageSize(Number(value)); setPage(1); }}
                    size="compact"
                    className="w-40"
                    options={PAGE_SIZE_OPTIONS.map((option) => ({ value: String(option), label: `${option} por página` }))}
                    colors={COLORS}
                  />
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    className="rounded-md px-3 py-1.5 font-semibold disabled:opacity-50 transition-colors hover:bg-gray-100"
                    style={{ border: `1px solid ${COLORS.border}` }}
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    className="rounded-md px-3 py-1.5 font-semibold disabled:opacity-50 transition-colors hover:bg-gray-100"
                    style={{ border: `1px solid ${COLORS.border}` }}
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}

            {filtered.length === 0 && (
              <div className="rounded-lg border p-10 text-center text-sm" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border, color: COLORS.textLight }}>
                Nenhum processo encontrado em Lançamentos.
              </div>
            )}
          </div>
        </div>
      </main>

      {preview && <LancamentoPreviewModal preview={preview} onClose={() => setPreview(null)} />}

      {pendingAction && (
        <ConfirmActionDialog
          title={pendingAction.type === "concluir" ? "Concluir lançamento" : "Devolver para Análise"}
          description={
            pendingAction.type === "concluir"
              ? `Confirma a conclusão do lançamento de ${pendingAction.processo.produtor}? Após concluir, o processo será enviado para consulta e publicação correspondente.`
              : `Confirma a devolução do processo de ${pendingAction.processo.produtor} para Análise com a justificativa informada?`
          }
          confirmLabel={pendingAction.type === "concluir" ? "Concluir" : "Devolver"}
          tone={pendingAction.type === "concluir" ? "success" : "danger"}
          loading={actionLoading}
          colors={COLORS}
          onConfirm={confirmPendingAction}
          onClose={() => {
            if (!actionLoading) setPendingAction(null);
          }}
        />
      )}
    </div>
  );
}

// Componentes auxiliares
function StatCard({ label, value, active, onClick }: { label: string; value: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border px-3 py-2 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm"
      style={{
        borderColor: active ? COLORS.primary : COLORS.border,
        backgroundColor: active ? "#EEF5EC" : COLORS.card,
      }}
    >
      <p className="text-xs font-semibold uppercase" style={{ color: active ? COLORS.primary : COLORS.textLight }}>{label}</p>
      <p className="mt-1 text-xl font-bold" style={{ color: COLORS.primary }}>{value}</p>
    </button>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border px-3 py-2" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
      <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>{label}</p>
      <p className="mt-1 font-semibold" style={{ color: COLORS.text }}>{value}</p>
    </div>
  );
}
