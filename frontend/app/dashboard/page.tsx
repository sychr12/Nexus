"use client";

import { useState, useEffect } from "react";
import { PieChart as PieChartIcon, Activity, FileText, ChevronRight, TrendingUp } from "lucide-react";
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
import Sidebar from "../sidebar/page";

import StatsCards from "./components/StatsCards";
import UsersOnline from "./components/UsersOnline";
import RecentActivities from "./components/RecentActivities";
import { dashboardApi } from "./lib/api";
import { useAuthSession } from "../hooks/useAuthSession";
import {
  DashboardStats,
  UsuarioAtivo,
  AtividadeRecente,
  TopCategoria,
  Relatorio,
  Notificacao,
} from "./lib/types";

// Animações CSS
const animations = `
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;

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
  const { username, logout, ready } = useAuthSession({ defaultUsername: "Usuario" });
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioAtivo[]>([]);
  const [atividades, setAtividades] = useState<AtividadeRecente[]>([]);
  const [categorias, setCategorias] = useState<TopCategoria[]>([]);
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [animated, setAnimated] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    if (!document.getElementById("dashboard-animations")) {
      const style = document.createElement("style");
      style.id = "dashboard-animations";
      style.textContent = animations;
      document.head.appendChild(style);
    }
  }, [mounted]);

  useEffect(() => {
    if (!ready || !mounted) return;
    loadAll();
    
    // Ativa animações após carregamento
    setTimeout(() => setAnimated(true), 100);
  }, [ready, mounted]);

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

  if (!mounted || loading || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.background }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: COLORS.primary }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
      <Sidebar 
        onLogout={logout} 
        username={username || "Usuário"} 
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Conteúdo principal com margem dinâmica para o sidebar */}
      <main 
        className="transition-all duration-300 min-h-screen"
        style={{ marginLeft: sidebarCollapsed ? '72px' : '260px' }}
      >
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* TÍTULO DO DASHBOARD */}
            <div style={{ animation: animated ? "fadeInUp 0.5s ease-out" : "none" }}>
              <h1 className="text-3xl font-bold tracking-tight" style={{ color: COLORS.primary }}>
                Dashboard
              </h1>
              <p className="text-sm mt-1" style={{ color: COLORS.textLight }}>
                Visão geral do sistema e métricas principais
              </p>
            </div>

            {/* Stats Cards com animação */}
            <div style={{ animation: animated ? "fadeInUp 0.6s ease-out 0.1s both" : "none" }}>
              {stats && <StatsCards stats={stats} />}
            </div>

            {/* 2 GRÁFICOS LADO A LADO */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Gráfico de Linha */}
              <div 
                className="rounded-xl shadow-sm border p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                style={{ 
                  backgroundColor: COLORS.card, 
                  borderColor: COLORS.light,
                  animation: animated ? "fadeInLeft 0.6s ease-out 0.2s both" : "none"
                }}
              >
                <div className="flex items-center gap-2 mb-6">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110" 
                    style={{ backgroundColor: `${COLORS.primary}10` }}
                  >
                    <TrendingUp size={18} style={{ color: COLORS.primary }} />
                  </div>
                  <h3 className="font-semibold transition-colors duration-300" style={{ color: COLORS.text }}>Receita vs Despesa</h3>
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
                    <Line 
                      type="monotone" 
                      dataKey="receita" 
                      name="Receita (R$)" 
                      stroke={COLORS.primary} 
                      strokeWidth={2} 
                      dot={{ fill: COLORS.primary, r: 4 }}
                      animationDuration={1500}
                      animationBegin={300}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="despesa" 
                      name="Despesa (R$)" 
                      stroke={COLORS.accent} 
                      strokeWidth={2} 
                      dot={{ fill: COLORS.accent, r: 4 }}
                      animationDuration={1500}
                      animationBegin={500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Gráfico de Barras */}
              <div 
                className="rounded-xl shadow-sm border p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                style={{ 
                  backgroundColor: COLORS.card, 
                  borderColor: COLORS.light,
                  animation: animated ? "fadeInRight 0.6s ease-out 0.2s both" : "none"
                }}
              >
                <div className="flex items-center gap-2 mb-6">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110" 
                    style={{ backgroundColor: `${COLORS.accent}10` }}
                  >
                    <PieChartIcon size={18} style={{ color: COLORS.accent }} />
                  </div>
                  <h3 className="font-semibold transition-colors duration-300" style={{ color: COLORS.text }}>Top Categorias</h3>
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
                    <Bar 
                      dataKey="valor" 
                      name="Percentual (%)" 
                      fill={COLORS.accent} 
                      radius={[8, 8, 0, 0]} 
                      animationDuration={1500}
                      animationBegin={300}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cards complementares */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* UsersOnline com animação */}
              <div style={{ animation: animated ? "fadeInUp 0.5s ease-out 0.3s both" : "none" }}>
                {usuarios.length > 0 && <UsersOnline users={usuarios} />}
              </div>

              {/* Distribuição */}
              {categorias.length > 0 && (
                <div 
                  className="rounded-xl shadow-sm border p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                  style={{ 
                    backgroundColor: COLORS.card, 
                    borderColor: COLORS.light,
                    animation: animated ? "fadeInUp 0.5s ease-out 0.4s both" : "none"
                  }}
                >
                  <div className="flex items-center gap-2 mb-6">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110" 
                      style={{ backgroundColor: `${COLORS.secondary}10` }}
                    >
                      <PieChartIcon size={18} style={{ color: COLORS.secondary }} />
                    </div>
                    <h3 className="font-semibold" style={{ color: COLORS.text }}>Distribuição</h3>
                  </div>
                  <div className="space-y-4">
                    {categorias.map((cat, i) => (
                      <div 
                        key={i} 
                        className="transition-all duration-300 hover:translate-x-1"
                        style={{ animation: animated ? `fadeInRight 0.3s ease-out ${i * 0.1 + 0.5}s both` : "none" }}
                      >
                        <div className="flex justify-between text-sm mb-1">
                          <span style={{ color: COLORS.textLight }}>{cat.nome}</span>
                          <span className="font-medium" style={{ color: COLORS.text }}>{cat.total}%</span>
                        </div>
                        <div className="w-full rounded-full h-2" style={{ backgroundColor: COLORS.light }}>
                          <div 
                            className="h-2 rounded-full transition-all duration-1000 ease-out"
                            style={{ 
                              width: `${cat.total}%`, 
                              backgroundColor: CAT_COLORS[i % CAT_COLORS.length],
                              animation: animated ? "slideIn 0.8s ease-out" : "none"
                            }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evolução Mensal */}
              <div 
                className="rounded-xl shadow-sm border p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                style={{ 
                  backgroundColor: COLORS.card, 
                  borderColor: COLORS.light,
                  animation: animated ? "fadeInUp 0.5s ease-out 0.5s both" : "none"
                }}
              >
                <div className="flex items-center gap-2 mb-6">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110" 
                    style={{ backgroundColor: `${COLORS.primary}10` }}
                  >
                    <Activity size={18} style={{ color: COLORS.primary }} />
                  </div>
                  <h3 className="font-semibold" style={{ color: COLORS.text }}>Evolução Mensal</h3>
                  <div 
                    className="ml-auto flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-all duration-300 hover:scale-105"
                    style={{ backgroundColor: `${COLORS.accent}20`, color: COLORS.accent }}
                  >
                    <TrendingUp size={12} className="animate-pulse" />
                    <span>+12%</span>
                  </div>
                </div>
                <div className="h-48 flex items-center justify-center">
                  <div className="text-center transition-all duration-300 hover:scale-105">
                    <Activity size={40} style={{ color: COLORS.textLight }} />
                    <p className="text-sm mt-2" style={{ color: COLORS.textLight }}>Mais dados em breve</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Activities */}
              <div style={{ animation: animated ? "fadeInUp 0.5s ease-out 0.6s both" : "none" }}>
                {atividades.length > 0 && <RecentActivities activities={atividades} />}
              </div>

              {/* Relatórios */}
              {relatorios.length > 0 && (
                <div 
                  className="rounded-xl shadow-sm border transition-all duration-300 hover:shadow-lg"
                  style={{ 
                    backgroundColor: COLORS.card, 
                    borderColor: COLORS.light,
                    animation: animated ? "fadeInUp 0.5s ease-out 0.7s both" : "none"
                  }}
                >
                  <div className="p-6 border-b" style={{ borderBottomColor: COLORS.light }}>
                    <div className="flex items-center gap-2">
                      <FileText size={18} style={{ color: COLORS.accent }} />
                      <h3 className="font-semibold" style={{ color: COLORS.text }}>Relatórios</h3>
                    </div>
                  </div>
                  <div className="divide-y" style={{ borderColor: COLORS.light }}>
                    {relatorios.map((rel, i) => (
                      <div 
                        key={i} 
                        className="p-4 hover:bg-gray-50 flex items-center justify-between transition-all duration-300 hover:translate-x-1 cursor-pointer"
                        style={{ animation: animated ? `fadeInRight 0.3s ease-out ${i * 0.1 + 0.7}s both` : "none" }}
                      >
                        <div>
                          <p className="text-sm font-medium transition-colors duration-300" style={{ color: COLORS.text }}>{rel.nome}</p>
                          <p className="text-xs" style={{ color: COLORS.textLight }}>{rel.descricao}</p>
                        </div>
                        <ChevronRight 
                          size={16} 
                          style={{ color: COLORS.textLight }} 
                          className="transition-all duration-300 group-hover:translate-x-1" 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}