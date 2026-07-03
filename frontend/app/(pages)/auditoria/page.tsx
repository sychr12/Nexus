"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Activity, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, RefreshCw, Search, ShieldCheck, UserRound, XCircle } from "lucide-react";
import Sidebar from "@/app/_components/layout/Sidebar";
import ClearFiltersButton from "@/app/_components/ClearFiltersButton";
import StyledSelect from "@/app/_components/StyledSelect";
import { useAuthSession } from "@/app/_hooks/useAuthSession";
import { useClientMounted } from "@/app/_hooks/useClientMounted";
import { formatDateInput, isValidDateInput } from "@/app/_lib/dateInput";
import { auditoriaService } from "./services/auditoria.service";
import type { AuditEvent, AuditFilters, PageResponse } from "./types/auditoria";

const COLORS = {
  background: "#F6F8F6",
  panel: "#FFFFFF",
  border: "#DDE6DC",
  primary: "#245136",
  text: "#17251B",
  muted: "#65756A",
  green: "#16803C",
  red: "#C2410C",
};

const AREA_OPTIONS = [
  { value: "", label: "Todas" },
  { value: "PROCESSO_FLUXO", label: "Processos" },
  { value: "PROCESSO_FLUXO_LOTE", label: "Aprovações em lote" },
  { value: "GERENTE_UNIDADE", label: "Gerentes de unidade" },
  { value: "CARTEIRA_DIGITAL", label: "Carteira digital" },
  { value: "MEMORANDO", label: "Memorandos" },
  { value: "MENSAGEM", label: "Mensagens" },
  { value: "USUARIO", label: "Usuários" },
  { value: "INSCRICAO", label: "Inscrições" },
  { value: "API", label: "Sistema" },
];

const HTTP_STATUS_GUIDE = [
  { code: "200", title: "Sucesso", description: "A solicitação foi processada normalmente.", tone: "success" },
  { code: "201", title: "Criado", description: "Um novo registro foi criado no sistema.", tone: "success" },
  { code: "204", title: "Concluído", description: "A ação deu certo, mas não retornou conteúdo.", tone: "success" },
  { code: "400", title: "Dados inválidos", description: "Alguma informação enviada não passou na validação.", tone: "warning" },
  { code: "401", title: "Login necessário", description: "O usuário não estava autenticado.", tone: "warning" },
  { code: "403", title: "Sem permissão", description: "O usuário estava logado, mas não podia fazer a ação.", tone: "danger" },
  { code: "404", title: "Não encontrado", description: "A rota ou o registro solicitado não existe.", tone: "danger" },
  { code: "409", title: "Conflito", description: "A ação entrou em conflito com o estado atual do registro.", tone: "warning" },
  { code: "500", title: "Erro interno", description: "O backend encontrou um erro inesperado.", tone: "danger" },
];

const initialFilters: AuditFilters = {
  usuario: "",
  acao: "",
  resultado: "",
  recursoTipo: "",
  recursoId: "",
  de: "",
  ate: "",
};

const PAGE_SIZE = 25;

export default function AuditoriaPage() {
  const { username, role, logout, ready } = useAuthSession({
    defaultUsername: "Administrador",
    allowedRoles: ["ADMIN"],
  });
  const mounted = useClientMounted();
  const [filters, setFilters] = useState<AuditFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<AuditFilters>(initialFilters);
  const [data, setData] = useState<PageResponse<AuditEvent> | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await auditoriaService.listarEventos(appliedFilters, page, PAGE_SIZE);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar auditoria");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page]);

  useEffect(() => {
    if (!mounted || !ready) return;
    const timer = window.setTimeout(() => {
      void loadEvents();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadEvents, mounted, ready]);

  const events = useMemo(() => data?.content ?? [], [data]);
  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const summary = useMemo(() => {
    const successCount = events.filter((event) => event.resultado === "SUCESSO").length;
    const failureCount = events.filter((event) => event.resultado === "FALHA").length;
    const userCount = new Set(events.map((event) => event.usuario).filter(Boolean)).size;

    return [
      { label: "Eventos encontrados", value: total, icon: Activity, detail: "filtro atual", color: COLORS.primary, bg: "#EAF2EA" },
      { label: "Sucessos", value: successCount, icon: CheckCircle2, detail: "nesta página", color: COLORS.green, bg: "#E8F5EC" },
      { label: "Falhas", value: failureCount, icon: XCircle, detail: "nesta página", color: COLORS.red, bg: "#FFF1E8" },
      { label: "Usuários envolvidos", value: userCount, icon: UserRound, detail: "nesta página", color: "#365F91", bg: "#EEF4FF" },
    ];
  }, [events, total]);
  const currentRange = useMemo(() => {
    if (!data || total === 0) return "0 de 0";
    const start = data.number * data.size + 1;
    const end = start + events.length - 1;
    return `${start}-${end} de ${total}`;
  }, [data, events.length, total]);
  const hasFilters = useMemo(() => Object.values(filters).some((value) => value.trim().length > 0), [filters]);

  function updateFilter<K extends keyof AuditFilters>(key: K, value: AuditFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function applyFilters(event: React.FormEvent) {
    event.preventDefault();
    setPage(0);
    setAppliedFilters(filters);
  }

  function clearFilters() {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setPage(0);
  }

  if (!mounted || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: COLORS.background }}>
        <div className="h-8 w-8 animate-spin rounded-full border-b-2" style={{ borderBottomColor: COLORS.primary }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
      <Sidebar
        onLogout={logout}
        username={username || "Administrador"}
        role={role}
        onCollapsedChange={setSidebarCollapsed}
      />

      <main className="min-h-screen transition-all duration-300" style={{ marginLeft: sidebarCollapsed ? "72px" : "260px" }}>
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold" style={{ color: COLORS.text }}>
                Auditoria
              </h1>
              <p className="mt-1 text-sm" style={{ color: COLORS.muted }}>
                Registro administrativo das movimentações críticas do sistema.
              </p>
            </div>
            <button
              type="button"
              onClick={loadEvents}
              disabled={loading}
              className="inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium transition hover:bg-white disabled:opacity-60"
              style={{ borderColor: COLORS.border, color: COLORS.primary }}
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Atualizar
            </button>
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {summary.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-lg border bg-white p-4" style={{ borderColor: COLORS.border }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.muted }}>
                        {item.label}
                      </p>
                      <p className="mt-2 text-2xl font-bold" style={{ color: item.color }}>
                        {item.value}
                      </p>
                      <p className="mt-1 text-xs" style={{ color: COLORS.muted }}>
                        {item.detail}
                      </p>
                    </div>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: item.bg, color: item.color }}>
                      <Icon size={20} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <form
            onSubmit={applyFilters}
            className="relative z-20 mb-5 grid gap-3 overflow-visible rounded-lg border bg-white p-4 lg:grid-cols-[repeat(6,minmax(0,1fr))_auto]"
            style={{ borderColor: COLORS.border }}
          >
            <FilterInput label="Usuário" placeholder="Nome ou login" value={filters.usuario} onChange={(value) => updateFilter("usuario", value)} />
            <FilterInput label="Ação" placeholder="Ex.: usuário, processo, senha" value={filters.acao} onChange={(value) => updateFilter("acao", value)} />
            <SelectFilter
              label="Área"
              value={filters.recursoTipo}
              onChange={(value) => updateFilter("recursoTipo", value)}
              options={AREA_OPTIONS}
            />
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase" style={{ color: COLORS.muted }}>
                Resultado
              </span>
              <StyledSelect
                value={filters.resultado}
                onChange={(value) => updateFilter("resultado", value as AuditFilters["resultado"])}
                size="compact"
                options={[
                  { value: "", label: "Todos" },
                  { value: "SUCESSO", label: "Sucesso" },
                  { value: "FALHA", label: "Falha" },
                ]}
                colors={{
                  accent: COLORS.green,
                  border: COLORS.border,
                  inputBg: COLORS.panel,
                  card: COLORS.panel,
                  text: COLORS.text,
                  textLight: COLORS.muted,
                  hoverBg: "#F0F4EE",
                }}
              />
            </label>
            <FilterInput label="ID do registro" placeholder="Opcional" value={filters.recursoId} onChange={(value) => updateFilter("recursoId", value)} />
            <div className="grid grid-cols-2 gap-2">
              <DateInput label="De" value={filters.de} onChange={(value) => updateFilter("de", value)} />
              <DateInput label="Até" value={filters.ate} onChange={(value) => updateFilter("ate", value)} />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold text-white"
                style={{ backgroundColor: COLORS.primary }}
              >
                <Search size={16} />
                Filtrar
              </button>
              {hasFilters && <ClearFiltersButton onClick={clearFilters} />}
            </div>
          </form>

          <StatusGuide />

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          <section className="relative z-0 overflow-hidden rounded-lg border bg-white" style={{ borderColor: COLORS.border }}>
            <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: COLORS.border }}>
              <p className="text-sm font-medium" style={{ color: COLORS.text }}>
                Histórico de auditoria
              </p>
              <p className="text-sm" style={{ color: COLORS.muted }}>
                {currentRange}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[1040px] w-full border-collapse text-left text-sm">
                <thead style={{ backgroundColor: "#F2F6F2", color: COLORS.muted }}>
                  <tr>
                    <Th>Data e hora</Th>
                    <Th>Usuário</Th>
                    <Th>Área</Th>
                    <Th>Ação</Th>
                    <Th>Resultado</Th>
                    <Th>Detalhes</Th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center" style={{ color: COLORS.muted }}>
                        Carregando auditoria...
                      </td>
                    </tr>
                  ) : events.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center" style={{ color: COLORS.muted }}>
                        Nenhum evento encontrado.
                      </td>
                    </tr>
                  ) : (
                    events.map((event) => <AuditRow key={event.id} event={event} />)
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t px-4 py-3" style={{ borderColor: COLORS.border }}>
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(current - 1, 0))}
                disabled={!data || data.first || loading}
                className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm disabled:opacity-50"
                style={{ borderColor: COLORS.border, color: COLORS.primary }}
              >
                <ChevronLeft size={16} />
                Anterior
              </button>
              <span className="text-sm" style={{ color: COLORS.muted }}>
                Página {totalPages === 0 ? 0 : page + 1} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={!data || data.last || loading}
                className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm disabled:opacity-50"
                style={{ borderColor: COLORS.border, color: COLORS.primary }}
              >
                Próxima
                <ChevronRight size={16} />
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function StatusGuide() {
  return (
    <details className="mb-5 rounded-lg border bg-white p-4" style={{ borderColor: COLORS.border }}>
      <summary className="cursor-pointer text-sm font-semibold" style={{ color: COLORS.primary }}>
        Guia rápido dos códigos HTTP
      </summary>
      <p className="mt-2 text-sm" style={{ color: COLORS.muted }}>
        Esses códigos explicam se uma ação foi concluída, bloqueada por permissão, recusada por dados inválidos ou se encontrou algum erro.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {HTTP_STATUS_GUIDE.map((item) => {
          const colors = getStatusTone(item.tone);
          return (
            <div key={item.code} className="rounded-md border p-3" style={{ borderColor: colors.border, backgroundColor: colors.bg }}>
              <div className="flex items-center gap-2">
                <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ backgroundColor: colors.badgeBg, color: colors.text }}>
                  HTTP {item.code}
                </span>
                <span className="text-sm font-semibold" style={{ color: COLORS.text }}>
                  {item.title}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed" style={{ color: COLORS.muted }}>
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </details>
  );
}

function FilterInput({ label, placeholder, value, onChange }: { label: string; placeholder?: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase" style={{ color: COLORS.muted }}>
        {label}
      </span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-green-500"
        style={{ borderColor: COLORS.border }}
      />
    </label>
  );
}

function SelectFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase" style={{ color: COLORS.muted }}>
        {label}
      </span>
      <StyledSelect
        value={value}
        onChange={onChange}
        size="compact"
        options={options}
        colors={{
          accent: COLORS.green,
          border: COLORS.border,
          inputBg: COLORS.panel,
          card: COLORS.panel,
          text: COLORS.text,
          textLight: COLORS.muted,
          hoverBg: "#F0F4EE",
        }}
      />
    </label>
  );
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const dateError = value.length === 10 && !isValidDateInput(value);

  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase" style={{ color: COLORS.muted }}>
        {label}
      </span>
      <input
        type="text"
        inputMode="numeric"
        maxLength={10}
        placeholder="dd/mm/aaaa"
        value={value}
        onChange={(event) => onChange(formatDateInput(event.target.value))}
        aria-invalid={dateError || undefined}
        className="h-10 w-full rounded-md border px-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
        style={{ borderColor: dateError ? COLORS.red : COLORS.border }}
      />
      {dateError && (
        <span className="mt-1 block text-xs font-semibold" style={{ color: COLORS.red }}>
          Data inválida
        </span>
      )}
    </label>
  );
}

function Th({ children }: { children: ReactNode }) {
  return (
    <th className="border-b px-4 py-3 text-xs font-semibold uppercase" style={{ borderColor: COLORS.border }}>
      {children}
    </th>
  );
}

function AuditRow({ event }: { event: AuditEvent }) {
  const success = event.resultado === "SUCESSO";
  const area = getAreaLabel(event);
  const action = getActionLabel(event.acao);
  const details = getActionDetails(event);

  return (
    <tr className="border-b last:border-b-0 hover:bg-slate-50" style={{ borderColor: COLORS.border }}>
      <td className="whitespace-nowrap px-4 py-3" style={{ color: COLORS.text }}>
        {formatDate(event.ocorreuEm)}
      </td>
      <td className="px-4 py-3 font-medium" style={{ color: COLORS.text }}>
        {event.usuario || "Sistema"}
      </td>
      <td className="px-4 py-3">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold"
          style={{
            backgroundColor: "#EEF4EC",
            color: COLORS.primary,
          }}
        >
          <ShieldCheck size={13} />
          {area}
        </span>
      </td>
      <td className="px-4 py-3" style={{ color: COLORS.text }}>
        <p className="font-semibold">{action}</p>
        {details && (
          <p className="mt-1 text-xs" style={{ color: COLORS.muted }}>
            {details}
          </p>
        )}
      </td>
      <td className="px-4 py-3">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold"
          style={{
            backgroundColor: success ? "#E8F5EC" : "#FFF1E8",
            color: success ? COLORS.green : COLORS.red,
          }}
        >
          {success ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
          {success ? "Sucesso" : "Falha"}
        </span>
      </td>
      <td className="max-w-[360px] px-4 py-3" style={{ color: COLORS.muted }}>
        <details>
          <summary className="cursor-pointer text-sm font-semibold" style={{ color: COLORS.primary }}>
            Ver detalhes
          </summary>
          <div className="mt-2 space-y-1 rounded-md border p-3 text-xs" style={{ borderColor: COLORS.border, backgroundColor: "#FAFCFA" }}>
            <DetailLine label="Recurso" value={formatResource(event)} />
            <DetailLine label="Rota" value={`${event.metodoHttp || "-"} ${event.caminho || "-"}`} mono />
            <DetailLine label="Status HTTP" value={formatStatusHttp(event.statusHttp)} />
            <DetailLine label="IP de origem" value={formatIpAddress(event.ipOrigem)} />
            <DetailLine label="Navegador" value={event.userAgent || "-"} />
            <DetailLine label="Ação técnica" value={event.acao} mono />
            {event.detalhes && <DetailLine label="Observação" value={event.detalhes} />}
            {event.correlationId && <DetailLine label="Correlação" value={event.correlationId} mono />}
          </div>
        </details>
      </td>
    </tr>
  );
}

function DetailLine({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <p className="grid grid-cols-[96px_minmax(0,1fr)] gap-2">
      <span className="font-semibold" style={{ color: COLORS.text }}>
        {label}
      </span>
      <span className={mono ? "break-words font-mono" : "break-words"}>{value}</span>
    </p>
  );
}

function getAreaLabel(event: AuditEvent) {
  const resource = event.recursoTipo || "";
  const known = AREA_OPTIONS.find((option) => option.value === resource);
  if (known && known.value) return known.label;
  if (resource === "FLUXO") return "Processos";
  if (event.caminho?.startsWith("/api/auth")) return "Acesso";
  return resource ? humanize(resource) : "Sistema";
}

function getActionLabel(action: string) {
  const normalized = action.toUpperCase();
  const labels: Record<string, string> = {
    FLUXO_PROCESSO_CRIAR: "Processo criado",
    FLUXO_PROCESSO_ATUALIZAR: "Processo atualizado",
    FLUXO_ENCAMINHAR_GERENTE: "Processo enviado ao gerente",
    FLUXO_GERENTE_APROVAR_LOTE: "Lote aprovado pelo gerente",
    FLUXO_GERENTE_DEVOLVER: "Processo devolvido pelo gerente",
    FLUXO_ANALISE_APROVAR: "Análise aprovada",
    FLUXO_ANALISE_DEVOLVER: "Processo devolvido pela análise",
    FLUXO_LANCAMENTO_CONCLUIR: "Lançamento concluído",
    FLUXO_LANCAMENTO_DEVOLVER: "Lançamento devolvido",
    GERENTE_UNIDADE_CRIAR: "Gerente de unidade criado",
    GERENTE_UNIDADE_ATUALIZAR: "Gerente de unidade atualizado",
    GERENTE_UNIDADE_INATIVAR: "Gerente de unidade inativado",
    CARTEIRA_LOTE_UPLOAD: "Lote de carteiras enviado",
    CARTEIRA_LOTE_ZIP: "ZIP de carteiras gerado",
    CARTEIRA_OPERACAO: "Operação na carteira digital",
    MEMORANDO_CRIAR: "Memorando criado",
    MEMORANDO_ATUALIZAR: "Memorando atualizado",
    MEMORANDO_EXCLUIR: "Memorando excluído",
    DOCUMENTO_DOWNLOAD: "Documento baixado",
    MENSAGEM_ENVIAR: "Mensagem enviada",
    USUARIO_CRIAR: "Usuário criado",
    USUARIO_ATUALIZAR: "Usuário atualizado",
    USUARIO_ALTERAR: "Usuário alterado",
    USUARIO_EXCLUIR: "Usuário excluído",
    INSCRICAO_CRIAR: "Inscrição criada",
    API_DOWNLOAD: "Download no sistema",
    API_MUTACAO: "Alteração no sistema",
  };

  return labels[normalized] || humanize(action);
}

function getActionDetails(event: AuditEvent) {
  const pieces = [];
  if (event.recursoId) pieces.push(`Registro ${event.recursoId}`);
  if (event.statusHttp) pieces.push(formatStatusHttp(event.statusHttp));
  if (event.ipOrigem) pieces.push(formatIpAddress(event.ipOrigem));
  return pieces.join(" | ");
}

function formatResource(event: AuditEvent) {
  if (!event.recursoTipo && !event.recursoId) return "-";
  return `${event.recursoTipo || "REGISTRO"}${event.recursoId ? ` #${event.recursoId}` : ""}`;
}

function humanize(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatStatusHttp(status: number | null) {
  if (status == null) return "-";
  const label = getStatusLabel(status);
  return label ? `HTTP ${status} - ${label}` : `HTTP ${status}`;
}

function getStatusLabel(status: number) {
  const labels: Record<number, string> = {
    200: "Sucesso",
    201: "Criado",
    204: "Concluído sem conteúdo",
    400: "Dados inválidos",
    401: "Login necessário",
    403: "Sem permissão",
    404: "Não encontrado",
    409: "Conflito de dados",
    500: "Erro interno",
  };

  return labels[status] || "";
}

function formatIpAddress(ip: string | null) {
  if (!ip) return "-";
  if (ip === "0:0:0:0:0:0:0:1" || ip === "::1" || ip === "127.0.0.1") return "Máquina local";
  return ip;
}

function getStatusTone(tone: string) {
  if (tone === "success") {
    return { bg: "#F4FBF6", border: "#CFE8D6", badgeBg: "#E8F5EC", text: COLORS.green };
  }
  if (tone === "warning") {
    return { bg: "#FFF9EF", border: "#F4D7A1", badgeBg: "#FFF1D6", text: "#A15C00" };
  }
  return { bg: "#FFF7F4", border: "#F2C8BB", badgeBg: "#FFF1E8", text: COLORS.red };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
