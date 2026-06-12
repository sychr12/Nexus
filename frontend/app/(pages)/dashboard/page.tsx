"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
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
import { useAuthSession } from "@/app/_hooks/useAuthSession";
import { dashboardApi } from "./lib/api";
import {
  AtividadeRecente,
  ChartData,
  DashboardStats,
  Notificacao,
  Relatorio,
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
  relatorios: Relatorio[];
  notificacoes: Notificacao[];
  chart: ChartData;
};

export default function DashboardPage() {
  const { username, logout, ready } = useAuthSession({ defaultUsername: "Usuario" });
  const [data, setData] = useState<DashboardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMounted(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [stats, usuarios, atividades, categorias, relatorios, notificacoes, chart] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getUsuariosAtivos(),
        dashboardApi.getAtividadesRecentes(),
        dashboardApi.getTopCategorias(),
        dashboardApi.getRelatorios(),
        dashboardApi.getNotificacoes(),
        dashboardApi.getChartData(),
      ]);

      setData({ stats, usuarios, atividades, categorias, relatorios, notificacoes, chart });
    } catch {
      setError("Nao foi possivel carregar os dados do dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready || !mounted) return;

    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDashboard, mounted, ready]);

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
                Ultimo acesso registrado: {data?.stats.ultimoAcesso ?? "-"}
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
              <SummaryGrid stats={data.stats} />

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

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <Panel title="Atividades recentes" icon={Clock3} className="xl:col-span-2">
                  <ActivityList atividades={data.atividades} />
                </Panel>

                <div className="space-y-6">
                  <Panel title="Usuarios online" icon={Users}>
                    <UsersOnlineList usuarios={data.usuarios} />
                  </Panel>

                  <Panel title="Relatorios" icon={FileText}>
                    <ReportList relatorios={data.relatorios} />
                  </Panel>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SummaryGrid({ stats }: { stats: DashboardStats }) {
  const cards = [
    {
      label: "Inscricoes",
      value: stats.totalInscricoes,
      detail: `${stats.inscricoesHoje} hoje`,
      icon: FileText,
      tone: COLORS.blue,
    },
    {
      label: "Aguardando gerente",
      value: stats.processosGerente,
      detail: "fila de aprovacao",
      icon: Clock3,
      tone: COLORS.amber,
    },
    {
      label: "Em analise",
      value: stats.processosAnalise,
      detail: "analise tecnica",
      icon: Activity,
      tone: COLORS.primary,
    },
    {
      label: "Aguardando lancamento",
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
      label: "Usuarios bloqueados",
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
  if (atividades.length === 0) {
    return <EmptyState text="Nenhuma atividade recente registrada." />;
  }

  return (
    <div className="divide-y" style={{ borderColor: COLORS.border }}>
      {atividades.map((atividade, index) => (
        <div key={`${atividade.tipo}-${atividade.dataHora}-${index}`} className="flex gap-3 py-3 first:pt-0 last:pb-0">
          <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-md" style={{ backgroundColor: COLORS.primarySoft }}>
            <Activity size={16} style={{ color: COLORS.primary }} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium" style={{ color: COLORS.text }}>{sanitizeActivityDescription(atividade.descricao)}</p>
            <p className="mt-1 text-xs" style={{ color: COLORS.muted }}>
              {atividade.usuario} | {formatDateTime(atividade.dataHora)}
            </p>
          </div>
        </div>
      ))}
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

function ReportList({ relatorios }: { relatorios: Relatorio[] }) {
  if (relatorios.length === 0) {
    return <EmptyState text="Nenhum relatorio disponivel." />;
  }

  return (
    <div className="divide-y" style={{ borderColor: COLORS.border }}>
      {relatorios.map((relatorio) => (
        <Link
          key={relatorio.nome}
          href={relatorio.rota || rotaPadraoRelatorio(relatorio.nome)}
          className="flex w-full items-center justify-between gap-3 py-3 text-left first:pt-0 last:pb-0"
        >
          <span>
            <span className="block text-sm font-medium" style={{ color: COLORS.text }}>{relatorio.nome}</span>
            <span className="block text-xs" style={{ color: COLORS.muted }}>{relatorio.descricao}</span>
          </span>
          <ChevronRight size={16} style={{ color: COLORS.muted }} />
        </Link>
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

function rotaPadraoRelatorio(nome: string) {
  const normalized = nome.toLowerCase();

  if (normalized.includes("inscri")) return "/tabela";
  if (normalized.includes("carteira")) return "/carteira";
  if (normalized.includes("memorando")) return "/memorando";
  if (normalized.includes("processo")) return "/analises";
  if (normalized.includes("usuario")) return "/users";

  return "/dashboard";
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
