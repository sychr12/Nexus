"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Clock, Eye, FileText, MapPin, RotateCcw, Search, UserRound, X } from "lucide-react";
import { GeneratedDocumentPreview } from "../fluxo/DocumentPreviews";
import { HistoricoResumo, ProcessoTimeline } from "../fluxo/ProcessoTimeline";
import { AttachmentPreview, DetailInfoCard as InfoCard, SICPR_COLORS } from "../fluxo/SharedUi";
import Sidebar from "../sidebar/page";
import {
  SITUACAO_LABELS,
  STATUS_COLORS,
  TIPO_PROCESSO_LABELS,
  decidirAnalise,
  formatDateTime,
  getDocumentosGerados,
  getOutrosDocumentos,
  loadProcessos,
  saveProcessos,
} from "../fluxo/storage";
import type { DocumentoGeradoProcesso, DocumentoProcesso, ProcessoSicpr } from "../fluxo/types";
import { useAuthSession } from "../hooks/useAuthSession";
import { getMemorandoStatus } from "./helpers";

const COLORS = SICPR_COLORS;

const PAGE_SIZE_OPTIONS = [25, 50, 100];

type MemorandoAnaliseResumo = {
  id: string;
  numero: string;
  criadoEm?: string;
  gerente?: string;
  unidadeLocal: string;
  processos: ProcessoSicpr[];
};

type MemorandoStatusFilter = "todos" | "em_analise" | "concluido";
type DetailTab = "dados" | "historico" | "documentos";

const MEMORANDO_STATUS_FILTERS: { key: MemorandoStatusFilter; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "em_analise", label: "Em análise" },
  { key: "concluido", label: "Concluído" },
];

const DETAIL_TABS: { key: DetailTab; label: string }[] = [
  { key: "dados", label: "Dados" },
  { key: "historico", label: "Histórico" },
  { key: "documentos", label: "Documentos" },
];

export default function AnalisesPage() {
  const { username, logout, ready } = useAuthSession({ defaultUsername: "Analista" });
  const [processos, setProcessos] = useState<ProcessoSicpr[]>([]);
  const [search, setSearch] = useState("");
  const [justificativas, setJustificativas] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [expandedMemoIds, setExpandedMemoIds] = useState<string[]>([]);
  const [selectedProcesso, setSelectedProcesso] = useState<ProcessoSicpr | null>(null);
  const [modalError, setModalError] = useState("");
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>("dados");
  const [statusFilter, setStatusFilter] = useState<MemorandoStatusFilter>("em_analise");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [preview, setPreview] = useState<
    | { tipo: "gerado"; processo: ProcessoSicpr; documento: DocumentoGeradoProcesso }
    | { tipo: "anexo"; processo: ProcessoSicpr; documento: DocumentoProcesso }
    | null
  >(null);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      setProcessos(loadProcessos());
    }, 0);
    return () => window.clearTimeout(timer);
  }, [ready]);

  const processosFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();
    return processos
      .filter((processo) => ["em_analise", "aprovado_lancamento", "concluido"].includes(processo.situacao) && processo.memorandoNumero)
      .filter((processo) =>
        !term ||
        processo.produtor.toLowerCase().includes(term) ||
        processo.cpf.includes(term) ||
        processo.unidadeLocal.toLowerCase().includes(term) ||
        processo.tecnicoResponsavel.toLowerCase().includes(term) ||
        (processo.gerenteResponsavel || "").toLowerCase().includes(term) ||
        (processo.memorandoNumero || "").toLowerCase().includes(term),
      );
  }, [processos, search]);

  const memorandos = useMemo(() => {
    const grupos = new Map<string, MemorandoAnaliseResumo>();

    processosFiltrados.forEach((processo) => {
      const key = processo.memorandoLoteId || processo.memorandoNumero || processo.id;
      const grupo = grupos.get(key);

      if (grupo) {
        if (!grupo.processos.some((item) => item.id === processo.id)) grupo.processos.push(processo);
        return;
      }

      grupos.set(key, {
        id: key,
        numero: processo.memorandoNumero || "-",
        criadoEm: processo.memorandoCriadoEm || processo.enviadoAnaliseEm,
        gerente: processo.gerenteResponsavel,
        unidadeLocal: processo.unidadeLocal,
        processos: [processo],
      });
    });

    return Array.from(grupos.values())
      .filter((memorando) => statusFilter === "todos" || getMemorandoStatus(memorando).key === statusFilter)
      .sort((a, b) => new Date(b.criadoEm || "").getTime() - new Date(a.criadoEm || "").getTime());
  }, [processosFiltrados, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(memorandos.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const memorandosPaginados = memorandos.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function persist(next: ProcessoSicpr[]) {
    setProcessos(next);
    saveProcessos(next);
  }

  function aprovar(id: string) {
    if (!isAnaliseOperacional(id)) {
      setModalError("Este processo já saiu da etapa de Análise e está disponível apenas para consulta.");
      setActiveDetailTab("dados");
      return;
    }
    persist(decidirAnalise(processos, id, username, "aprovado_lancamento"));
    setMessageType("success");
    setMessage("Processo aprovado pela análise e encaminhado para Lançamentos.");
    setTimeout(() => setMessage(""), 5000);
  }

  function devolver(id: string) {
    if (!isAnaliseOperacional(id)) {
      setModalError("Este processo já saiu da etapa de Análise. Devoluções posteriores devem ocorrer em Lançamentos.");
      setActiveDetailTab("dados");
      return;
    }
    const justificativa = justificativas[id]?.trim();
    if (!justificativa) {
      setModalError("A justificativa é obrigatória para devolver o processo à UNLOC.");
      setActiveDetailTab("dados");
      return;
    }
    persist(decidirAnalise(processos, id, username, "devolvido_analise", justificativa));
    setMessageType("success");
    setMessage("Processo devolvido ao técnico responsável da Unidade Local.");
    setTimeout(() => setMessage(""), 5000);
  }

  function toggleMemo(id: string) {
    setExpandedMemoIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function isAnaliseOperacional(id: string) {
    return processos.find((processo) => processo.id === id)?.situacao === "em_analise";
  }

  function approveSelectedProcesso(id: string) {
    setModalError("");
    aprovar(id);
    setSelectedProcesso(null);
  }

  function devolverSelectedProcesso(id: string) {
    const justificativa = justificativas[id]?.trim();
    devolver(id);
    if (justificativa) setSelectedProcesso(null);
  }

  if (!ready) {
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
        username={username || "Analista"} 
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
                <h1 className="text-2xl font-bold" style={{ color: COLORS.primary }}>Análises</h1>
                <p className="text-sm" style={{ color: COLORS.textLight }}>Processos assinados pelo gerente, com memorando de lote, FAC e declarações automáticas.</p>
              </div>
              <div className="relative lg:w-96">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textLight }} />
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Buscar produtor, CPF, UNLOC ou memorando..."
                  className="w-full rounded-md border py-2 pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-green-500"
                  style={{ borderColor: COLORS.border }}
                />
              </div>
            </div>

            {message && (
              <div
                role={messageType === "error" ? "alert" : "status"}
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

            <div className="flex flex-wrap gap-2">
              {MEMORANDO_STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => {
                    setStatusFilter(filter.key);
                    setPage(1);
                  }}
                  className="rounded-full px-3 py-1.5 text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: statusFilter === filter.key ? COLORS.primary : COLORS.card,
                    border: `1px solid ${statusFilter === filter.key ? COLORS.primary : COLORS.border}`,
                    color: statusFilter === filter.key ? COLORS.card : COLORS.text,
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <section className="grid gap-3">
              {memorandosPaginados.map((memorando) => {
                const isExpanded = expandedMemoIds.includes(memorando.id);
                const memoStatus = getMemorandoStatus(memorando);
                return (
                <article key={memorando.id} className="rounded-lg border px-4 py-3 shadow-sm transition-shadow hover:shadow-md" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
                  <button
                    type="button"
                    onClick={() => toggleMemo(memorando.id)}
                    className="flex w-full flex-wrap items-center justify-between gap-4 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${memoStatus.className}`}>
                          {memoStatus.label}
                        </span>
                        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset" style={{ backgroundColor: "#F5F7F5", color: COLORS.primary, borderColor: "#E2E8E0" }}>
                          {memorando.processos.length} {memorando.processos.length === 1 ? "Processo" : "Processos"}
                        </span>
                      </div>
                      <h2 className="mt-2 truncate text-base font-semibold uppercase tracking-wide" style={{ color: COLORS.primary }}>Memorando {memorando.numero}</h2>
                      <div className="mt-2 grid gap-1 text-sm font-medium" style={{ color: COLORS.textLight }}>
                        <span className="inline-flex items-center gap-2">
                          <MapPin size={14} />
                          {memorando.unidadeLocal}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <UserRound size={14} />
                          Gerente: {memorando.gerente || "-"}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <Clock size={14} />
                          {formatDateTime(memorando.criadoEm)}
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-[#F5F7F5]" style={{ color: COLORS.textLight }}>
                      {isExpanded ? "Recolher" : "Produtores"}
                      <ChevronDown size={14} className={isExpanded ? "rotate-180 transition-transform" : "transition-transform"} />
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="mt-4 overflow-hidden rounded-md border" style={{ borderColor: COLORS.border }}>
                      <div className="grid grid-cols-[1.5fr_.8fr_.8fr_.8fr] gap-3 border-b px-3 py-2 text-xs font-semibold uppercase" style={{ borderBottomColor: COLORS.border, color: COLORS.textLight }}>
                        <span>Produtor</span>
                        <span>Tipo</span>
                        <span>Status</span>
                        <span className="text-right">Ação</span>
                      </div>
                      {memorando.processos.map((processo) => (
                        <button
                          key={processo.id}
                          type="button"
                          onClick={() => {
                            setSelectedProcesso(processo);
                            setActiveDetailTab("dados");
                            setModalError("");
                          }}
                          className="grid w-full grid-cols-[1.5fr_.8fr_.8fr_.8fr] items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-[#F5F7F5]"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-semibold" style={{ color: COLORS.text }}>{processo.produtor}</span>
                            <span className="text-xs" style={{ color: COLORS.textLight }}>{processo.cpf}</span>
                          </span>
                          <span style={{ color: COLORS.text }}>{TIPO_PROCESSO_LABELS[processo.tipoProcesso]}</span>
                          <span className={`w-fit rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_COLORS[processo.situacao]}`}>
                            {SITUACAO_LABELS[processo.situacao]}
                          </span>
                          <span className="text-right font-semibold" style={{ color: COLORS.primary }}>Ver detalhes</span>
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              );
              })}
            </section>

            {memorandos.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border, color: COLORS.text }}>
                <span>Página {currentPage} de {totalPages} | {memorandos.length} memorando(s)</span>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value));
                      setPage(1);
                    }}
                    className="rounded-md border px-3 py-1.5 font-semibold outline-none focus:ring-1 focus:ring-green-500"
                    style={{ borderColor: COLORS.border, backgroundColor: COLORS.card }}
                  >
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option} por página</option>
                    ))}
                  </select>
                  <button 
                    type="button" 
                    disabled={currentPage === 1} 
                    onClick={() => setPage((curr) => Math.max(1, curr - 1))} 
                    className="rounded-md px-3 py-1.5 font-semibold disabled:opacity-50 transition-colors hover:bg-gray-100" 
                    style={{ border: `1px solid ${COLORS.border}` }}
                  >
                    Anterior
                  </button>
                  <button 
                    type="button" 
                    disabled={currentPage === totalPages} 
                    onClick={() => setPage((curr) => Math.min(totalPages, curr + 1))} 
                    className="rounded-md px-3 py-1.5 font-semibold disabled:opacity-50 transition-colors hover:bg-gray-100" 
                    style={{ border: `1px solid ${COLORS.border}` }}
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}

            {memorandos.length === 0 && (
              <div className="rounded-lg border p-10 text-center text-sm" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border, color: COLORS.textLight }}>
                Nenhum memorando encontrado.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de Detalhes do Processo */}
      {selectedProcesso && (
        <div className="fixed inset-0 z-75 flex items-center justify-center px-4 py-5">
          <div className="absolute inset-0 bg-black/45" onClick={() => setSelectedProcesso(null)} />
          <section className="relative flex h-[90vh] w-[90vw] max-w-350 flex-col overflow-hidden rounded-lg border shadow-2xl" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
            <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderBottomColor: COLORS.border }}>
              <div>
                <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Detalhes do processo</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold" style={{ color: COLORS.primary }}>{selectedProcesso.produtor}</h2>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_COLORS[selectedProcesso.situacao]}`}>
                    {SITUACAO_LABELS[selectedProcesso.situacao]}
                  </span>
                </div>
                <p className="text-sm" style={{ color: COLORS.textLight }}>{selectedProcesso.cpf} | {selectedProcesso.unidadeLocal} | {TIPO_PROCESSO_LABELS[selectedProcesso.tipoProcesso]}</p>
              </div>
              <button type="button" onClick={() => setSelectedProcesso(null)} className="inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-gray-100" style={{ color: COLORS.textLight }}>
                <X size={18} />
              </button>
            </div>

            <div className="border-b px-5 pt-3" style={{ borderBottomColor: COLORS.border }}>
              <div className="flex flex-wrap gap-2">
                {DETAIL_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveDetailTab(tab.key)}
                    className="rounded-t-md px-3 py-2 text-sm font-semibold transition-colors"
                    style={{
                      backgroundColor: activeDetailTab === tab.key ? COLORS.background : "transparent",
                      color: activeDetailTab === tab.key ? COLORS.primary : COLORS.textLight,
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-5">
              {activeDetailTab === "dados" && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <InfoCard label="Status" value={SITUACAO_LABELS[selectedProcesso.situacao]} badgeClass={STATUS_COLORS[selectedProcesso.situacao]} />
                    <InfoCard label="Técnico responsável" value={selectedProcesso.tecnicoResponsavel} />
                    <InfoCard label="Gerente responsável" value={selectedProcesso.gerenteResponsavel || "-"} />
                    <InfoCard label="Data de criação" value={formatDateTime(selectedProcesso.criadoEm)} />
                    <InfoCard label="Último encaminhamento" value={formatDateTime(selectedProcesso.enviadoAnaliseEm || selectedProcesso.encaminhadoGerenteEm)} />
                    <InfoCard label="Memorando atual" value={selectedProcesso.memorandoNumero || "-"} />
                    <InfoCard label="UNLOC" value={selectedProcesso.unidadeLocal} />
                    <InfoCard label="Tipo do processo" value={TIPO_PROCESSO_LABELS[selectedProcesso.tipoProcesso]} />
                    <InfoCard label="Assinatura do gerente" value={formatDateTime(selectedProcesso.gerenteAssinadoEm)} />
                  </div>

                  {modalError && (
                    <div
                      role="alert"
                      className="flex items-start gap-3 rounded-md border px-4 py-3 text-sm font-medium"
                      style={{ backgroundColor: "#FEF3F2", borderColor: "#FCA5A5", color: COLORS.danger }}
                    >
                      <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                      <span>{modalError}</span>
                    </div>
                  )}

                  {selectedProcesso.situacao === "em_analise" ? (
                    <>
                      <textarea
                        value={justificativas[selectedProcesso.id] || ""}
                        onChange={(event) => {
                          setJustificativas({ ...justificativas, [selectedProcesso.id]: event.target.value });
                          if (modalError) setModalError("");
                        }}
                        placeholder="Justificativa obrigatória somente para devolução."
                        rows={3}
                        className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-green-500"
                        style={{ borderColor: COLORS.border }}
                      />

                      <div className="flex flex-wrap justify-end gap-2">
                        <button 
                          type="button" 
                          onClick={() => approveSelectedProcesso(selectedProcesso.id)} 
                          className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90" 
                          style={{ backgroundColor: COLORS.accent }}
                        >
                          <CheckCircle2 size={15} />
                          Aprovar para lançamento
                        </button>
                        <button 
                          type="button" 
                          onClick={() => devolverSelectedProcesso(selectedProcesso.id)} 
                          className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90" 
                          style={{ backgroundColor: COLORS.danger }}
                        >
                          <RotateCcw size={15} />
                          Devolver a UNLOC
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-md border px-4 py-3 text-sm" style={{ backgroundColor: COLORS.background, borderColor: COLORS.border, color: COLORS.textLight }}>
                      Processo fora da etapa operacional da Análise. Nesta tela ele fica disponível apenas para consulta.
                    </div>
                  )}
                </div>
              )}

              {activeDetailTab === "historico" && (
                <div className="grid gap-4">
                  <div className="rounded-md border p-4" style={{ borderColor: COLORS.border }}>
                    <p className="mb-3 font-semibold" style={{ color: COLORS.text }}>Resumo do histórico</p>
                    <HistoricoResumo processo={selectedProcesso} />
                  </div>
                  <div className="rounded-md border p-4" style={{ borderColor: COLORS.border }}>
                    <p className="mb-4 font-semibold" style={{ color: COLORS.text }}>Timeline do processo</p>
                    <ProcessoTimeline processo={selectedProcesso} />
                  </div>
                </div>
              )}

              {activeDetailTab === "documentos" && (
                <div className="grid gap-4">
                  <div className="rounded-md border p-4" style={{ borderColor: COLORS.border, color: COLORS.textLight }}>
                    <p className="mb-2 inline-flex items-center gap-2 font-semibold" style={{ color: COLORS.text }}>
                      <FileText size={15} /> Documentos gerados automaticamente
                    </p>
                    <div className="grid gap-1">
                      {getDocumentosGerados(selectedProcesso).map((doc) => (
                        <button
                          key={doc.arquivo}
                          type="button"
                          onClick={() => setPreview({ tipo: "gerado", processo: selectedProcesso, documento: doc })}
                          className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left transition-colors hover:bg-[#F5F7F5]"
                          style={{ color: COLORS.textLight }}
                        >
                          <Eye size={13} style={{ color: COLORS.primary }} />
                          <span className="font-semibold" style={{ color: COLORS.text }}>{doc.nome}</span>
                          <span className="min-w-0 truncate">{doc.arquivo}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-md border p-4" style={{ borderColor: COLORS.border, color: COLORS.textLight }}>
                    <p className="mb-2 font-semibold" style={{ color: COLORS.text }}>Documentos anexados</p>
                    {getOutrosDocumentos(selectedProcesso).length > 0 ? (
                      getOutrosDocumentos(selectedProcesso).map((doc) => (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => setPreview({ tipo: "anexo", processo: selectedProcesso, documento: doc })}
                          className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left transition-colors hover:bg-[#F5F7F5]"
                          style={{ color: COLORS.textLight }}
                        >
                          <Eye size={13} style={{ color: COLORS.primary }} />
                          <span className="min-w-0 truncate">{doc.arquivo}</span>
                        </button>
                      ))
                    ) : (
                      <p className="text-sm">Sem anexos extras</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Modal de Preview de Documento */}
      {preview && (
        <div className="fixed inset-0 z-80 flex items-center justify-center px-4 py-5">
          <div className="absolute inset-0 bg-black/45" onClick={() => setPreview(null)} />
          <section className="relative flex h-[90vh] w-[90vw] max-w-350 flex-col overflow-hidden rounded-lg border shadow-2xl" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
            <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderBottomColor: COLORS.border }}>
              <div>
                <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>
                  {preview.tipo === "gerado" ? "Documento gerado pelo sistema" : "Anexo enviado pela Unloc"}
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
          </section>
        </div>
      )}
    </div>
  );
}