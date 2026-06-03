"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Eye, FileSignature, FileText, RotateCcw, Search, X } from "lucide-react";
import { GeneratedDocumentPreview as DocumentTemplatePreview } from "../fluxo/DocumentPreviews";
import { HistoricoResumo, ProcessoTimeline } from "../fluxo/ProcessoTimeline";
import TopBar from "../sidebar/page";
import {
  SITUACAO_LABELS,
  STATUS_COLORS,
  TIPO_PROCESSO_LABELS,
  aprovarLoteGerente,
  devolverPeloGerente,
  formatDateTime,
  getDocumentosGerados,
  getOutrosDocumentos,
  loadProcessos,
  saveProcessos,
} from "../fluxo/storage";
import type { DocumentoGeradoProcesso, DocumentoProcesso, ProcessoSicpr } from "../fluxo/types";

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

const PAGE_SIZE = 50;
type DetailTab = "dados" | "historico" | "documentos";

const DETAIL_TABS: Array<{ key: DetailTab; label: string }> = [
  { key: "dados", label: "Dados" },
  { key: "historico", label: "Histórico" },
  { key: "documentos", label: "Documentos" },
];

export default function GerentePage() {
  const router = useRouter();
  const [username, setUsername] = useState("Gerente Unloc");
  const [processos, setProcessos] = useState<ProcessoSicpr[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [justificativas, setJustificativas] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedProcesso, setSelectedProcesso] = useState<ProcessoSicpr | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>("dados");
  const [batchReturnOpen, setBatchReturnOpen] = useState(false);
  const [batchJustificativa, setBatchJustificativa] = useState("");
  const [batchError, setBatchError] = useState("");
  const [preview, setPreview] = useState<
    | { tipo: "gerado"; processo: ProcessoSicpr; documento: DocumentoGeradoProcesso }
    | { tipo: "anexo"; processo: ProcessoSicpr; documento: DocumentoProcesso }
    | null
  >(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    const timer = window.setTimeout(() => {
      setUsername(localStorage.getItem("username") || "Gerente Unloc");
      setProcessos(loadProcessos());
    }, 0);
    return () => window.clearTimeout(timer);
  }, [router]);

  const pendentes = useMemo(() => {
    const term = search.trim().toLowerCase();
    return processos
      .filter((processo) => processo.situacao === "encaminhado_gerente")
      .filter((processo) =>
        !term ||
        processo.produtor.toLowerCase().includes(term) ||
        processo.cpf.includes(term) ||
        processo.unidadeLocal.toLowerCase().includes(term) ||
        processo.tecnicoResponsavel.toLowerCase().includes(term),
      );
  }, [processos, search]);
  const totalPages = Math.max(1, Math.ceil(pendentes.length / PAGE_SIZE));
  const pagedPendentes = pendentes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const gerenteHistory = useMemo(() => getGerenteHistory(processos, username), [processos, username]);
  const stats = useMemo(() => {
    const hoje = new Date().toLocaleDateString("pt-BR");
    const aprovadosHoje = gerenteHistory.filter((item) => item.tipo === "aprovado" && new Date(item.dataHora).toLocaleDateString("pt-BR") === hoje).length;
    const devolvidosHoje = gerenteHistory.filter((item) => item.tipo === "devolvido" && new Date(item.dataHora).toLocaleDateString("pt-BR") === hoje).length;

    return {
      aguardando: pendentes.length,
      aprovadosHoje,
      devolvidosHoje,
      totalAnalisado: aprovadosHoje + devolvidosHoje,
    };
  }, [gerenteHistory, pendentes.length]);

  function persist(next: ProcessoSicpr[]) {
    setProcessos(next);
    saveProcessos(next);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    router.push("/login");
  }

  function toggle(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function approveBatch() {
    if (selectedIds.length === 0) {
      setMessageType("error");
      setMessage("Selecione ao menos um processo para aprovar e assinar.");
      return;
    }
    persist(aprovarLoteGerente(processos, selectedIds, username));
    setMessageType("success");
    setMessage(`Lote aprovado, assinado e encaminhado para analise com ${selectedIds.length} processo(s).`);
    setSelectedIds([]);
  }

  function openBatchReturn() {
    if (selectedIds.length === 0) {
      setMessageType("error");
      setMessage("Selecione ao menos um processo para devolver.");
      return;
    }

    setBatchJustificativa("");
    setBatchError("");
    setBatchReturnOpen(true);
  }

  function confirmBatchReturn() {
    const justificativa = batchJustificativa.trim();
    if (!justificativa) {
      setBatchError("Informe uma justificativa para devolução.");
      return;
    }

    const next = selectedIds.reduce(
      (current, id) => devolverPeloGerente(current, id, username, justificativa),
      processos,
    );
    persist(next);
    setMessageType("success");
    setMessage(`${selectedIds.length} processo(s) devolvido(s) com justificativa registrada.`);
    setSelectedIds([]);
    setBatchReturnOpen(false);
    setBatchJustificativa("");
    setBatchError("");
  }

  function devolver(id: string) {
    const justificativa = justificativas[id]?.trim();
    if (!justificativa) {
      setMessageType("error");
      setMessage("Informe uma justificativa antes de devolver o processo.");
      return;
    }
    persist(devolverPeloGerente(processos, id, username, justificativa));
    setMessageType("success");
    setMessage("Processo devolvido ao tecnico responsavel.");
  }

  function devolverSelected(id: string) {
    const justificativa = justificativas[id]?.trim();
    devolver(id);
    if (justificativa) setSelectedProcesso(null);
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
      <TopBar onLogout={handleLogout} username={username} />
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: COLORS.primary }}>Gerente da Unidade Local</h1>
              <p className="text-sm" style={{ color: COLORS.textLight }}>Aprovar e assinar processos ou devolver com justificativa obrigatória.</p>
            </div>
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative lg:w-[420px]">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textLight }} />
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Buscar produtor, CPF, município ou técnico..."
                  className="w-full rounded-md border py-2 pl-9 pr-3 text-sm outline-none"
                  style={{ borderColor: COLORS.border }}
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button onClick={approveBatch} className="sicpr-action-button inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: COLORS.primary }}>
                  <FileSignature size={16} />
                  Aprovar selecionados
                </button>
                <button onClick={openBatchReturn} className="sicpr-danger-button inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: COLORS.danger }}>
                  <RotateCcw size={16} />
                  Devolver selecionados
                </button>
              </div>
            </div>
          </div>

          {message && (
            <div
              role={messageType === "error" ? "alert" : "status"}
              className={`sicpr-alert ${messageType === "error" ? "sicpr-alert-error" : ""} flex items-start gap-3 rounded-md border px-4 py-3 text-sm font-medium`}
              style={{
                backgroundColor: messageType === "error" ? "#FEF3F2" : "#ECFDF3",
                borderColor: messageType === "error" ? "#FCA5A5" : "#ABEFC6",
                color: messageType === "error" ? COLORS.danger : "#027A48",
              }}
            >
              {messageType === "error" ? <AlertTriangle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
              <span>{message}</span>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Aguardando" value={stats.aguardando} />
            <StatCard label="Aprovados hoje" value={stats.aprovadosHoje} />
            <StatCard label="Devolvidos hoje" value={stats.devolvidosHoje} />
            <StatCard label="Total analisado" value={stats.totalAnalisado} />
          </div>

          <section className="rounded-lg border shadow-sm" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3" style={{ borderBottomColor: COLORS.border }}>
              <div>
                <h2 className="text-base font-semibold" style={{ color: COLORS.primary }}>Processos aguardando aprovação</h2>
                <p className="text-xs" style={{ color: COLORS.textLight }}>Selecione processos para aprovar em lote ou devolver com justificativa.</p>
              </div>
              {selectedIds.length > 0 && (
                <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: COLORS.background, color: COLORS.primary }}>
                  {selectedIds.length} selecionado(s)
                </span>
              )}
            </div>
            {pagedPendentes.length > 0 ? (
            <div className="overflow-x-auto p-4">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase" style={{ borderBottomColor: COLORS.border, color: COLORS.textLight }}>
                    <th className="px-3 py-2">Selecionar</th>
                    <th className="px-3 py-2">Produtor</th>
                    <th className="px-3 py-2">Município</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Técnico</th>
                    <th className="px-3 py-2">Data de envio</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedPendentes.map((processo) => (
                    <tr key={processo.id} className="border-b transition-colors hover:bg-[#F5F7F5]" style={{ borderBottomColor: COLORS.border }}>
                      <td className="px-3 py-3">
                        <input type="checkbox" checked={selectedIds.includes(processo.id)} onChange={() => toggle(processo.id)} className="h-4 w-4" />
                      </td>
                      <td
                        className="cursor-pointer px-3 py-3 font-semibold"
                        onClick={() => {
                          setSelectedProcesso(processo);
                          setActiveDetailTab("dados");
                        }}
                        style={{ color: COLORS.text }}
                      >
                        {processo.produtor}
                        <span className="block text-xs font-normal" style={{ color: COLORS.textLight }}>{processo.cpf}</span>
                      </td>
                      <td className="px-3 py-3" style={{ color: COLORS.text }}>{processo.unidadeLocal}</td>
                      <td className="px-3 py-3" style={{ color: COLORS.text }}>{TIPO_PROCESSO_LABELS[processo.tipoProcesso]}</td>
                      <td className="px-3 py-3" style={{ color: COLORS.text }}>{processo.tecnicoResponsavel}</td>
                      <td className="px-3 py-3" style={{ color: COLORS.textLight }}>{formatDateTime(processo.encaminhadoGerenteEm)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            ) : (
              <div className="p-4">
                <div className="rounded-md border px-4 py-5 text-center text-sm font-medium" style={{ backgroundColor: COLORS.background, borderColor: COLORS.border, color: COLORS.primary }}>
                  Nenhum processo aguardando aprovação do gerente.
                </div>
              </div>
            )}
            {pendentes.length > PAGE_SIZE && (
              <div className="flex items-center justify-between border-t px-4 py-3 text-sm" style={{ borderTopColor: COLORS.border, color: COLORS.text }}>
                <span>Pagina {page} de {totalPages} | {pendentes.length} processo(s)</span>
                <div className="flex gap-2">
                  <button type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-md px-3 py-1.5 font-semibold disabled:opacity-50" style={{ border: `1px solid ${COLORS.border}` }}>Anterior</button>
                  <button type="button" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="rounded-md px-3 py-1.5 font-semibold disabled:opacity-50" style={{ border: `1px solid ${COLORS.border}` }}>Proxima</button>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-lg border shadow-sm" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
            <div className="border-b px-4 py-3" style={{ borderBottomColor: COLORS.border }}>
              <h2 className="text-base font-semibold" style={{ color: COLORS.primary }}>Histórico recente</h2>
              <p className="text-xs" style={{ color: COLORS.textLight }}>Últimas decisões registradas pelo gerente.</p>
            </div>
            <div className="px-4 py-3">
              {gerenteHistory.length > 0 ? gerenteHistory.slice(0, 8).map((item) => (
                <div key={item.id} className="py-1.5 text-sm">
                  <div>
                    <p className="font-semibold" style={{ color: COLORS.text }}>{item.produtor}</p>
                    <p className="text-xs" style={{ color: COLORS.textLight }}>
                      {item.tipo === "aprovado" ? "Aprovado" : "Devolvido"} • {formatDateTime(item.dataHora)}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="px-4 py-8 text-center text-sm" style={{ color: COLORS.textLight }}>Nenhuma decisão registrada ainda.</div>
              )}
            </div>
          </section>
        </div>
      </main>

      {batchReturnOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-5">
          <div className="absolute inset-0 bg-black/45" onClick={() => setBatchReturnOpen(false)} />
          <section className="relative w-full max-w-xl rounded-lg border shadow-2xl" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
            <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderBottomColor: COLORS.border }}>
              <div>
                <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Devolução em lote</p>
                <h2 className="mt-1 text-base font-semibold" style={{ color: COLORS.primary }}>Devolver processos selecionados</h2>
                <p className="text-sm" style={{ color: COLORS.textLight }}>{selectedIds.length} processo(s) selecionado(s)</p>
              </div>
              <button type="button" onClick={() => setBatchReturnOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-gray-100" style={{ color: COLORS.textLight }}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 px-5 py-4">
              {batchError && (
                <div role="alert" className="flex items-start gap-2 rounded-md border px-3 py-2 text-sm font-medium" style={{ backgroundColor: "#FEF3F2", borderColor: "#FCA5A5", color: COLORS.danger }}>
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <span>{batchError}</span>
                </div>
              )}
              <label className="block text-sm font-semibold" style={{ color: COLORS.text }}>
                Motivo da devolução
                <textarea
                  value={batchJustificativa}
                  onChange={(event) => {
                    setBatchJustificativa(event.target.value);
                    if (batchError) setBatchError("");
                  }}
                  placeholder="Informe a justificativa obrigatória para devolver os processos selecionados."
                  rows={4}
                  className="mt-2 w-full rounded-md border px-3 py-2 text-sm font-normal outline-none"
                  style={{ borderColor: COLORS.border }}
                />
              </label>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t px-5 py-4" style={{ borderTopColor: COLORS.border }}>
              <button type="button" onClick={() => setBatchReturnOpen(false)} className="rounded-md px-3 py-2 text-sm font-semibold" style={{ border: `1px solid ${COLORS.border}`, color: COLORS.text }}>
                Cancelar
              </button>
              <button type="button" onClick={confirmBatchReturn} className="sicpr-danger-button inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white" style={{ backgroundColor: COLORS.danger }}>
                <RotateCcw size={15} />
                Confirmar devolução
              </button>
            </div>
          </section>
        </div>
      )}

      {selectedProcesso && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center px-4 py-5">
          <div className="absolute inset-0 bg-black/45" onClick={() => setSelectedProcesso(null)} />
          <section className="relative flex h-[90vh] w-[90vw] max-w-[1400px] flex-col overflow-hidden rounded-lg border shadow-2xl" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
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
                    <DetailInfoCard label="Status" value={SITUACAO_LABELS[selectedProcesso.situacao]} badgeClass={STATUS_COLORS[selectedProcesso.situacao]} />
                    <DetailInfoCard label="Técnico responsável" value={selectedProcesso.tecnicoResponsavel} />
                    <DetailInfoCard label="UNLOC" value={selectedProcesso.unidadeLocal} />
                    <DetailInfoCard label="Encaminhado ao gerente" value={formatDateTime(selectedProcesso.encaminhadoGerenteEm)} />
                    <DetailInfoCard label="Formulário" value={selectedProcesso.formulario} />
                    <DetailInfoCard label="Outros anexos" value={String(getOutrosDocumentos(selectedProcesso).length)} />
                  </div>

                  <textarea
                    value={justificativas[selectedProcesso.id] || ""}
                    onChange={(event) => setJustificativas({ ...justificativas, [selectedProcesso.id]: event.target.value })}
                    placeholder="Justificativa obrigatória para devolução: documento ilegível, faltando, dados incorretos..."
                    rows={3}
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                    style={{ borderColor: COLORS.border }}
                  />
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
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-md border p-4" style={{ borderColor: COLORS.border }}>
                    <p className="mb-2 inline-flex items-center gap-2 font-semibold" style={{ color: COLORS.text }}>
                      <FileText size={15} /> Documentos gerados automaticamente
                    </p>
                    {getDocumentosGerados(selectedProcesso).map((doc) => (
                      <button
                        key={doc.arquivo}
                        type="button"
                        onClick={() => setPreview({ tipo: "gerado", processo: selectedProcesso, documento: doc })}
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
                    {getOutrosDocumentos(selectedProcesso).length > 0 ? getOutrosDocumentos(selectedProcesso).map((doc) => (
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
                    )) : <p className="text-sm" style={{ color: COLORS.textLight }}>Sem anexos extras</p>}
                  </div>
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t px-5 py-4" style={{ borderTopColor: COLORS.border }}>
              <button type="button" onClick={() => toggle(selectedProcesso.id)} className="sicpr-action-button inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white" style={{ backgroundColor: selectedIds.includes(selectedProcesso.id) ? COLORS.accent : COLORS.primary }}>
                <CheckCircle2 size={15} />
                {selectedIds.includes(selectedProcesso.id) ? "Selecionado" : "Selecionar para lote"}
              </button>
              <button type="button" onClick={() => devolverSelected(selectedProcesso.id)} className="sicpr-danger-button inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white" style={{ backgroundColor: COLORS.danger }}>
                <RotateCcw size={15} />
                Devolver
              </button>
            </div>
          </section>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-5">
          <div className="absolute inset-0 bg-black/45" onClick={() => setPreview(null)} />
          <section className="relative flex h-[90vh] w-[90vw] max-w-[1400px] flex-col overflow-hidden rounded-lg border shadow-2xl" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
            <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderBottomColor: COLORS.border }}>
              <div>
                <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>{preview.tipo === "gerado" ? "Modelo gerado automaticamente" : "Anexo enviado pela Unloc"}</p>
                <h2 className="mt-1 text-lg font-semibold" style={{ color: COLORS.primary }}>
                  {preview.tipo === "gerado" ? preview.documento.nome : preview.documento.arquivo}
                </h2>
                <p className="text-sm" style={{ color: COLORS.textLight }}>{preview.processo.produtor} | {preview.processo.unidadeLocal}</p>
              </div>
              <button type="button" onClick={() => setPreview(null)} className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100" style={{ color: COLORS.textLight }}>
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
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-md border border-dashed bg-white text-center">
      <FileText size={48} />
      <p className="mt-3 font-semibold">{documento.arquivo}</p>
      <p className="mt-1 text-sm text-gray-500">Arquivo anexado. Pre-visualizacao disponivel para imagens e PDF.</p>
    </div>
  );
}

function DetailInfoCard({ label, value, badgeClass }: { label: string; value: string; badgeClass?: string }) {
  return (
    <div className="rounded-md border bg-white px-3 py-3" style={{ borderColor: COLORS.border }}>
      <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>{label}</p>
      {badgeClass ? (
        <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${badgeClass}`}>
          {value}
        </span>
      ) : (
        <p className="mt-2 break-words text-sm font-semibold" style={{ color: COLORS.text }}>{value}</p>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border px-3 py-2 shadow-sm" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
      <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>{label}</p>
      <p className="mt-1 text-xl font-bold" style={{ color: COLORS.primary }}>{value}</p>
    </div>
  );
}

function getGerenteHistory(processos: ProcessoSicpr[], username: string) {
  return processos
    .flatMap((processo) =>
      processo.historico
        .filter((item) =>
          item.usuario === username &&
          (item.acao === "Aprovado e assinado pelo gerente" || item.acao === "Devolvido pelo gerente"),
        )
        .map((item) => ({
          id: `${processo.id}-${item.id}`,
          produtor: processo.produtor,
          dataHora: item.dataHora,
          tipo: item.acao === "Devolvido pelo gerente" ? "devolvido" as const : "aprovado" as const,
        })),
    )
    .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
}

function GeneratedDocumentPreview({ processo, documento }: { processo: ProcessoSicpr; documento: DocumentoGeradoProcesso }) {
  if (documento.tipo === "fac" || documento.tipo === "declaracao_produtor") {
    return <DocumentTemplatePreview processo={processo} documento={documento} />;
  }

  if (documento.tipo === "formulario") {
    return <FormularioPreview processo={processo} />;
  }

  if (documento.tipo === "memorando") {
    return <MemorandoPreview processo={processo} />;
  }

  return (
    <div className="mx-auto min-h-[720px] max-w-3xl bg-white px-12 py-10 text-[14px] leading-7 shadow-sm">
      <header className="mb-8 text-center">
        <p className="text-3xl font-bold text-emerald-700">AMAZONAS</p>
        <p className="text-xs font-semibold uppercase text-gray-500">Governo do Estado</p>
      </header>
      <h3 className="text-center text-xl font-bold">{documento.nome}</h3>
      <p className="mt-10 text-right">{processo.unidadeLocal} - AM, {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}.</p>
      <p className="mt-6">
        Declaramos para os devidos fins de <strong>{processo.tipoProcesso}</strong> da Carteira do Produtor Rural que
        <strong> {processo.produtor}</strong>, CPF <strong>{processo.cpf}</strong>, possui processo cadastral vinculado a
        Unidade Local de <strong>{processo.unidadeLocal}</strong>.
      </p>
      <p className="mt-4">
        Este documento foi gerado automaticamente pelo SICPR com base nos dados preenchidos pela Unloc, sem necessidade de preenchimento manual.
      </p>
      {documento.dados && Object.keys(documento.dados).length > 0 && (
        <div className="mt-8 rounded border border-gray-200 p-4">
          <p className="mb-2 font-bold">Dados informados no preenchimento</p>
          {Object.entries(documento.dados).map(([campo, valor]) => (
            <p key={campo}>
              <strong>{campo}:</strong> {valor || "-"}
            </p>
          ))}
        </div>
      )}
      <div className="mt-20 grid grid-cols-2 gap-12 text-center">
        <div>
          <div className="border-t border-gray-500 pt-2">Tecnico responsavel</div>
          <p className="text-xs text-gray-500">{processo.tecnicoResponsavel}</p>
        </div>
        <div>
          <div className="border-t border-gray-500 pt-2">Gerente da Unidade Local</div>
          <p className="text-xs text-gray-500">{processo.gerenteResponsavel || "Aguardando assinatura"}</p>
        </div>
      </div>
    </div>
  );
}

function FormularioPreview({ processo }: { processo: ProcessoSicpr }) {
  return (
    <div className="mx-auto min-h-[720px] max-w-3xl bg-white px-12 py-10 text-[14px] leading-7 shadow-sm">
      <header className="mb-8 text-center">
        <p className="text-3xl font-bold text-emerald-700">AMAZONAS</p>
        <p className="text-xs font-semibold uppercase text-gray-500">Governo do Estado</p>
      </header>
      <h3 className="text-center text-xl font-bold">Formulario cadastral</h3>
      <div className="mt-10 grid gap-3 rounded border border-gray-200 p-5">
        <p><strong>Produtor:</strong> {processo.produtor}</p>
        <p><strong>CPF:</strong> {processo.cpf}</p>
        <p><strong>Tipo do processo:</strong> {TIPO_PROCESSO_LABELS[processo.tipoProcesso]}</p>
        <p><strong>Unidade Local:</strong> {processo.unidadeLocal}</p>
        <p><strong>Tecnico responsavel:</strong> {processo.tecnicoResponsavel}</p>
        <p><strong>Gerente responsavel:</strong> {processo.gerenteResponsavel || "Aguardando assinatura"}</p>
      </div>
    </div>
  );
}

function MemorandoPreview({ processo }: { processo: ProcessoSicpr }) {
  const produtores = processo.memorandoProdutores?.length
    ? processo.memorandoProdutores
    : [{ id: processo.id, produtor: processo.produtor, cpf: processo.cpf, tipoProcesso: processo.tipoProcesso }];
  const criadoEm = processo.memorandoCriadoEm ? new Date(processo.memorandoCriadoEm) : new Date();
  const dataCriacao = Number.isNaN(criadoEm.getTime()) ? new Date() : criadoEm;
  const grupos = groupProdutoresByTipoMemorando(produtores);
  const unidadeLocal = processo.unidadeLocal || "Unidade Local";
  const gerente = processo.gerenteResponsavel || "Gerente da Unidade Local";

  return (
    <div
      className="relative mx-auto min-h-[960px] max-w-3xl overflow-hidden bg-white px-14 pb-44 pt-36 text-[13px] leading-6 text-black shadow-sm"
      style={{ backgroundImage: "url('/images/PapelTimbrado.png')", backgroundSize: "100% 100%", backgroundRepeat: "no-repeat" }}
    >
      <p className="font-bold uppercase">MEMO Nº {processo.memorandoNumero} - UNLOC {unidadeLocal}</p>
      <p className="mt-4 text-right">{unidadeLocal}, {dataCriacao.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}.</p>
      <div className="mt-8 space-y-1 uppercase">
        <p><strong>DA:</strong> UNIDADE LOCAL DE {unidadeLocal}</p>
        <p><strong>PARA:</strong> CPCPR - GABIN</p>
      </div>
      <p className="mt-8">Prezado Senhor,</p>
      {grupos.map((grupo, groupIndex) => (
        <section key={grupo.tipo} className={groupIndex === 0 ? "mt-5" : "mt-8"}>
          <p>{grupo.texto}</p>
          <table className="mt-4 w-full border-collapse text-[12px]">
            <thead>
              <tr>
                <th className="border border-black px-2 py-1 text-center">Nº</th>
                <th className="border border-black px-2 py-1 text-left">NOME</th>
                <th className="border border-black px-2 py-1 text-left">CPF</th>
              </tr>
            </thead>
            <tbody>
              {grupo.produtores.map((produtor, index) => (
                <tr key={produtor.id || `${produtor.cpf}-${index}`}>
                  <td className="border border-black px-2 py-1 text-center">{index + 1}</td>
                  <td className="border border-black px-2 py-1 uppercase">{produtor.produtor}</td>
                  <td className="border border-black px-2 py-1">{produtor.cpf}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
      <p className="mt-8">Cordialmente,</p>
      <div className="mx-auto mt-20 w-80 border-t border-black pt-2 text-center">
        <p className="font-semibold uppercase">{gerente}</p>
        <p>Gerente da Unloc {unidadeLocal}</p>
      </div>
      <MemorandoTimbradoFooter />
    </div>
  );
}

function MemorandoTimbradoFooter() {
  return (
    <footer className="absolute bottom-8 left-12 right-12 grid grid-cols-[1fr_1.25fr_1fr] items-center gap-5 text-[11px] leading-4 text-[#7D8AA5]">
      <div className="space-y-0.5">
        <p>www.idam.am.gov.br</p>
        <p>twitter.com/idam_govam</p>
        <p>youtube.com/idam_govam</p>
        <p>facebook.com/idam_govam</p>
        <p>Instagram.com/@idam_govam</p>
      </div>
      <div className="border-x border-[#98A6A1] px-5">
        <p>presidencia@idam.am.gov.br</p>
        <p>Fone: (92) 98452-9911</p>
        <p>Avenida Carlos Drummond de</p>
        <p>Andrade, 1460, Bloco G - 2º Andar</p>
        <p>Conj. Atílio Andreazza - Japiim</p>
        <p>Manaus - AM - CEP: 69077-730</p>
      </div>
      <div className="flex justify-end">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/IDAM.png" alt="IDAM 30 anos" className="h-14 w-auto object-contain" />
      </div>
    </footer>
  );
}

function groupProdutoresByTipoMemorando(
  produtores: Array<{ id?: string; produtor: string; cpf: string; tipoProcesso: ProcessoSicpr["tipoProcesso"] }>,
) {
  const textos = {
    renovacao: "Ao cumprimentar Vossa Senhoria, estamos encaminhando em anexo as Carteiras de Produtor Rural para que sejam revalidadas, conforme relação abaixo:",
    inscricao: "Aproveitamos o ensejo para encaminhar em anexo o Primeiro Cadastro de Produtor Rural, para que seja expedida a 1ª via da Carteira do Produtor Rural abaixo relacionado:",
    alteracao: "Aproveitamos também para encaminhar em anexo as alterações do Cadastro dos Cartões do Produtor Primário, para que sejam corrigidas, conforme relação abaixo:",
  };

  return (["renovacao", "inscricao", "alteracao"] as const)
    .map((tipo) => ({
      tipo,
      texto: textos[tipo],
      produtores: produtores.filter((produtor) => produtor.tipoProcesso === tipo),
    }))
    .filter((grupo) => grupo.produtores.length > 0);
}
