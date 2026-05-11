"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu, Bell, User, LogOut, PieChart as PieChartIcon, Activity, FileText, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import TopBar from "../sidebar/page"; // Mudado de Sidebar para TopBar

import StatsCards from "./components/StatsCards";
import UsersOnline from "./components/UsersOnline";
import RecentActivities from "./components/RecentActivities";
import { dashboardApi } from "./lib/api";
import {
  DashboardStats,
  UsuarioAtivo,
  AtividadeRecente,
  TopCategoria,
  Relatorio,
  Notificacao,
} from "./lib/types";

// Nova paleta de cores
const COLORS = {
  primary: "#2D452F",
  secondary: "#4C6A4B",
  accent: "#6B9D4A",
  light: "#CFE2CE",
  background: "#F5F7F5",
  card: "#FFFFFF",
  text: "#1A2E1B",
  textLight: "#6B7C6A",
};

const CAT_COLORS = ["#6B9D4A", "#4C6A4B", "#2D452F", "#8DB87C"];

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioAtivo[]>([]);
  const [atividades, setAtividades] = useState<AtividadeRecente[]>([]);
  const [categorias, setCategorias] = useState<TopCategoria[]>([]);
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [lineChartData, setLineChartData] = useState([
    { mes: "Jan", receita: 42000, despesa: 28000 },
    { mes: "Fev", receita: 45000, despesa: 30000 },
    { mes: "Mar", receita: 48000, despesa: 32000 },
    { mes: "Abr", receita: 52000, despesa: 31000 },
    { mes: "Mai", receita: 55000, despesa: 35000 },
    { mes: "Jun", receita: 58000, despesa: 34000 },
  ]);

  const [barChartData, setBarChartData] = useState([
    { categoria: "Combustível", valor: 36 },
    { categoria: "Insumos", valor: 25 },
    { categoria: "Serviços", valor: 20 },
    { categoria: "Outros", valor: 19 },
  ]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    loadAll();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function loadAll() {
    try {
      setLoading(true);
      const [s, u, a, c, r, n] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getUsuariosAtivos(),
        dashboardApi.getAtividadesRecentes(),
        dashboardApi.getTopCategorias(),
        dashboardApi.getRelatorios(),
        dashboardApi.getNotificacoes(),
      ]);
      setStats(s);
      setUsuarios(u);
      setAtividades(a);
      setCategorias(c);
      setRelatorios(r);
      setNotificacoes(n);
      
      if (c && c.length > 0) {
        setBarChartData(c.map(cat => ({ categoria: cat.nome, valor: cat.total })));
      }
    } catch (err) {
      console.error("Erro ao carregar:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    router.push("/login");
  }

  const username = typeof window !== "undefined" ? localStorage.getItem("username") || "Usuário" : "Usuário";
  const unreadCount = notificacoes.filter((n) => !n.lida).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.background }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: COLORS.primary }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
      {/* TopBar sem props isOpen/onClose */}
      <TopBar onLogout={handleLogout} username={username} />

      {/* Conteúdo principal - sem lg:pl-72 */}
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {stats && <StatsCards stats={stats} />}

          {/* 2 GRÁFICOS LADO A LADO */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gráfico de Linha */}
            <div className="rounded-xl shadow-sm border p-6" style={{ backgroundColor: COLORS.card, borderColor: COLORS.light }}>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${COLORS.primary}10` }}>
                  <TrendingUp size={18} style={{ color: COLORS.primary }} />
                </div>
                <h3 className="font-semibold" style={{ color: COLORS.text }}>Receita vs Despesa</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.light} />
                  <XAxis dataKey="mes" stroke={COLORS.textLight} fontSize={12} />
                  <YAxis stroke={COLORS.textLight} fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: COLORS.card,
                      border: `1px solid ${COLORS.light}`,
                      borderRadius: "8px",
                      color: COLORS.text,
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="receita" name="Receita (R$)" stroke={COLORS.primary} strokeWidth={2} dot={{ fill: COLORS.primary, r: 4 }} />
                  <Line type="monotone" dataKey="despesa" name="Despesa (R$)" stroke={COLORS.accent} strokeWidth={2} dot={{ fill: COLORS.accent, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico de Barras */}
            <div className="rounded-xl shadow-sm border p-6" style={{ backgroundColor: COLORS.card, borderColor: COLORS.light }}>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${COLORS.accent}10` }}>
                  <PieChartIcon size={18} style={{ color: COLORS.accent }} />
                </div>
                <h3 className="font-semibold" style={{ color: COLORS.text }}>Top Categorias</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.light} />
                  <XAxis dataKey="categoria" stroke={COLORS.textLight} fontSize={12} />
                  <YAxis stroke={COLORS.textLight} fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: COLORS.card,
                      border: `1px solid ${COLORS.light}`,
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="valor" name="Percentual (%)" fill={COLORS.accent} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cards complementares */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {usuarios.length > 0 && <UsersOnline users={usuarios} />}

            {categorias.length > 0 && (
              <div className="rounded-xl shadow-sm border p-6" style={{ backgroundColor: COLORS.card, borderColor: COLORS.light }}>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${COLORS.secondary}10` }}>
                    <PieChartIcon size={18} style={{ color: COLORS.secondary }} />
                  </div>
                  <h3 className="font-semibold" style={{ color: COLORS.text }}>Distribuição</h3>
                </div>
                <div className="space-y-4">
                  {categorias.map((cat, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span style={{ color: COLORS.textLight }}>{cat.nome}</span>
                        <span className="font-medium" style={{ color: COLORS.text }}>{cat.total}%</span>
                      </div>
                      <div className="w-full rounded-full h-2" style={{ backgroundColor: COLORS.light }}>
                        <div className="h-2 rounded-full" style={{ width: `${cat.total}%`, backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl shadow-sm border p-6" style={{ backgroundColor: COLORS.card, borderColor: COLORS.light }}>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${COLORS.primary}10` }}>
                  <Activity size={18} style={{ color: COLORS.primary }} />
                </div>
                <h3 className="font-semibold" style={{ color: COLORS.text }}>Evolução Mensal</h3>
                <div className="ml-auto flex items-center gap-1 text-xs px-2 py-1 rounded-full" style={{ backgroundColor: `${COLORS.accent}20`, color: COLORS.accent }}>
                  <TrendingUp size={12} />
                  <span>+12%</span>
                </div>
              </div>
              <div className="h-48 flex items-center justify-center">
                <div className="text-center">
                  <Activity size={40} style={{ color: COLORS.textLight }} />
                  <p className="text-sm mt-2" style={{ color: COLORS.textLight }}>Mais dados em breve</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {atividades.length > 0 && <RecentActivities activities={atividades} />}

            {relatorios.length > 0 && (
              <div className="rounded-xl shadow-sm border" style={{ backgroundColor: COLORS.card, borderColor: COLORS.light }}>
                <div className="p-6 border-b" style={{ borderBottomColor: COLORS.light }}>
                  <div className="flex items-center gap-2">
                    <FileText size={18} style={{ color: COLORS.accent }} />
                    <h3 className="font-semibold" style={{ color: COLORS.text }}>Relatórios</h3>
                  </div>
                </div>
                <div className="divide-y" style={{ borderColor: COLORS.light }}>
                  {relatorios.map((rel, i) => (
                    <div key={i} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium" style={{ color: COLORS.text }}>{rel.nome}</p>
                        <p className="text-xs" style={{ color: COLORS.textLight }}>{rel.descricao}</p>
                      </div>
                      <ChevronRight size={16} style={{ color: COLORS.textLight }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}