"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Layers,
  RefreshCw,
  ShieldCheck,
  UserCog,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Sidebar from "@/app/_components/layout/Sidebar";
import StyledSelect from "@/app/_components/StyledSelect";
import { DocumentPreviewViewer } from "@/app/_features/fluxo/SharedUi";
import { useAuthSession } from "@/app/_hooks/useAuthSession";
import { isAdminUser } from "@/app/_lib/auth";
import { apiJson } from "@/app/_lib/http";
import { UNLOC_OPTIONS } from "@/app/_lib/unlocs";
import { dashboardApi } from "@/app/(pages)/dashboard/lib/api";
import type { DashboardStats, Relatorio, TopCategoria } from "@/app/(pages)/dashboard/lib/types";

const COLORS = {
  background: "#F5F7F5",
  primary: "#2D452F",
  primarySoft: "#EEF5EC",
  green: "#4F7F39",
  card: "#FFFFFF",
  text: "#1A2E1B",
  textLight: "#6B7C6A",
  border: "#E2E8E0",
  danger: "#B42318",
};

const PERIODO_OPTIONS = [
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "month", label: "Mês atual" },
  { value: "custom", label: "Período personalizado" },
];

const STATUS_OPTIONS = [
  { value: "todos", label: "Todos" },
  { value: "em_elaboracao", label: "Em elaboração" },
  { value: "encaminhado_gerente", label: "Aguardando gerente" },
  { value: "em_analise", label: "Em análise" },
  { value: "aprovado_lancamento", label: "Aguardando lançamento" },
  { value: "concluido", label: "Concluídos" },
  { value: "devolvidos", label: "Devolvidos" },
];

const REPORT_GROUP_OPTIONS = [
  { value: "fluxo", label: "Processos e fluxo" },
  { value: "unidades", label: "Unidades locais" },
  { value: "usuarios", label: "Usuários e segurança" },
  { value: "documentos", label: "Documentos e carteiras" },
];

type ReportDefinition = {
  id: string;
  nome: string;
  descricao: string;
  grupo: string;
  fonte: string;
  icon: LucideIcon;
};

const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    id: "processos_situacao",
    nome: "Processos por situação",
    descricao: "Quantitativo por etapa do fluxo, gargalos e pendências.",
    grupo: "fluxo",
    fonte: "Dashboard operacional",
    icon: BarChart3,
  },
  {
    id: "processos_devolvidos",
    nome: "Processos devolvidos",
    descricao: "Acompanhamento de correções, retorno de etapas e retrabalho.",
    grupo: "fluxo",
    fonte: "Análises e lançamentos",
    icon: RefreshCw,
  },
  {
    id: "tempo_por_etapa",
    nome: "Tempo por etapa",
    descricao: "Tempo médio de permanência em gerente, análise e lançamento.",
    grupo: "fluxo",
    fonte: "Histórico do fluxo",
    icon: CalendarDays,
  },
  {
    id: "produtores_cadastrados",
    nome: "Produtores cadastrados",
    descricao: "Volume de produtores por período, unidade local e situação cadastral.",
    grupo: "fluxo",
    fonte: "Cadastro de produtores",
    icon: ClipboardList,
  },
  {
    id: "produtividade_operacional",
    nome: "Produtividade operacional",
    descricao: "Visão por etapa, unidade local e volume de atendimento.",
    grupo: "unidades",
    fonte: "Unidade local",
    icon: Layers,
  },
  {
    id: "unidades_tecnicos",
    nome: "Unidades locais por técnico",
    descricao: "Acompanhamento por responsável técnico e unidade vinculada.",
    grupo: "unidades",
    fonte: "Usuários e processos",
    icon: UserCog,
  },
  {
    id: "volume_por_unidade",
    nome: "Volume por unidade local",
    descricao: "Comparativo de processos por unidade local e status.",
    grupo: "unidades",
    fonte: "Processos por unidade",
    icon: BarChart3,
  },
  {
    id: "pendencias_por_tecnico",
    nome: "Pendências por técnico",
    descricao: "Processos parados, devolvidos ou aguardando correção por responsável.",
    grupo: "unidades",
    fonte: "Unidade local",
    icon: UserCog,
  },
  {
    id: "usuarios_acessos",
    nome: "Usuários e acessos",
    descricao: "Usuários ativos, bloqueados, perfis e presença recente.",
    grupo: "usuarios",
    fonte: "Controle de usuários",
    icon: Users,
  },
  {
    id: "seguranca_sistema",
    nome: "Segurança do sistema",
    descricao: "Resumo para auditoria: acessos, bloqueios e eventos relevantes.",
    grupo: "usuarios",
    fonte: "Auditoria",
    icon: ShieldCheck,
  },
  {
    id: "auditoria_por_usuario",
    nome: "Auditoria por usuário",
    descricao: "Eventos registrados por usuário, ação, data e resultado.",
    grupo: "usuarios",
    fonte: "Auditoria",
    icon: ShieldCheck,
  },
  {
    id: "bloqueios_acesso",
    nome: "Bloqueios e acessos negados",
    descricao: "Tentativas sem permissão, usuários bloqueados e eventos críticos.",
    grupo: "usuarios",
    fonte: "Segurança",
    icon: ShieldCheck,
  },
  {
    id: "carteiras_emitidas",
    nome: "Carteiras emitidas",
    descricao: "Quantidade emitida, volume por período e acompanhamento documental.",
    grupo: "documentos",
    fonte: "Carteira digital",
    icon: FileText,
  },
  {
    id: "memorandos_emitidos",
    nome: "Memorandos emitidos",
    descricao: "Memorandos criados, movimentados e assinados no período.",
    grupo: "documentos",
    fonte: "Memorandos",
    icon: ClipboardList,
  },
  {
    id: "documentos_gerados",
    nome: "FACs e declarações geradas",
    descricao: "Documentos gerados, pendentes de assinatura e anexos enviados.",
    grupo: "documentos",
    fonte: "Unidade local",
    icon: FileText,
  },
  {
    id: "carteiras_pendentes",
    nome: "Carteiras pendentes",
    descricao: "Processos aprovados que ainda não tiveram carteira emitida.",
    grupo: "documentos",
    fonte: "Carteira digital",
    icon: ShieldCheck,
  },
];

type GeneratedReport = {
  definition: ReportDefinition;
  filtros: ReportFilters;
};

type ReportFilters = {
  periodo: string;
  inicio: string;
  fim: string;
  escopo: string;
  status: string;
};

type ReportPreview = {
  title: string;
  description: string;
  icon: LucideIcon;
  metrics: { label: string; value: string }[];
  rows: { label: string; value: number; percent: number }[];
};

type ReportSummaryResponse = {
  stats: DashboardStats;
  categorias: TopCategoria[];
  inicio: string;
  fim: string;
  escopo: string;
  status: string;
};

export default function RelatoriosPage() {
  const { username, role, unidadeLocal, logout, ready } = useAuthSession({
    defaultUsername: "Gerente",
    allowedRoles: ["ADMIN", "GERENTE"],
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [categorias, setCategorias] = useState<TopCategoria[]>([]);
  const [periodo, setPeriodo] = useState("30");
  const [status, setStatus] = useState("todos");
  const [escopo, setEscopo] = useState("todas");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [grupo, setGrupo] = useState("fluxo");
  const [selectedReportId, setSelectedReportId] = useState("processos_situacao");
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const normalizedRole = (role || "").trim().toUpperCase().replace(/^ROLE_/, "");
  const canAccessReports = isAdminUser(username, role) || normalizedRole.includes("GERENTE") || normalizedRole === "CHEFE";
  const canChooseReportScope = isAdminUser(username, role) || normalizedRole === "ADMIN";
  const scopeOptions = useMemo(
    () => canChooseReportScope
      ? [
          { value: "todas", label: "Todas as unidades" },
          ...UNLOC_OPTIONS.map((option) => ({ value: option.municipio, label: option.label })),
        ]
      : [{ value: unidadeLocal || "minha_unidade", label: unidadeLocal || "Minha unidade" }],
    [canChooseReportScope, unidadeLocal],
  );

  const filtrosAtuais = useMemo<ReportFilters>(() => ({
    periodo,
    inicio,
    fim,
    escopo: canChooseReportScope ? escopo : unidadeLocal || "minha_unidade",
    status,
  }), [canChooseReportScope, escopo, fim, inicio, periodo, status, unidadeLocal]);

  const carregarDados = useCallback(() => {
    if (!ready || !canAccessReports) return;
    if (periodo === "custom" && (inicio.length < 10 || fim.length < 10)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    void Promise.all([
      dashboardApi.getRelatorios(),
      getRelatorioResumo(filtrosAtuais),
    ])
      .then(([relatoriosResponse, resumoResponse]) => {
        setRelatorios(relatoriosResponse);
        setStats(resumoResponse.stats);
        setCategorias(resumoResponse.categorias);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Não foi possível carregar os relatórios."))
      .finally(() => setLoading(false));
  }, [canAccessReports, filtrosAtuais, fim.length, inicio.length, periodo, ready]);

  useEffect(() => {
    if (!ready || !canAccessReports) return;
    if (periodo === "custom" && (inicio.length < 10 || fim.length < 10)) return;

    let active = true;

    void Promise.all([
      dashboardApi.getRelatorios(),
      getRelatorioResumo(filtrosAtuais),
    ])
      .then(([relatoriosResponse, resumoResponse]) => {
        if (!active) return;
        setRelatorios(relatoriosResponse);
        setStats(resumoResponse.stats);
        setCategorias(resumoResponse.categorias);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Não foi possível carregar os relatórios.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [canAccessReports, filtrosAtuais, fim.length, inicio.length, periodo, ready]);

  const reportsByGroup = useMemo(
    () => REPORT_DEFINITIONS.filter((report) => report.grupo === grupo),
    [grupo],
  );

  const selectedReport = useMemo(
    () => REPORT_DEFINITIONS.find((report) => report.id === selectedReportId) ?? REPORT_DEFINITIONS[0],
    [selectedReportId],
  );

  const resumo = useMemo(() => {
    if (!stats) return [];
    return [
      { label: "Processos no fluxo", value: stats.totalProcessosFluxo, icon: Layers },
      { label: "Em análise", value: stats.processosAnalise, icon: ClipboardList },
      { label: "Aguardando lançamento", value: stats.processosLancamento, icon: CalendarDays },
      { label: "Concluídos", value: stats.processosConcluidos, icon: CheckCircle2 },
      { label: "Devolvidos", value: stats.processosDevolvidos, icon: RefreshCw },
      { label: "Carteiras emitidas", value: stats.totalCartoes, icon: ShieldCheck },
    ];
  }, [stats]);
  const filteredCategorias = useMemo(
    () => filterCategoriasByStatus(categorias, status),
    [categorias, status],
  );
  const filteredTotal = filteredCategorias.reduce((total, categoria) => total + categoria.total, 0);
  const selectedScopeLabel = formatScopeLabel(canChooseReportScope ? escopo : unidadeLocal || "minha_unidade");

  const reportPreview = useMemo(
    () => stats ? buildReportPreview(selectedReport, stats, filteredCategorias, filtrosAtuais) : null,
    [filteredCategorias, filtrosAtuais, selectedReport, stats],
  );

  const exportarResumoCsv = () => {
    if (!stats) return;

    const linhas = [
      ["Relatório", "Valor"],
      ["Processos no fluxo", stats.totalProcessosFluxo],
      ["Em elaboração", stats.processosEmElaboracao],
      ["Aguardando gerente", stats.processosGerente],
      ["Em análise", stats.processosAnalise],
      ["Aguardando lançamento", stats.processosLancamento],
      ["Concluídos", stats.processosConcluidos],
      ["Devolvidos", stats.processosDevolvidos],
      ["Carteiras emitidas", stats.totalCartoes],
      ["Memorandos", stats.totalMemorandos],
      ["Usuários ativos", stats.usuariosAtivos],
      ...categorias.map((categoria) => [`Situação - ${categoria.nome}`, categoria.total]),
    ];

    const csv = linhas.map((linha) => linha.map((valor) => `"${String(valor).replaceAll("\"", "\"\"")}"`).join(";")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SICPR-IDAM-RESUMO-GERENCIAL-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const gerarRelatorio = () => {
    setGeneratedReport({
      definition: selectedReport,
      filtros: filtrosAtuais,
    });
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: COLORS.background }}>
        <div className="h-8 w-8 animate-spin rounded-full border-b-2" style={{ borderBottomColor: COLORS.primary }} />
      </div>
    );
  }

  if (!canAccessReports) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
        <Sidebar
          onLogout={logout}
          username={username || "Usuário"}
          role={role}
          onCollapsedChange={setSidebarCollapsed}
        />

        <main className="min-h-screen transition-all duration-300" style={{ marginLeft: sidebarCollapsed ? "72px" : "260px" }}>
          <div className="flex min-h-screen items-center justify-center px-4 py-8">
            <section className="w-full max-w-xl rounded-md border bg-white p-8 text-center shadow-sm" style={{ borderColor: COLORS.border }}>
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-md" style={{ backgroundColor: COLORS.primarySoft, color: COLORS.primary }}>
                <ShieldCheck size={26} />
              </span>
              <h1 className="mt-4 text-xl font-bold" style={{ color: COLORS.primary }}>Acesso restrito</h1>
              <p className="mt-2 text-sm leading-6" style={{ color: COLORS.textLight }}>
                A área de relatórios é exclusiva para administradores e gerentes. Técnicos e usuários devem usar as telas operacionais vinculadas às suas permissões.
              </p>
            </section>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
      <Sidebar
        onLogout={logout}
        username={username || "Gerente"}
        role={role}
        onCollapsedChange={setSidebarCollapsed}
      />

      <main className="min-h-screen transition-all duration-300" style={{ marginLeft: sidebarCollapsed ? "72px" : "260px" }}>
        <div className="px-4 py-8 sm:px-6 lg:px-8">
          <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.textLight }}>
                Gestão e acompanhamento
              </p>
              <h1 className="mt-1 text-2xl font-bold" style={{ color: COLORS.primary }}>Relatórios</h1>
              <p className="mt-1 max-w-3xl text-sm" style={{ color: COLORS.textLight }}>
                Gere relatórios por período, unidade local, situação, usuários, segurança e documentos do fluxo.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={carregarDados}
                className="inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition hover:bg-white"
                style={{ borderColor: COLORS.border, color: COLORS.primary }}
              >
                <RefreshCw size={16} />
                Atualizar
              </button>
              <button
                type="button"
                onClick={exportarResumoCsv}
                disabled={!stats}
                className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: COLORS.primary }}
              >
                <Download size={16} />
                Baixar resumo CSV
              </button>
            </div>
          </header>

          {error && (
            <div className="mb-4 rounded-md border px-4 py-3 text-sm font-medium" style={{ borderColor: "#FCA5A5", backgroundColor: "#FEF3F2", color: COLORS.danger }}>
              {error}
            </div>
          )}

          <section className="mb-5 rounded-md border p-4" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
            <div className="mb-4 flex items-center gap-2">
              <FileText size={18} style={{ color: COLORS.primary }} />
              <h2 className="font-semibold" style={{ color: COLORS.text }}>Gerar relatório</h2>
            </div>

            <div className="grid gap-3 xl:grid-cols-[1fr_1.35fr_1fr_1fr]">
              <ReportFilter label="Grupo">
                <StyledSelect
                  value={grupo}
                  onChange={(value) => {
                    setGrupo(value);
                    setSelectedReportId(REPORT_DEFINITIONS.find((report) => report.grupo === value)?.id ?? REPORT_DEFINITIONS[0].id);
                  }}
                  options={REPORT_GROUP_OPTIONS}
                  colors={selectColors}
                />
              </ReportFilter>
              <ReportFilter label="Tipo de relatório">
                <StyledSelect
                  value={selectedReportId}
                  onChange={setSelectedReportId}
                  options={reportsByGroup.map((report) => ({ value: report.id, label: report.nome }))}
                  colors={selectColors}
                />
              </ReportFilter>
              <ReportFilter label="Período">
                <StyledSelect value={periodo} onChange={setPeriodo} options={PERIODO_OPTIONS} colors={selectColors} />
              </ReportFilter>
              <ReportFilter label="Situação">
                <StyledSelect value={status} onChange={setStatus} options={STATUS_OPTIONS} colors={selectColors} />
              </ReportFilter>
            </div>

            <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_1fr_1fr_auto]">
              {periodo === "custom" ? (
                <>
                  <ReportDateInput label="Início" value={inicio} onChange={setInicio} />
                  <ReportDateInput label="Fim" value={fim} onChange={setFim} />
                </>
              ) : (
                <div className="hidden xl:block" />
              )}
              <ReportFilter label="Escopo">
                <StyledSelect
                  value={canChooseReportScope ? escopo : unidadeLocal || "minha_unidade"}
                  onChange={setEscopo}
                  options={scopeOptions}
                  disabled={!canChooseReportScope}
                  colors={selectColors}
                />
              </ReportFilter>
              <button
                type="button"
                onClick={gerarRelatorio}
                disabled={loading || !stats}
                className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: COLORS.primary }}
              >
                <FileText size={16} />
                Gerar relatório
              </button>
            </div>

            <div className="mt-4 rounded-md border p-3" style={{ borderColor: COLORS.border, backgroundColor: COLORS.primarySoft }}>
              <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{selectedReport.nome}</p>
              <p className="mt-1 text-sm" style={{ color: COLORS.textLight }}>{selectedReport.descricao}</p>
            </div>
          </section>

          <section className="mb-5 rounded-md border p-4" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold" style={{ color: COLORS.text }}>Resumo da consulta</h2>
                <p className="text-sm" style={{ color: COLORS.textLight }}>
                  Prévia dos dados conforme o grupo, tipo e filtros selecionados.
                </p>
              </div>
              <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: COLORS.primarySoft, color: COLORS.primary }}>
                {selectedReport.nome}
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <SummaryPill label="Período" value={formatPeriodo(filtrosAtuais)} />
              <SummaryPill label="Escopo" value={selectedScopeLabel} />
              <SummaryPill label="Situação" value={STATUS_OPTIONS.find((option) => option.value === status)?.label ?? "Todos"} />
              <SummaryPill label="Total no recorte" value={formatNumber(getReportTotal(selectedReport, stats, filteredTotal))} />
            </div>
          </section>

          <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {loading && resumo.length === 0 ? (
              Array.from({ length: 6 }).map((_, index) => <SummarySkeleton key={index} />)
            ) : (
              resumo.map((item) => <SummaryCard key={item.label} {...item} />)
            )}
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
            {reportPreview ? (
              <ContextualReportPanel preview={reportPreview} loading={loading} />
            ) : (
              <section className="rounded-md border p-4" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
                <SummarySkeleton />
              </section>
            )}

            <section className="rounded-md border p-4" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
              <h2 className="font-semibold" style={{ color: COLORS.text }}>Relatórios relacionados</h2>
              <p className="mt-1 text-sm" style={{ color: COLORS.textLight }}>
                Outras consultas do mesmo grupo selecionado.
              </p>
              <div className="mt-4 space-y-2">
                {reportsByGroup.map((relatorio) => (
                  <button
                    key={relatorio.id}
                    type="button"
                    onClick={() => setSelectedReportId(relatorio.id)}
                    className="w-full rounded-md border p-3 text-left transition hover:bg-[#F5F7F5]"
                    style={{
                      borderColor: relatorio.id === selectedReportId ? COLORS.green : COLORS.border,
                      backgroundColor: relatorio.id === selectedReportId ? COLORS.primarySoft : COLORS.card,
                    }}
                  >
                    <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{relatorio.nome}</p>
                    <p className="mt-1 text-xs" style={{ color: COLORS.textLight }}>{relatorio.fonte}</p>
                  </button>
                ))}
              </div>
              <div className="mt-4 rounded-md border p-3" style={{ borderColor: COLORS.border, backgroundColor: "#FAFCFA" }}>
                <p className="text-xs font-bold uppercase" style={{ color: COLORS.textLight }}>Fonte atual</p>
                <p className="mt-1 text-sm font-semibold" style={{ color: COLORS.text }}>{selectedReport.fonte}</p>
                <p className="mt-2 text-xs leading-5" style={{ color: COLORS.textLight }}>
                  Na integração com o PostgreSQL, este relatório deve buscar dados já filtrados por período, unidade, situação e responsável.
                </p>
              </div>
              {relatorios.length > 0 && (
                <p className="mt-3 text-xs" style={{ color: COLORS.textLight }}>
                  {formatNumber(relatorios.length)} fonte(s) gerenciais disponíveis pelo backend.
                </p>
              )}
            </section>
          </section>
        </div>
      </main>

      {generatedReport && stats && (
        <ReportPreviewModal
          report={generatedReport}
          stats={stats}
          categorias={filteredCategorias}
          emissor={username || "Usuário"}
          onClose={() => setGeneratedReport(null)}
        />
      )}
    </div>
  );
}

const selectColors = {
  accent: COLORS.green,
  border: COLORS.border,
  inputBg: COLORS.card,
  card: COLORS.card,
  text: COLORS.text,
  textLight: COLORS.textLight,
  hoverBg: COLORS.primarySoft,
};

function ReportFilter({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>{label}</span>
      {children}
    </label>
  );
}

function ReportDateInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>{label}</span>
      <input
        inputMode="numeric"
        placeholder="dd/mm/aaaa"
        value={value}
        onChange={(event) => onChange(formatDateInput(event.target.value))}
        className="min-h-11 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:ring-2"
        style={{ borderColor: COLORS.border, color: COLORS.text, backgroundColor: COLORS.card }}
        maxLength={10}
      />
    </label>
  );
}

function SummaryCard({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return (
    <article className="rounded-md border px-3 py-3" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>{label}</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: COLORS.primary }}>{formatNumber(value)}</p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: COLORS.primarySoft, color: COLORS.primary }}>
          <Icon size={18} />
        </span>
      </div>
    </article>
  );
}

function SummarySkeleton() {
  return (
    <div className="h-24 animate-pulse rounded-md border" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }} />
  );
}

function ContextualReportPanel({ preview, loading }: { preview: ReportPreview; loading: boolean }) {
  const Icon = preview.icon;

  return (
    <section className="rounded-md border p-4" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: COLORS.primarySoft, color: COLORS.primary }}>
            <Icon size={19} />
          </span>
          <div>
            <h2 className="font-semibold" style={{ color: COLORS.text }}>{preview.title}</h2>
            <p className="mt-1 text-sm" style={{ color: COLORS.textLight }}>{preview.description}</p>
          </div>
        </div>
        {loading && (
          <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: COLORS.primarySoft, color: COLORS.primary }}>
            Atualizando
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        {preview.metrics.map((metric) => (
          <div key={metric.label} className="rounded-md border px-3 py-2" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
            <p className="text-[11px] font-bold uppercase" style={{ color: COLORS.textLight }}>{metric.label}</p>
            <p className="mt-1 text-lg font-bold" style={{ color: COLORS.primary }}>{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {preview.rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span style={{ color: COLORS.text }}>{row.label}</span>
              <span style={{ color: COLORS.textLight }}>{formatNumber(row.value)} | {row.percent}%</span>
            </div>
            <div className="h-2 rounded-full" style={{ backgroundColor: COLORS.primarySoft }}>
              <div className="h-2 rounded-full" style={{ width: `${row.percent}%`, backgroundColor: COLORS.green }} />
            </div>
          </div>
        ))}
        {preview.rows.length === 0 && (
          <p className="rounded-md border p-4 text-sm" style={{ borderColor: COLORS.border, color: COLORS.textLight }}>
            Sem dados para este recorte. Ajuste os filtros ou gere o relatório para conferir o documento.
          </p>
        )}
      </div>
    </section>
  );
}

function ReportPreviewModal({
  report,
  stats,
  categorias,
  emissor,
  onClose,
}: {
  report: GeneratedReport;
  stats: DashboardStats;
  categorias: TopCategoria[];
  emissor: string;
  onClose: () => void;
}) {
  const fileName = buildReportFileName(report.definition.nome);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const imprimirRelatorio = () => {
    const source = document.getElementById("relatorio-print-document");
    const originalTitle = document.title;
    document.title = fileName;

    const restoreTitle = () => {
      document.title = originalTitle;
    };

    if (!source) {
      window.print();
      restoreTitle();
      return;
    }

    const clone = source.cloneNode(true);
    const container = document.createElement("div");
    container.className = "sicpr-print-clone";
    container.appendChild(clone);
    document.body.appendChild(container);
    document.body.classList.add("sicpr-printing-document");
    document.body.classList.add("sicpr-printing-report");

    window.setTimeout(() => {
      window.print();
      document.body.classList.remove("sicpr-printing-document");
      document.body.classList.remove("sicpr-printing-report");
      container.remove();
      restoreTitle();
    }, 50);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 py-5">
      <div className="absolute inset-0 bg-black/55" onClick={onClose} />
      <div className="relative flex h-[90vh] w-[90vw] max-w-7xl flex-col overflow-hidden rounded-lg border bg-white shadow-2xl" style={{ borderColor: COLORS.border }}>
        <header className="flex items-center justify-between gap-3 border-b px-5 py-4" style={{ borderColor: COLORS.border }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.textLight }}>Prévia do relatório</p>
            <h2 className="text-lg font-semibold" style={{ color: COLORS.text }}>{report.definition.nome}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={imprimirRelatorio}
              className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold text-white"
              style={{ backgroundColor: COLORS.primary }}
            >
              <Download size={16} />
              Salvar PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border"
              style={{ borderColor: COLORS.border, color: COLORS.primary }}
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 overflow-hidden p-4">
          <DocumentPreviewViewer title="Documento do relatório">
            <ReportDocument report={report} stats={stats} categorias={categorias} emissor={emissor} />
          </DocumentPreviewViewer>
        </div>
      </div>
    </div>
  );
}

function ReportDocument({
  report,
  stats,
  categorias,
  emissor,
}: {
  report: GeneratedReport;
  stats: DashboardStats;
  categorias: TopCategoria[];
  emissor: string;
}) {
  const periodo = formatPeriodo(report.filtros);
  const status = STATUS_OPTIONS.find((option) => option.value === report.filtros.status)?.label ?? "Todos";
  const escopo = formatScopeLabel(report.filtros.escopo);
  const hoje = new Intl.DateTimeFormat("pt-BR").format(new Date());

  return (
    <article
      id="relatorio-print-document"
      className="sicpr-print-document sicpr-report-document mx-auto w-[196mm] bg-white px-[11mm] py-[9mm] text-sm shadow"
      style={{ color: "#16251A" }}
    >
      <header className="border-b pb-6" style={{ borderColor: COLORS.border }}>
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/LogoGovAm.png" alt="Governo do Amazonas" className="sicpr-report-logo h-24 w-auto object-contain" />
          </div>
          <p className="pt-8 text-right text-sm font-semibold">{`Manaus - AM, ${hoje}.`}</p>
        </div>
        <div className="mt-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: COLORS.primary }}>SICPR / IDAM</p>
          <h1 className="mt-3 text-2xl font-bold uppercase">Relatório gerencial</h1>
          <h2 className="mt-2 text-lg font-semibold">{report.definition.nome}</h2>
        </div>
      </header>

      <main className="pt-7">

          <section className="rounded-md border p-4" style={{ borderColor: COLORS.border }}>
            <h3 className="text-sm font-bold uppercase" style={{ color: COLORS.primary }}>Filtros utilizados</h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <ReportDocumentField label="Período" value={periodo} />
              <ReportDocumentField label="Situação" value={status} />
              <ReportDocumentField label="Escopo" value={escopo} />
              <ReportDocumentField label="Fonte" value={report.definition.fonte} />
            </div>
          </section>

          <section className="mt-6">
            <h3 className="text-sm font-bold uppercase" style={{ color: COLORS.primary }}>Resumo dos indicadores</h3>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <ReportMetric label="Processos no fluxo" value={stats.totalProcessosFluxo} />
              <ReportMetric label="Em análise" value={stats.processosAnalise} />
              <ReportMetric label="Aguardando lançamento" value={stats.processosLancamento} />
              <ReportMetric label="Concluídos" value={stats.processosConcluidos} />
              <ReportMetric label="Devolvidos" value={stats.processosDevolvidos} />
              <ReportMetric label="Carteiras emitidas" value={stats.totalCartoes} />
            </div>
          </section>

          <section className="mt-6">
            <h3 className="text-sm font-bold uppercase" style={{ color: COLORS.primary }}>Processos por situação</h3>
            <table className="mt-3 w-full border-collapse text-left text-xs">
              <thead>
                <tr style={{ backgroundColor: COLORS.primarySoft }}>
                  <th className="border px-3 py-2" style={{ borderColor: COLORS.border }}>Situação</th>
                  <th className="border px-3 py-2 text-right" style={{ borderColor: COLORS.border }}>Quantidade</th>
                  <th className="border px-3 py-2 text-right" style={{ borderColor: COLORS.border }}>Percentual</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map((categoria) => {
                  const total = stats.totalProcessosFluxo;
                  const percent = total > 0 ? Math.round((categoria.total / total) * 100) : 0;
                  return (
                    <tr key={categoria.nome}>
                      <td className="border px-3 py-2" style={{ borderColor: COLORS.border }}>{categoria.nome}</td>
                      <td className="border px-3 py-2 text-right" style={{ borderColor: COLORS.border }}>{formatNumber(categoria.total)}</td>
                      <td className="border px-3 py-2 text-right" style={{ borderColor: COLORS.border }}>{percent}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          <footer className="mt-8 rounded-md border p-4 text-xs" style={{ borderColor: COLORS.border, backgroundColor: "#FAFCFA" }}>
            <p className="font-bold uppercase" style={{ color: COLORS.primary }}>Certificação do sistema</p>
            <p className="mt-2 leading-5">
              Documento gerado eletronicamente pelo SICPR / IDAM em {new Intl.DateTimeFormat("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date())}, por {emissor}. A autenticidade operacional deste relatório está vinculada aos registros do sistema.
            </p>
          </footer>
      </main>
    </article>
  );
}

function ReportDocumentField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase" style={{ color: COLORS.textLight }}>{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function ReportMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-3" style={{ borderColor: COLORS.border }}>
      <p className="text-[10px] font-bold uppercase" style={{ color: COLORS.textLight }}>{label}</p>
      <p className="mt-1 text-xl font-bold" style={{ color: COLORS.primary }}>{formatNumber(value)}</p>
    </div>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border px-3 py-2" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
      <p className="text-[11px] font-bold uppercase" style={{ color: COLORS.textLight }}>{label}</p>
      <p className="mt-1 truncate text-sm font-semibold" style={{ color: COLORS.text }}>{value}</p>
    </div>
  );
}

function filterCategoriasByStatus(categorias: TopCategoria[], status: string) {
  if (status === "todos") return categorias;
  const termsByStatus: Record<string, string[]> = {
    em_elaboracao: ["elaboracao", "elaboração"],
    encaminhado_gerente: ["gerente"],
    em_analise: ["analise", "análise"],
    aprovado_lancamento: ["lancamento", "lançamento"],
    concluido: ["concluido", "concluídos", "concluidos"],
    devolvidos: ["devolvido", "devolvidos"],
  };
  const terms = termsByStatus[status] ?? [];
  return categorias.filter((categoria) => {
    const normalized = normalizeText(categoria.nome);
    return terms.some((term) => normalized.includes(normalizeText(term)));
  });
}

function getRelatorioResumo(filtros: ReportFilters) {
  const params = new URLSearchParams({
    periodo: filtros.periodo,
    escopo: filtros.escopo,
    status: filtros.status,
  });

  if (filtros.periodo === "custom") {
    params.set("inicio", filtros.inicio);
    params.set("fim", filtros.fim);
  }

  return apiJson<ReportSummaryResponse>(`/relatorios/resumo?${params.toString()}`);
}

function buildReportPreview(
  report: ReportDefinition,
  stats: DashboardStats,
  categorias: TopCategoria[],
  filtros: ReportFilters,
): ReportPreview {
  const rows = buildCategoryRows(categorias, stats.totalProcessosFluxo);
  const scopeLabel = formatScopeLabel(filtros.escopo);
  const unitCount = filtros.escopo === "todas" ? UNLOC_OPTIONS.length : 1;

  if (report.grupo === "usuarios") {
    return {
      title: "Resumo de usuários e segurança",
      description: `Leitura rápida para ${scopeLabel.toLowerCase()} com foco em acessos, perfis e bloqueios.`,
      icon: Users,
      metrics: [
        { label: "Total usuários", value: formatNumber(stats.totalUsuarios) },
        { label: "Ativos", value: formatNumber(stats.usuariosAtivos) },
        { label: "Bloqueados", value: formatNumber(stats.usuariosBloqueados) },
        { label: "Online", value: formatNumber(stats.usuariosOnline) },
      ],
      rows: [
        percentageRow("Usuários ativos", stats.usuariosAtivos, stats.totalUsuarios),
        percentageRow("Usuários bloqueados", stats.usuariosBloqueados, stats.totalUsuarios),
        percentageRow("Usuários offline", stats.usuariosOffline, stats.totalUsuarios),
      ],
    };
  }

  if (report.grupo === "documentos") {
    const totalDocumentos = stats.totalCartoes + stats.totalMemorandos;
    return {
      title: "Resumo documental",
      description: `Visão dos documentos e emissões considerados no relatório ${report.nome.toLowerCase()}.`,
      icon: FileText,
      metrics: [
        { label: "Carteiras", value: formatNumber(stats.totalCartoes) },
        { label: "Carteiras hoje", value: formatNumber(stats.cartoesHoje) },
        { label: "Memorandos", value: formatNumber(stats.totalMemorandos) },
        { label: "Memorandos hoje", value: formatNumber(stats.memorandosHoje) },
      ],
      rows: [
        percentageRow("Carteiras emitidas", stats.totalCartoes, totalDocumentos),
        percentageRow("Memorandos emitidos", stats.totalMemorandos, totalDocumentos),
        percentageRow("Processos concluídos", stats.processosConcluidos, stats.totalProcessosFluxo),
      ],
    };
  }

  if (report.grupo === "unidades") {
    return {
      title: "Resumo por unidade local",
      description: `Recorte operacional para ${scopeLabel.toLowerCase()}, com unidades e pendências do fluxo.`,
      icon: Layers,
      metrics: [
        { label: "Unidades no filtro", value: formatNumber(unitCount) },
        { label: "Processos", value: formatNumber(getReportTotal(report, stats, sumRows(rows))) },
        { label: "Aguard. gerente", value: formatNumber(stats.processosGerente) },
        { label: "Devolvidos", value: formatNumber(stats.processosDevolvidos) },
      ],
      rows,
    };
  }

  return {
    title: "Resumo do fluxo selecionado",
    description: `Distribuição dos processos conforme período, escopo e situação escolhidos.`,
    icon: BarChart3,
    metrics: [
      { label: "No fluxo", value: formatNumber(stats.totalProcessosFluxo) },
      { label: "Em análise", value: formatNumber(stats.processosAnalise) },
      { label: "Aguard. lançamento", value: formatNumber(stats.processosLancamento) },
      { label: "Devolvidos", value: formatNumber(stats.processosDevolvidos) },
    ],
    rows,
  };
}

function buildCategoryRows(categorias: TopCategoria[], totalProcessos: number) {
  return categorias.map((categoria) => ({
    label: categoria.nome,
    value: categoria.total,
    percent: totalProcessos > 0 ? Math.round((categoria.total / totalProcessos) * 100) : 0,
  }));
}

function percentageRow(label: string, value: number, total: number) {
  return {
    label,
    value,
    percent: total > 0 ? Math.round((value / total) * 100) : 0,
  };
}

function sumRows(rows: { value: number }[]) {
  return rows.reduce((total, row) => total + row.value, 0);
}

function getReportTotal(report: ReportDefinition, stats: DashboardStats | null, filteredTotal: number) {
  if (!stats) return 0;
  if (report.id === "carteiras_pendentes") return Math.max(stats.processosConcluidos - stats.totalCartoes, 0);
  if (report.grupo === "usuarios") return stats.totalUsuarios;
  if (report.grupo === "documentos") return stats.totalCartoes + stats.totalMemorandos;
  return filteredTotal;
}

function formatScopeLabel(value: string) {
  if (value === "todas") return "Todas as unidades";
  if (value === "minha_unidade") return "Minha unidade";
  const unit = UNLOC_OPTIONS.find((option) => option.municipio === value || option.value === value);
  return unit?.label ?? value;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function formatPeriodo(filtros: ReportFilters) {
  if (filtros.periodo === "custom") {
    const inicio = filtros.inicio || "não informado";
    const fim = filtros.fim || "não informado";
    return `${inicio} a ${fim}`;
  }

  return PERIODO_OPTIONS.find((option) => option.value === filtros.periodo)?.label ?? "Últimos 30 dias";
}

function buildReportFileName(reportName: string) {
  const normalizedReport = reportName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();
  return `SICPR-IDAM-RELATORIO-${normalizedReport}-${new Date().toISOString().slice(0, 10)}`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}
