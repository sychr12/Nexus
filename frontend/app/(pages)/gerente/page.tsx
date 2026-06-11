"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Clock, Edit3, FileSignature, MapPin, RotateCcw, Save, Search, UserPlus, X } from "lucide-react";
import { AttachmentPreview, DetailInfoCard, SICPR_COLORS, StatCard } from "@/app/_features/fluxo/SharedUi";
import Sidebar from "@/app/_components/layout/Sidebar";
import { UNLOC_OPTIONS } from "@/app/_lib/unlocs";
import {
  GERENTE_STATUS_LABELS,
  TIPO_PROCESSO_LABELS,
  aprovarLoteGerente,
  devolverPeloGerente,
  formatDateTime,
  getGerentesAssinantesDaUnidade,
  inativarGerenteUnidade,
  loadGerentesUnidade,
  loadProcessos,
  salvarGerenteUnidade,
  saveGerentesUnidade,
  saveProcessos,
} from "@/app/_features/fluxo/storage";
import type { DocumentoGeradoProcesso, DocumentoProcesso, GerenteUnidade, GerenteUnidadeStatus, ProcessoSicpr } from "@/app/_features/fluxo/types";
import { useAuthSession } from "@/app/_hooks/useAuthSession";
import { GeneratedDocumentPreview } from "./GerenteDocumentPreviews";
import GerenteProcessDetailsModal from "./GerenteProcessDetailsModal";
import { getGerenteHistory, getGerenteHistoryStatusClass } from "./history";
import type { DetailTab } from "./types";

const COLORS = SICPR_COLORS;

const PAGE_SIZE = 50;

const emptyGerenteForm = {
  id: "",
  nome: "",
  unidadeLocal: "Manacapuru",
  cargo: "Gerente da Unidade Local",
  telefoneCorporativo: "",
  telefonePessoal: "",
  status: "ativo" as GerenteUnidadeStatus,
};

export default function GerentePage() {
  const { username, logout, ready } = useAuthSession({ defaultUsername: "Gerente de Unidade Local" });
  const [processos, setProcessos] = useState<ProcessoSicpr[]>([]);
  const [gerentes, setGerentes] = useState<GerenteUnidade[]>([]);
  const [gerenteForm, setGerenteForm] = useState(emptyGerenteForm);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [justificativas, setJustificativas] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedProcesso, setSelectedProcesso] = useState<ProcessoSicpr | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>("dados");
  const [expandedHistoryMemoIds, setExpandedHistoryMemoIds] = useState<string[]>([]);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [batchReturnOpen, setBatchReturnOpen] = useState(false);
  const [batchJustificativa, setBatchJustificativa] = useState("");
  const [batchError, setBatchError] = useState("");
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [signatureGerente, setSignatureGerente] = useState<GerenteUnidade | null>(null);
  const [signatureUnidade, setSignatureUnidade] = useState("");
  const [preview, setPreview] = useState<{
    tipo: "gerado";
    processo: ProcessoSicpr;
    documento: DocumentoGeradoProcesso;
  } | {
    tipo: "anexo";
    processo: ProcessoSicpr;
    documento: DocumentoProcesso;
  } | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!ready || !mounted) return;
    const timer = window.setTimeout(() => {
      setProcessos(loadProcessos());
      setGerentes(loadGerentesUnidade());
    }, 0);
    return () => window.clearTimeout(timer);
  }, [ready, mounted]);

  const pendentes = useMemo(() => {
    const term = search.trim().toLowerCase();
    return processos
      .filter((processo) => processo.situacao === "encaminhado_gerente")
      .filter((processo) =>
        !term ||
        processo.produtor.toLowerCase().includes(term) ||
        processo.cpf.includes(term) ||
        processo.unidadeLocal.toLowerCase().includes(term) ||
        processo.tecnicoResponsavel.toLowerCase().includes(term)
      );
  }, [processos, search]);

  const totalPages = Math.max(1, Math.ceil(pendentes.length / PAGE_SIZE));
  const pagedPendentes = pendentes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const gerenteHistory = useMemo(() => getGerenteHistory(processos), [processos]);
  const selectedProcessos = useMemo(
    () => processos.filter((processo) => selectedIds.includes(processo.id)),
    [processos, selectedIds]
  );

  const signatureSummary = useMemo(() => {
    const memorando = "Gerado automaticamente";
    const unidades = Array.from(new Set(selectedProcessos.map((processo) => processo.unidadeLocal)));
    const produtores = new Set(selectedProcessos.map((processo) => processo.cpf));

    return {
      memorando,
      unidades,
      quantidadeProcessos: selectedProcessos.length,
      quantidadeProdutores: produtores.size,
      documentos: ["Memorando", "Declaracoes vinculadas"],
    };
  }, [selectedProcessos]);

  const visibleGerenteHistory = showFullHistory ? gerenteHistory : gerenteHistory.slice(0, 10);

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

  function toggle(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function persistGerentes(next: GerenteUnidade[]) {
    setGerentes(next);
    saveGerentesUnidade(next);
  }

  function toggleHistoryMemo(id: string) {
    setExpandedHistoryMemoIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function approveBatch() {
    if (selectedIds.length === 0) {
      setMessageType("error");
      setMessage("Selecione ao menos um processo para aprovar e assinar.");
      return;
    }

    const unidades = signatureSummary.unidades;
    if (unidades.length !== 1) {
      setMessageType("error");
      setMessage("Selecione processos de apenas uma Unidade Local por assinatura.");
      return;
    }

    const unidade = unidades[0];
    const assinantes = getGerentesAssinantesDaUnidade(gerentes, unidade);
    if (assinantes.length === 0) {
      setMessageType("error");
      setMessage("Nao existe gerente ativo vinculado a esta Unidade Local.");
      return;
    }

    if (assinantes.length > 1) {
      setMessageType("error");
      setMessage("Existe conflito de responsaveis para esta Unidade Local.");
      return;
    }

    setSignatureUnidade(unidade);
    setSignatureGerente(assinantes[0]);
    setSignatureOpen(true);
  }

  function confirmSignature() {
    if (!signatureGerente) return;
    persist(aprovarLoteGerente(processos, selectedIds, signatureGerente));
    setMessageType("success");
    setMessage(`Lote aprovado, assinado e encaminhado para analise com ${selectedIds.length} processo(s).`);
    setSelectedIds([]);
    setSignatureOpen(false);
    setSignatureGerente(null);
  }

  function saveGerenteForm() {
    const nome = gerenteForm.nome.trim();
    const unidadeLocal = gerenteForm.unidadeLocal.trim();
    const cargo = gerenteForm.cargo.trim();

    if (!nome || !unidadeLocal || !cargo) {
      setMessageType("error");
      setMessage("Informe nome, Unidade Local e cargo do gerente.");
      return;
    }

    const next = salvarGerenteUnidade(gerentes, {
      ...gerenteForm,
      nome,
      unidadeLocal,
      cargo,
      telefoneCorporativo: gerenteForm.telefoneCorporativo.trim(),
      telefonePessoal: gerenteForm.telefonePessoal.trim(),
      id: gerenteForm.id || undefined,
    });
    persistGerentes(next);
    setGerenteForm(emptyGerenteForm);
    setMessageType("success");
    setMessage("Cadastro do gerente salvo. Registros antigos permanecem preservados.");
  }

  function editGerente(gerente: GerenteUnidade) {
    setGerenteForm({
      id: gerente.id,
      nome: gerente.nome,
      unidadeLocal: gerente.unidadeLocal,
      cargo: gerente.cargo,
      telefoneCorporativo: gerente.telefoneCorporativo,
      telefonePessoal: gerente.telefonePessoal,
      status: gerente.status,
    });
  }

  function deactivateGerente(id: string) {
    persistGerentes(inativarGerenteUnidade(gerentes, id));
    setMessageType("success");
    setMessage("Gerente inativado com data de encerramento registrada.");
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
      processos
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
        username={username || "Gerente de Unidade Local"}
        onCollapsedChange={setSidebarCollapsed}
      />

      <main
        className="transition-all duration-300 min-h-screen"
        style={{ marginLeft: sidebarCollapsed ? '72px' : '260px' }}
      >
        <div className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-3">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: COLORS.primary }}>Gerente da Unidade Local</h1>
                <p className="text-sm" style={{ color: COLORS.textLight }}>Aprovar e assinar processos ou devolver com justificativa obrigatória.</p>
              </div>
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative lg:w-96">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textLight }} />
                  <input
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Buscar produtor, CPF, município ou técnico..."
                    className="w-full rounded-md border py-2 pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-green-500"
                    style={{ borderColor: COLORS.border }}
                  />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={approveBatch}
                    className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
                    style={{ backgroundColor: COLORS.primary }}
                  >
                    <FileSignature size={16} />
                    Aprovar selecionados
                  </button>
                  <button
                    onClick={openBatchReturn}
                    className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
                    style={{ backgroundColor: COLORS.danger }}
                  >
                    <RotateCcw size={16} />
                    Devolver selecionados
                  </button>
                </div>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div
                className="flex items-start gap-3 rounded-md border px-4 py-3 text-sm font-medium"
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

            {/* Stats */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Aguardando" value={stats.aguardando} />
              <StatCard label="Aprovados hoje" value={stats.aprovadosHoje} />
              <StatCard label="Devolvidos hoje" value={stats.devolvidosHoje} />
              <StatCard label="Total analisado" value={stats.totalAnalisado} />
            </div>

            {/* Gerentes Section */}
            <section className="rounded-lg border shadow-sm" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3" style={{ borderBottomColor: COLORS.border }}>
                <div>
                  <h2 className="text-base font-semibold" style={{ color: COLORS.primary }}>Gerentes das Unidades Locais</h2>
                  <p className="text-xs" style={{ color: COLORS.textLight }}>Cadastro administrativo usado para simular e validar a assinatura eletronica.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setGerenteForm(emptyGerenteForm)}
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors hover:bg-gray-100"
                  style={{ border: `1px solid ${COLORS.border}`, color: COLORS.primary }}
                >
                  <UserPlus size={15} />
                  Novo gerente
                </button>
              </div>

              <div className="grid gap-4 p-4 xl:grid-cols-[360px_1fr]">
                {/* Form */}
                <div className="rounded-md border p-4" style={{ borderColor: COLORS.border }}>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="font-semibold" style={{ color: COLORS.text }}>{gerenteForm.id ? "Editar gerente" : "Cadastrar gerente"}</p>
                    {gerenteForm.id && (
                      <button type="button" onClick={() => setGerenteForm(emptyGerenteForm)} className="text-xs font-semibold transition-colors hover:opacity-70" style={{ color: COLORS.textLight }}>
                        Limpar
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3">
                    <input
                      value={gerenteForm.nome}
                      onChange={(e) => setGerenteForm({ ...gerenteForm, nome: e.target.value })}
                      placeholder="Nome completo"
                      className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-green-500"
                      style={{ borderColor: COLORS.border }}
                    />
                    <select
                      value={gerenteForm.unidadeLocal}
                      onChange={(e) => setGerenteForm({ ...gerenteForm, unidadeLocal: e.target.value })}
                      className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-green-500"
                      style={{ borderColor: COLORS.border }}
                    >
                      {UNLOC_OPTIONS.map((option) => (
                        <option key={option.value} value={option.municipio}>{option.label}</option>
                      ))}
                    </select>
                    <input
                      value={gerenteForm.cargo}
                      onChange={(e) => setGerenteForm({ ...gerenteForm, cargo: e.target.value })}
                      placeholder="Cargo"
                      className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-green-500"
                      style={{ borderColor: COLORS.border }}
                    />
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      <input
                        value={gerenteForm.telefoneCorporativo}
                        onChange={(e) => setGerenteForm({ ...gerenteForm, telefoneCorporativo: e.target.value })}
                        placeholder="Telefone corporativo"
                        className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-green-500"
                        style={{ borderColor: COLORS.border }}
                      />
                      <input
                        value={gerenteForm.telefonePessoal}
                        onChange={(e) => setGerenteForm({ ...gerenteForm, telefonePessoal: e.target.value })}
                        placeholder="Telefone pessoal"
                        className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-green-500"
                        style={{ borderColor: COLORS.border }}
                      />
                    </div>
                    <select
                      value={gerenteForm.status}
                      onChange={(e) => setGerenteForm({ ...gerenteForm, status: e.target.value as GerenteUnidadeStatus })}
                      className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-green-500"
                      style={{ borderColor: COLORS.border }}
                    >
                      <option value="ativo">Ativo</option>
                      <option value="respondendo">Respondendo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                    <button
                      onClick={saveGerenteForm}
                      className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
                      style={{ backgroundColor: COLORS.primary }}
                    >
                      <Save size={15} />
                      Salvar cadastro
                    </button>
                  </div>
                </div>

                {/* Tabela */}
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase" style={{ borderBottomColor: COLORS.border, color: COLORS.textLight }}>
                        <th className="px-3 py-2">Gerente</th>
                        <th className="px-3 py-2">Unidade</th>
                        <th className="px-3 py-2">Contato</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gerentes.map((gerente) => (
                        <tr key={gerente.id} className="border-b" style={{ borderBottomColor: COLORS.border }}>
                          <td className="px-3 py-3">
                            <span className="block font-semibold" style={{ color: COLORS.text }}>{gerente.nome}</span>
                            <span className="block text-xs" style={{ color: COLORS.textLight }}>{gerente.cargo}</span>
                          </td>
                          <td className="px-3 py-3" style={{ color: COLORS.text }}>{gerente.unidadeLocal}</td>
                          <td className="px-3 py-3 text-xs" style={{ color: COLORS.textLight }}>
                            <span className="block">{gerente.telefoneCorporativo || gerente.telefonePessoal || "-"}</span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset" style={{ backgroundColor: gerente.status === "inativo" ? "#F4F4F5" : "#ECFDF3", color: gerente.status === "inativo" ? COLORS.textLight : "#027A48" }}>
                              {GERENTE_STATUS_LABELS[gerente.status]}
                            </span>
                            {gerente.encerradoEm && <span className="mt-1 block text-xs" style={{ color: COLORS.textLight }}>Encerrado em {formatDateTime(gerente.encerradoEm)}</span>}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => editGerente(gerente)}
                                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-gray-100"
                                style={{ border: `1px solid ${COLORS.border}`, color: COLORS.primary }}
                              >
                                <Edit3 size={13} />
                                Editar
                              </button>
                              {gerente.status !== "inativo" && (
                                <button
                                  type="button"
                                  onClick={() => deactivateGerente(gerente.id)}
                                  className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-red-50"
                                  style={{ border: `1px solid ${COLORS.border}`, color: COLORS.danger }}
                                >
                                  <X size={13} />
                                  Inativar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Processos Pendentes */}
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
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(processo.id)}
                              onChange={() => toggle(processo.id)}
                              className="h-4 w-4 cursor-pointer"
                            />
                          </td>
                          <td
                            className="cursor-pointer px-3 py-3 font-semibold hover:underline"
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
                  <span>Página {page} de {totalPages} | {pendentes.length} processo(s)</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={page === 1}
                      onClick={() => setPage((curr) => Math.max(1, curr - 1))}
                      className="rounded-md px-3 py-1.5 font-semibold disabled:opacity-50 transition-colors hover:bg-gray-100"
                      style={{ border: `1px solid ${COLORS.border}` }}
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      disabled={page === totalPages}
                      onClick={() => setPage((curr) => Math.min(totalPages, curr + 1))}
                      className="rounded-md px-3 py-1.5 font-semibold disabled:opacity-50 transition-colors hover:bg-gray-100"
                      style={{ border: `1px solid ${COLORS.border}` }}
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Histórico */}
            <section className="rounded-lg border shadow-sm" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3" style={{ borderBottomColor: COLORS.border }}>
                <div>
                  <h2 className="text-base font-semibold" style={{ color: COLORS.primary }}>Histórico recente</h2>
                  <p className="text-xs" style={{ color: COLORS.textLight }}>Últimos memorandos analisados pelo gerente.</p>
                </div>
                {gerenteHistory.length > 10 && (
                  <button
                    type="button"
                    onClick={() => setShowFullHistory((curr) => !curr)}
                    className="rounded-md px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-gray-100"
                    style={{ border: `1px solid ${COLORS.border}`, color: COLORS.primary }}
                  >
                    {showFullHistory ? "Mostrar últimos 10" : "Ver histórico completo"}
                  </button>
                )}
              </div>

              <div className="grid gap-3 px-4 py-4">
                {visibleGerenteHistory.length > 0 ? visibleGerenteHistory.map((item) => (
                  <article key={item.id} className="rounded-lg border px-4 py-3 shadow-sm transition-all duration-300 hover:shadow-md" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
                    <button
                      type="button"
                      onClick={() => toggleHistoryMemo(item.id)}
                      className="flex w-full flex-wrap items-start justify-between gap-4 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getGerenteHistoryStatusClass(item.tipo)}`}>
                            {item.tipo === "aprovado" ? "Aprovado" : "Devolvido"}
                          </span>
                          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset" style={{ backgroundColor: "#F5F7F5", color: COLORS.primary }}>
                            {item.quantidade} {item.quantidade === 1 ? "processo" : "processos"}
                          </span>
                        </div>
                        <h3 className="mt-2 truncate text-base font-semibold uppercase tracking-wide" style={{ color: COLORS.primary }}>
                          Memorando {item.numero}
                        </h3>
                        <div className="mt-2 grid gap-1 text-sm font-medium" style={{ color: COLORS.textLight }}>
                          <span className="inline-flex items-center gap-2">
                            <Clock size={14} />
                            {formatDateTime(item.dataHora)}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <MapPin size={14} />
                            Unidade Local: {item.unidadeLocal || "-"}
                          </span>
                          {item.motivo && (
                            <span className="text-sm" style={{ color: COLORS.danger }}>
                              Motivo: {item.motivo}
                            </span>
                          )}
                          {item.codigoValidacao && (
                            <span className="text-sm font-semibold" style={{ color: COLORS.primary }}>
                              Código de validação: {item.codigoValidacao}
                            </span>
                          )}
                          {item.documentosAssinados?.length ? (
                            <span className="text-xs" style={{ color: COLORS.textLight }}>
                              Documentos: {item.documentosAssinados.join(", ")}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-[#F5F7F5]" style={{ color: COLORS.textLight }}>
                        {expandedHistoryMemoIds.includes(item.id) ? "Recolher" : "Ver produtores"}
                        <ChevronDown size={14} className={expandedHistoryMemoIds.includes(item.id) ? "rotate-180 transition-transform" : "transition-transform"} />
                      </span>
                    </button>

                    {expandedHistoryMemoIds.includes(item.id) && (
                      <div className="mt-4 overflow-hidden rounded-md border" style={{ borderColor: COLORS.border }}>
                        {item.produtores.map((produtor) => {
                          const processo = processos.find((curr) => curr.id === produtor.id);
                          return (
                            <button
                              key={produtor.id}
                              type="button"
                              onClick={() => {
                                if (processo) {
                                  setSelectedProcesso(processo);
                                  setActiveDetailTab("dados");
                                }
                              }}
                              className="flex w-full flex-wrap items-center justify-between gap-3 border-b px-3 py-2 text-left text-sm transition-colors last:border-b-0 hover:bg-[#F5F7F5]"
                              style={{ borderBottomColor: COLORS.border }}
                            >
                              <span className="min-w-0">
                                <span className="block truncate font-semibold" style={{ color: COLORS.text }}>{produtor.produtor}</span>
                                <span className="text-xs" style={{ color: COLORS.textLight }}>{produtor.cpf}</span>
                              </span>
                              <span className="text-xs font-semibold" style={{ color: COLORS.primary }}>
                                {TIPO_PROCESSO_LABELS[produtor.tipoProcesso]}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </article>
                )) : (
                  <div className="px-4 py-8 text-center text-sm" style={{ color: COLORS.textLight }}>Nenhuma decisão registrada ainda.</div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Signature Modal */}
      {signatureOpen && signatureGerente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-5">
          <div className="absolute inset-0 bg-black/45" onClick={() => setSignatureOpen(false)} />
          <div className="relative w-full max-w-2xl rounded-lg border shadow-2xl" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
            <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderBottomColor: COLORS.border }}>
              <div>
                <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Confirmar assinatura eletrônica</p>
                <h2 className="mt-1 text-base font-semibold" style={{ color: COLORS.primary }}>Assinar lote de documentos oficiais</h2>
              </div>
              <button type="button" onClick={() => setSignatureOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-gray-100" style={{ color: COLORS.textLight }}>
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
              <DetailInfoCard label="Gerente" value={signatureGerente.nome} />
              <DetailInfoCard label="Unidade Local" value={signatureUnidade} />
              <DetailInfoCard label="Memorando" value={signatureSummary.memorando} />
              <DetailInfoCard label="Status do responsável" value={GERENTE_STATUS_LABELS[signatureGerente.status]} />
              <DetailInfoCard label="Quantidade de processos" value={String(signatureSummary.quantidadeProcessos)} />
              <DetailInfoCard label="Quantidade de produtores" value={String(signatureSummary.quantidadeProdutores)} />
            </div>

            <div className="px-5 pb-4">
              <div className="rounded-md border p-4" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
                <p className="mb-2 text-sm font-semibold" style={{ color: COLORS.text }}>Documentos que serão assinados</p>
                <div className="flex flex-wrap gap-2">
                  {signatureSummary.documentos.map((documento) => (
                    <span key={documento} className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: COLORS.card, color: COLORS.primary, border: `1px solid ${COLORS.border}` }}>
                      {documento}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t px-5 py-4" style={{ borderTopColor: COLORS.border }}>
              <button type="button" onClick={() => setSignatureOpen(false)} className="rounded-md px-3 py-2 text-sm font-semibold transition-colors hover:bg-gray-100" style={{ border: `1px solid ${COLORS.border}`, color: COLORS.text }}>
                Cancelar
              </button>
              <button type="button" onClick={confirmSignature} className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90" style={{ backgroundColor: COLORS.primary }}>
                <FileSignature size={15} />
                Assinar documentos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Return Modal */}
      {batchReturnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-5">
          <div className="absolute inset-0 bg-black/45" onClick={() => setBatchReturnOpen(false)} />
          <div className="relative w-full max-w-xl rounded-lg border shadow-2xl" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
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
                <div className="flex items-start gap-2 rounded-md border px-3 py-2 text-sm font-medium" style={{ backgroundColor: "#FEF3F2", borderColor: "#FCA5A5", color: COLORS.danger }}>
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <span>{batchError}</span>
                </div>
              )}
              <label className="block text-sm font-semibold" style={{ color: COLORS.text }}>
                Motivo da devolução
                <textarea
                  value={batchJustificativa}
                  onChange={(e) => {
                    setBatchJustificativa(e.target.value);
                    if (batchError) setBatchError("");
                  }}
                  placeholder="Informe a justificativa obrigatória para devolver os processos selecionados."
                  rows={4}
                  className="mt-2 w-full rounded-md border px-3 py-2 text-sm font-normal outline-none focus:ring-1 focus:ring-green-500"
                  style={{ borderColor: COLORS.border }}
                />
              </label>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t px-5 py-4" style={{ borderTopColor: COLORS.border }}>
              <button type="button" onClick={() => setBatchReturnOpen(false)} className="rounded-md px-3 py-2 text-sm font-semibold transition-colors hover:bg-gray-100" style={{ border: `1px solid ${COLORS.border}`, color: COLORS.text }}>
                Cancelar
              </button>
              <button type="button" onClick={confirmBatchReturn} className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90" style={{ backgroundColor: COLORS.danger }}>
                <RotateCcw size={15} />
                Confirmar devolução
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Process Details Modal */}
      {selectedProcesso && (
        <GerenteProcessDetailsModal
          processo={selectedProcesso}
          activeTab={activeDetailTab}
          selected={selectedIds.includes(selectedProcesso.id)}
          justificativa={justificativas[selectedProcesso.id] || ""}
          onTabChange={setActiveDetailTab}
          onClose={() => setSelectedProcesso(null)}
          onJustificativaChange={(value: string) =>
            setJustificativas({ ...justificativas, [selectedProcesso.id]: value })
          }
          onToggleSelected={toggle}
          onDevolver={devolverSelected}
          onPreview={setPreview}
        />
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-5">
          <div className="absolute inset-0 bg-black/45" onClick={() => setPreview(null)} />
          <div className="relative flex h-[90vh] w-[90vw] max-w-7xl flex-col overflow-hidden rounded-lg border shadow-2xl" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
            <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderBottomColor: COLORS.border }}>
              <div>
                <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>
                  {preview.tipo === "gerado" ? "Modelo gerado automaticamente" : "Anexo enviado pela Unidade Local"}
                </p>
                <h2 className="mt-1 text-lg font-semibold" style={{ color: COLORS.primary }}>
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
