"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Layers,
  RefreshCw,
  ShieldAlert,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Sidebar from "@/app/_components/layout/Sidebar";
import StyledSelect from "@/app/_components/StyledSelect";
import { useAuthSession } from "@/app/_hooks/useAuthSession";
import { useClientMounted } from "@/app/_hooks/useClientMounted";
import { dashboardApi } from "./lib/api";
import {
  AtividadeRecente,
  ChartData,
  DashboardStats,
  Notificacao,
  TopCategoria,
  UsuarioAtivo,
} from "./lib/types";

const COLORS = {
  background: "#F6F8F6",
  panel: "#FFFFFF",
  border: "#DDE6DC",
  primary: "#245136",
  primarySoft: "#E6F2EA",
  text: "#17251B",
  muted: "#65756A",
  blue: "#2563EB",
  amber: "#B7791F",
  red: "#C2410C",
  green: "#16803C",
  slate: "#475569",
};

type DashboardState = {
  stats: DashboardStats;
  usuarios: UsuarioAtivo[];
  atividades: AtividadeRecente[];
  categorias: TopCategoria[];
  notificacoes: Notificacao[];
  chart: ChartData;
};

const ACTIVITY_LIMIT_OPTIONS = [
  { value: "30", label: "30" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
  { value: "all", label: "Tudo" },
];

export default function DashboardPage() {
  const { username, role, unidadeLocal, logout, ready } = useAuthSession({
    defaultUsername: "Usuario",
    allowedRoles: ["ADMIN", "GERENTE"],
  });
  const mounted = useClientMounted();
  const [data, setData] = useState<DashboardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await dashboardApi.registrarPresenca().catch(() => undefined);

      const [stats, usuarios, atividades, categorias, notificacoes, chart] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getUsuariosAtivos(),
        dashboardApi.getAtividadesRecentes(),
        dashboardApi.getTopCategorias(),
        dashboardApi.getNotificacoes(),
        dashboardApi.getChartData(),
      ]);

      setData({
        stats,
        usuarios: includeCurrentUserOnline(usuarios, username, role),
        atividades,
        categorias,
        notificacoes,
        chart,
      });
    } catch {
      setError("Nao foi possivel carregar os dados do dashboard.");
    } finally {
      setLoading(false);
    }
  }, [role, username]);

  useEffect(() => {
    if (!ready || !mounted) return;

    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDashboard, mounted, ready]);

  useEffect(() => {
    if (!ready || !mounted) return;

    const interval = window.setInterval(() => {
      void dashboardApi.registrarPresenca().catch(() => undefined);
    }, 120000);

    return () => window.clearInterval(interval);
  }, [mounted, ready]);

  const chartRows = data?.chart.dias.map((dia, index) => ({ dia, total: data.chart.valores[index] ?? 0 })) ?? [];
  const statusTotal = data?.categorias.reduce((total, item) => total + item.total, 0) ?? 0;

  if (!mounted || !ready) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
      <Sidebar
        onLogout={logout}
        username={username || "Usuario"}
        role={role}
        onCollapsedChange={setSidebarCollapsed}
      />

      <main
        className="min-h-screen transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? "72px" : "260px" }}
      >
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold" style={{ color: COLORS.text }}>
                Dashboard operacional
              </h1>
              <p className="mt-1 text-sm" style={{ color: COLORS.muted }}>
                Escopo: {getDashboardScope(role, unidadeLocal)} | Última presença registrada: {data?.stats.ultimoAcesso ?? "-"}
              </p>
            </div>
            <button
              type="button"
              onClick={loadDashboard}
              disabled={loading}
              className="inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium transition hover:bg-white disabled:opacity-60"
              style={{ borderColor: COLORS.border, color: COLORS.primary }}
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Atualizar
            </button>
          </div>

          {loading && <LoadingPanel />}

          {!loading && error && (
            <ErrorPanel message={error} onRetry={loadDashboard} />
          )}

          {!loading && !error && data && (
            <div className="space-y-6">
              <SummaryGrid stats={data.stats} role={role} />

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,0.8fr)]">
                <Panel title="Movimentacoes dos ultimos 30 dias" icon={Activity}>
                  {chartRows.some((item) => item.total > 0) ? (
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartRows}>
                          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                          <XAxis dataKey="dia" stroke={COLORS.muted} fontSize={12} />
                          <YAxis allowDecimals={false} stroke={COLORS.muted} fontSize={12} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="total"
                            name="Movimentacoes"
                            stroke={COLORS.primary}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <EmptyState text="Sem movimentacoes nos ultimos 30 dias." />
                  )}
                </Panel>

                <Panel title="Fila operacional" icon={Layers}>
                  <StatusList categorias={data.categorias} total={statusTotal} />
                </Panel>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <Panel title="Processos por situacao" icon={FileText} className="xl:col-span-2">
                  {data.categorias.some((item) => item.total > 0) ? (
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.categorias}>
                          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                          <XAxis dataKey="nome" stroke={COLORS.muted} fontSize={11} interval={0} />
                          <YAxis allowDecimals={false} stroke={COLORS.muted} fontSize={12} />
                          <Tooltip />
                          <Bar dataKey="total" name="Processos" fill={COLORS.primary} radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <EmptyState text="Nenhum processo registrado no fluxo." />
                  )}
                </Panel>

                <Panel title="Alertas" icon={ShieldAlert}>
                  <NotificationList notificacoes={data.notificacoes} />
                </Panel>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,0.8fr)]">
                <Panel title="Atividades recentes" icon={Clock3}>
                  <ActivityList atividades={data.atividades} />
                </Panel>

                <Panel title="Usuarios online" icon={Users}>
                  <UsersOnlineList usuarios={data.usuarios} />
                </Panel>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SummaryGrid({ stats, role }: { stats: DashboardStats; role: string }) {
  const normalizedRole = normalizeDashboardRole(role);
  const cards = normalizedRole === "GERENTE"
    ? [
        {
          label: "Processos da unidade",
          value: stats.totalProcessosFluxo,
          detail: "escopo local",
          icon: FileText,
          tone: COLORS.blue,
        },
        {
          label: "Aguardando gerente",
          value: stats.processosGerente,
          detail: "fila de aprovação",
          icon: Clock3,
          tone: COLORS.amber,
        },
        {
          label: "Em análise",
          value: stats.processosAnalise,
          detail: "após aprovação",
          icon: Activity,
          tone: COLORS.primary,
        },
        {
          label: "Concluídos",
          value: stats.processosConcluidos,
          detail: "fluxo finalizado",
          icon: CheckCircle2,
          tone: COLORS.green,
        },
        {
          label: "Devolvidos",
          value: stats.processosDevolvidos,
          detail: "precisam correção",
          icon: AlertCircle,
          tone: stats.processosDevolvidos > 0 ? COLORS.red : COLORS.green,
        },
        {
          label: "Usuários online",
          value: stats.usuariosOnline,
          detail: `${stats.usuariosAtivos} ativos`,
          icon: Users,
          tone: COLORS.slate,
        },
      ]
    : [
        {
          label: "Processos",
          value: stats.totalProcessosFluxo,
          detail: "fluxo SICPR",
          icon: FileText,
          tone: COLORS.blue,
        },
        {
          label: "Aguardando gerente",
          value: stats.processosGerente,
          detail: "fila de aprovação",
          icon: Clock3,
          tone: COLORS.amber,
        },
        {
          label: "Em análise",
          value: stats.processosAnalise,
          detail: "análise técnica",
          icon: Activity,
          tone: COLORS.primary,
        },
        {
          label: "Aguardando lançamento",
          value: stats.processosLancamento,
          detail: "prontos para finalizar",
          icon: CheckCircle2,
          tone: COLORS.green,
        },
        {
          label: "Carteiras emitidas",
          value: stats.totalCartoes,
          detail: `${stats.cartoesHoje} hoje`,
          icon: CreditCard,
          tone: COLORS.slate,
        },
        {
          label: "Usuários bloqueados",
          value: stats.usuariosBloqueados,
          detail: `${stats.usuariosAtivos} ativos`,
          icon: ShieldAlert,
          tone: stats.usuariosBloqueados > 0 ? COLORS.red : COLORS.green,
        },
      ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="rounded-lg border bg-white p-4" style={{ borderColor: COLORS.border }}>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: COLORS.muted }}>{card.label}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: COLORS.primarySoft }}>
                <Icon size={18} style={{ color: card.tone }} />
              </span>
            </div>
            <div className="text-2xl font-semibold" style={{ color: COLORS.text }}>{formatNumber(card.value)}</div>
            <div className="mt-1 text-xs" style={{ color: COLORS.muted }}>{card.detail}</div>
          </div>
        );
      })}
    </div>
  );
}

function StatusList({ categorias, total }: { categorias: TopCategoria[]; total: number }) {
  if (!categorias.some((item) => item.total > 0)) {
    return <EmptyState text="Sem processos na fila operacional." />;
  }

  return (
    <div className="space-y-4">
      {categorias.map((item) => {
        const percent = total > 0 ? Math.round((item.total / total) * 100) : 0;
        return (
          <div key={item.nome}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium" style={{ color: COLORS.text }}>{item.nome}</span>
              <span style={{ color: COLORS.muted }}>{formatNumber(item.total)} | {percent}%</span>
            </div>
            <div className="h-2 rounded-full" style={{ backgroundColor: COLORS.primarySoft }}>
              <div
                className="h-2 rounded-full"
                style={{ width: `${percent}%`, backgroundColor: COLORS.primary }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActivityList({ atividades }: { atividades: AtividadeRecente[] }) {
  const [activityType, setActivityType] = useState("");
  const [activityLimit, setActivityLimit] = useState("30");
  const activityTypeOptions = useMemo(() => {
    const types = Array.from(new Set(atividades.map((atividade) => atividade.tipo).filter(Boolean)));
    return [
      { value: "", label: "Todos" },
      ...types.map((tipo) => ({ value: tipo, label: getActivityTypeLabel(tipo) })),
    ];
  }, [atividades]);

  const filteredActivities = useMemo(
    () => atividades.filter((atividade) => !activityType || atividade.tipo === activityType),
    [activityType, atividades],
  );
  const limit = activityLimit === "all" ? filteredActivities.length : Number(activityLimit);
  const visibleActivities = filteredActivities.slice(0, limit);
  const hasCustomFilter = activityType !== "" || activityLimit !== "30";

  if (atividades.length === 0) {
    return <EmptyState text="Nenhuma atividade recente registrada." />;
  }

  return (
    <div className="space-y-3">
      <div
        className="flex flex-col gap-2 rounded-md border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
        style={{ borderColor: COLORS.border, backgroundColor: "#F0F6EF" }}
      >
        <div className="min-w-0">
          <p className="text-sm" style={{ color: COLORS.text }}>
            Exibindo <strong>{formatNumber(visibleActivities.length)}</strong> de{" "}
            <strong>{formatNumber(filteredActivities.length)}</strong> atividades
            {filteredActivities.length !== atividades.length ? ` (${formatNumber(atividades.length)} no total)` : ""}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <DashboardSelect label="Tipo" value={activityType} onChange={setActivityType} options={activityTypeOptions} selectWidthClassName="w-full sm:w-52" />
          <DashboardSelect label="Exibir" value={activityLimit} onChange={setActivityLimit} options={ACTIVITY_LIMIT_OPTIONS} selectWidthClassName="w-full sm:w-28" />
          {hasCustomFilter && (
            <button
              type="button"
              onClick={() => {
                setActivityType("");
                setActivityLimit("30");
              }}
              className="h-9 rounded-md border bg-white px-3 text-sm font-semibold transition hover:bg-[#F5F7F5]"
              style={{ borderColor: COLORS.border, color: COLORS.primary }}
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {visibleActivities.length === 0 ? (
        <EmptyState text="Nenhuma atividade encontrada para este filtro." />
      ) : (
        <div className="max-h-[560px] overflow-y-auto pr-2">
          {visibleActivities.map((atividade, index) => (
            <div
              key={`${atividade.tipo}-${atividade.dataHora}-${index}`}
              className="flex gap-3 border-b py-3 first:pt-0 last:border-b-0 last:pb-0"
              style={{ borderBottomColor: COLORS.border }}
            >
              <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: COLORS.primarySoft }}>
                <Activity size={16} style={{ color: COLORS.primary }} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium" style={{ color: COLORS.text }}>{sanitizeActivityDescription(atividade.descricao)}</p>
                <p className="mt-1 text-xs" style={{ color: COLORS.muted }}>
                  {getActivityTypeLabel(atividade.tipo)} | {atividade.usuario} | {formatDateTime(atividade.dataHora)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DashboardSelect({
  label,
  value,
  onChange,
  options,
  selectWidthClassName = "w-full sm:w-36",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  selectWidthClassName?: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-xs font-semibold uppercase" style={{ color: COLORS.muted }}>
        {label}
      </span>
      <div className={selectWidthClassName}>
        <StyledSelect
          value={value}
          onChange={onChange}
          size="compact"
          menuClassName="overflow-x-hidden"
          options={options}
          colors={{
            accent: COLORS.green,
            border: COLORS.border,
            inputBg: COLORS.panel,
            card: COLORS.panel,
            text: COLORS.text,
            textLight: COLORS.muted,
            hoverBg: COLORS.primarySoft,
          }}
        />
      </div>
    </div>
  );
}

function UsersOnlineList({ usuarios }: { usuarios: UsuarioAtivo[] }) {
  if (usuarios.length === 0) {
    return <EmptyState text="Nenhum usuario online agora." />;
  }

  return (
    <div className="space-y-3">
      {usuarios.map((usuario) => (
        <div key={usuario.username} className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium" style={{ color: COLORS.text }}>{usuario.nome}</p>
            <p className="truncate text-xs" style={{ color: COLORS.muted }}>@{usuario.username} | {usuario.perfil}</p>
          </div>
          <span className="rounded-full px-2 py-1 text-xs font-medium" style={{ backgroundColor: COLORS.primarySoft, color: COLORS.green }}>
            {usuario.tempoOnline}
          </span>
        </div>
      ))}
    </div>
  );
}

function includeCurrentUserOnline(usuarios: UsuarioAtivo[], username: string, role: string): UsuarioAtivo[] {
  const normalizedUsername = username.trim();
  if (!normalizedUsername) {
    return usuarios;
  }

  const alreadyIncluded = usuarios.some((usuario) =>
    usuario.username.trim().toLowerCase() === normalizedUsername.toLowerCase(),
  );

  if (alreadyIncluded) {
    return usuarios;
  }

  return [
    {
      username: normalizedUsername,
      nome: normalizedUsername,
      perfil: role || "USUARIO",
      ultimoAcesso: new Date().toISOString(),
      tempoOnline: "Agora",
    },
    ...usuarios,
  ];
}

function NotificationList({ notificacoes }: { notificacoes: Notificacao[] }) {
  if (notificacoes.length === 0) {
    return <EmptyState text="Nenhum alerta operacional no momento." />;
  }

  return (
    <div className="space-y-3">
      {notificacoes.map((notificacao) => (
        <div key={`${notificacao.titulo}-${notificacao.mensagem}`} className="rounded-md border p-3" style={{ borderColor: COLORS.border }}>
          <div className="flex items-start gap-2">
            <AlertCircle size={16} style={{ color: COLORS.amber }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{notificacao.titulo}</p>
              <p className="mt-1 text-xs" style={{ color: COLORS.muted }}>{notificacao.mensagem}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  className = "",
  children,
}: {
  title: string;
  icon: LucideIcon;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-lg border bg-white p-5 ${className}`} style={{ borderColor: COLORS.border }}>
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-md" style={{ backgroundColor: COLORS.primarySoft }}>
          <Icon size={17} style={{ color: COLORS.primary }} />
        </span>
        <h2 className="text-sm font-semibold" style={{ color: COLORS.text }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-md border border-dashed px-4 text-center text-sm" style={{ borderColor: COLORS.border, color: COLORS.muted }}>
      {text}
    </div>
  );
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border bg-white p-6" style={{ borderColor: COLORS.border }}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle size={22} style={{ color: COLORS.red }} />
          <div>
            <p className="font-semibold" style={{ color: COLORS.text }}>{message}</p>
            <p className="mt-1 text-sm" style={{ color: COLORS.muted }}>
              Verifique se o backend esta online e se seu usuario tem permissao para acessar o dashboard.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium text-white"
          style={{ backgroundColor: COLORS.primary }}
        >
          <RefreshCw size={16} />
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

function sanitizeActivityDescription(description: string) {
  const inscricaoPrefix = "Inscricao cadastrada para ";

  if (!description.startsWith(inscricaoPrefix)) {
    return description;
  }

  const rawName = description.slice(inscricaoPrefix.length).trim();
  const decodedName = decodeReadableBase64(rawName);

  if (decodedName) {
    return `${inscricaoPrefix}${decodedName}`;
  }

  if (looksEncoded(rawName)) {
    return "Inscricao cadastrada";
  }

  return description;
}

function getActivityTypeLabel(type: string) {
  const labels: Record<string, string> = {
    PROCESSO: "Processos",
    CARTEIRA: "Carteiras",
    MEMORANDO: "Memorandos",
    INSCRICAO: "Inscrições",
    LOGIN: "Acessos",
  };

  return labels[type] || humanizeDashboardText(type);
}

function humanizeDashboardText(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function decodeReadableBase64(value: string) {
  if (!looksEncoded(value)) {
    return null;
  }

  try {
    const binary = window.atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes).trim();

    return isReadableText(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

function looksEncoded(value: string) {
  return value.length >= 12 && /^[A-Za-z0-9+/]+={0,2}$/.test(value);
}

function isReadableText(value: string) {
  if (!value || value.length > 120) {
    return false;
  }

  const readableChars = Array.from(value).filter((char) => /[\p{L}\s'.-]/u.test(char)).length;
  return readableChars >= Math.max(3, Math.floor(value.length / 2));
}

function normalizeDashboardRole(role?: string | null) {
  const normalized = (role || "USUARIO").trim().toUpperCase().replace(/^ROLE_/, "");
  return normalized === "CHEFE" ? "GERENTE" : normalized;
}

function getDashboardScope(role?: string | null, unidadeLocal?: string | null) {
  const normalizedRole = normalizeDashboardRole(role);
  if (normalizedRole === "ADMIN") return "visão geral do sistema";
  if (unidadeLocal?.trim()) return `unidade local ${unidadeLocal.trim()}`;
  return "unidade local não vinculada";
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: COLORS.background }}>
      <RefreshCw size={28} className="animate-spin" style={{ color: COLORS.primary }} />
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="rounded-lg border bg-white p-8 text-center" style={{ borderColor: COLORS.border, color: COLORS.muted }}>
      <RefreshCw size={24} className="mx-auto mb-3 animate-spin" style={{ color: COLORS.primary }} />
      Carregando dashboard...
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value ?? 0);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
