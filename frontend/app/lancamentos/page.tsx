"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Clock, Eye, FileText, History, Info, MapPin, RotateCcw, Search, Send, X } from "lucide-react";
import { GeneratedDocumentPreview } from "../fluxo/DocumentPreviews";
import { ProcessoTimeline } from "../fluxo/ProcessoTimeline";
import Sidebar from "../sidebar/page";
import {
  SITUACAO_LABELS,
  STATUS_COLORS,
  TIPO_PROCESSO_LABELS,
  concluirLancamento,
  devolverLancamentoParaAnalise,
  formatDateTime,
  getDocumentosGerados,
  getOutrosDocumentos,
  loadProcessos,
  saveProcessos,
} from "../fluxo/storage";
import type { DocumentoGeradoProcesso, DocumentoProcesso, ProcessoSicpr } from "../fluxo/types";
import { useAuthSession } from "../hooks/useAuthSession";

const COLORS = {
  primary: "#2D452F",
  accent: "#6B9D4A",
  background: "#F5F7F5",
  card: "#FFFFFF",
  text: "#1A2E1B",
  textLight: "#6B7C6A",
  border: "#E2E8E0",
  danger: "#B42318",
};

const PAGE_SIZE_OPTIONS = [50, 100];

type LancamentoFilter = "todos" | "aguardando" | "concluidos";
type ExpandedTab = "dados" | "historico" | "documentos";

const FILTERS: { id: LancamentoFilter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "aguardando", label: "Aguardando lançamento" },
  { id: "concluidos", label: "Concluídos" },
];

export default function LancamentosPage() {
  const { username, logout, ready } = useAuthSession({ defaultUsername: "Lancamento" });
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
  const [preview, setPreview] = useState<
    | { tipo: "gerado"; processo: ProcessoSicpr; documento: DocumentoGeradoProcesso }
    | { tipo: "anexo"; processo: ProcessoSicpr; documento: DocumentoProcesso }
    | null
  >(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!ready || !mounted) return;
    const timer = window.setTimeout(() => {
      setProcessos(loadProcessos());
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

  function persist(next: ProcessoSicpr[]) {
    setProcessos(next);
    saveProcessos(next);
  }

  function applyFilter(next: LancamentoFilter) {
    setFilter(next);
    setPage(1);
  }

  function concluir(id: string) {
    persist(concluirLancamento(processos, id, username));
    setMessageType("success");
    setMessage("Lançamento concluído e histórico preservado.");
    setTimeout(() => setMessage(""), 5000);
    setExpandedId(null);
  }

  function devolverParaAnalise(id: string) {
    const justificativa = justificativas[id]?.trim();
    if (!justificativa) {
      setErrors((current) => ({ ...current, [id]: "A justificativa é obrigatória para devolver o processo à Análise." }));
      setExpandedTab("dados");
      return;
    }

    persist(devolverLancamentoParaAnalise(processos, id, username, justificativa));
    setMessageType("success");
    setMessage("Processo devolvido para Análise com justificativa registrada.");
    setTimeout(() => setMessage(""), 5000);
    setExpandedId(null);
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
                              <InfoItem label="UNLOC" value={processo.unidadeLocal} />
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
                                    onClick={() => devolverParaAnalise(processo.id)}
                                    className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
                                    style={{ backgroundColor: COLORS.danger }}
                                  >
                                    <RotateCcw size={15} /> Devolver para análise
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => concluir(processo.id)}
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
                  <select
                    value={pageSize}
                    onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}
                    className="rounded-md border px-3 py-1.5 font-semibold outline-none focus:ring-1 focus:ring-green-500"
                    style={{ borderColor: COLORS.border, backgroundColor: COLORS.card }}
                  >
                    {PAGE_SIZE_OPTIONS.map((option) => <option key={option} value={option}>{option} por página</option>)}
                  </select>
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

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-5">
          <div className="absolute inset-0 bg-black/45" onClick={() => setPreview(null)} />
          <div className="relative flex h-[90vh] w-[90vw] max-w-7xl flex-col overflow-hidden rounded-lg border shadow-2xl" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
            <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderBottomColor: COLORS.border }}>
              <div>
                <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>
                  {preview.tipo === "gerado" ? "Documento gerado pelo sistema" : "Anexo enviado pela UNLOC"}
                </p>
                <h2 className="mt-1 text-base font-semibold" style={{ color: COLORS.primary }}>
                  {preview.tipo === "gerado" ? preview.documento.nome : preview.documento.arquivo}
                </h2>
                <p className="text-sm" style={{ color: COLORS.textLight }}>{preview.processo.produtor} | {preview.processo.unidadeLocal}</p>
              </div>
              <button type="button" onClick={() => setPreview(null)} className="inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-gray-100" style={{ color: COLORS.textLight }}>
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-5" style={{ backgroundColor: COLORS.background }}>
              {preview.tipo === "gerado" ? (
                <GeneratedDocumentPreview processo={preview.processo} documento={preview.documento} />
              ) : (
                <AttachmentPreview documento={preview.documento} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componentes auxiliares
function AttachmentPreview({ documento }: { documento: DocumentoProcesso }) {
  if (documento.conteudo && documento.mimeType?.startsWith("image/")) {
    return (
      <div className="flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={documento.conteudo} alt={documento.arquivo} className="max-h-[72vh] max-w-full rounded-md border bg-white object-contain" />
      </div>
    );
  }

  if (documento.conteudo && documento.mimeType === "application/pdf") {
    return <iframe title={documento.arquivo} src={documento.conteudo} className="h-[72vh] w-full rounded-md border bg-white" />;
  }

  return (
    <div className="flex min-h-90 flex-col items-center justify-center rounded-md border border-dashed bg-white text-center">
      <FileText size={48} />
      <p className="mt-3 font-semibold">{documento.arquivo}</p>
      <p className="mt-1 text-sm text-gray-500">Arquivo anexado. Pré-visualização disponível para imagens e PDF.</p>
    </div>
  );
}

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