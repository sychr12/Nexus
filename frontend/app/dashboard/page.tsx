// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Send,
  DollarSign,
  Wallet,
  Search,
  Paperclip,
  TrendingUp,
  LogOut,
  Bell,
  User,
  Settings,
  Menu,
  X,
  Home,
  CreditCard,
  Mail,
  PieChart,
  BarChart3,
  Activity,
  ChevronRight
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard / KPIs', icon: LayoutDashboard },
    { id: 'relatorios', label: 'Relatórios', icon: FileText },
    { id: 'memorando', label: 'Memorando de Saída', icon: Send },
    { id: 'lancamentos', label: 'Lançamentos', icon: DollarSign },
    { id: 'carteira', label: 'Carteira Digital', icon: Wallet },
    { id: 'consultar', label: 'Consultar', icon: Search },
    { id: 'anexar', label: 'Anexar', icon: Paperclip },
    { id: 'analises', label: 'Análises', icon: TrendingUp },
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadUsuarios();
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timeInterval);
  }, []);

  async function loadUsuarios() {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const res = await fetch('http://localhost:8080/api/dashboard/usuarios-ativos', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        setUsuarios(data);
      } else {
        setUsuarios([]);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    router.push('/login');
  }

  const username = typeof window !== 'undefined' ? localStorage.getItem('username') : 'Usuário';

  // Tudo zerado ou vazio
  const kpiCards = [
    { title: 'Lançamentos', value: 0, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Memorandos', value: 0, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Cartões Emitidos', value: 0, icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'E-mails Emitidos', value: 0, icon: Mail, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const categorias = [
    { nome: 'Combustível', percentage: 0, color: 'bg-emerald-500' },
    { nome: 'Insumos', percentage: 0, color: 'bg-blue-500' },
    { nome: 'Serviços', percentage: 0, color: 'bg-amber-500' },
    { nome: 'Outros', percentage: 0, color: 'bg-gray-500' },
  ];

  const relatorios: any[] = [];
  const notificacoes: any[] = [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <Home size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">SICPR</h1>
                <p className="text-xs text-gray-500">Sistema Integrado de Controle</p>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-6">
              <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">{username}</p>
                  <p className="text-xs text-gray-400">
                    {currentTime.toLocaleDateString('pt-BR')} - {currentTime.toLocaleTimeString('pt-BR')}
                  </p>
                </div>
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User size={16} className="text-emerald-600" />
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={16} />
                <span>Sair</span>
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User size={20} className="text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{username}</p>
                  <p className="text-xs text-gray-400">Usuário</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <button className="flex items-center gap-3 w-full p-3 text-gray-600 hover:bg-gray-50 rounded-lg">
                <Bell size={18} />
                <span>Notificações</span>
              </button>
              <button className="flex items-center gap-3 w-full p-3 text-gray-600 hover:bg-gray-50 rounded-lg">
                <Settings size={18} />
                <span>Configurações</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full p-3 text-red-600 hover:bg-red-50 rounded-lg mt-4"
              >
                <LogOut size={18} />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Abas */}
      <div className="bg-white border-b border-gray-200 sticky top-[61px] z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                    ${activeTab === tab.id 
                      ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-600' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }
                  `}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* KPI Cards - ZERADOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {kpiCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center`}>
                        <Icon size={24} className={card.color} />
                      </div>
                      <span className="text-3xl font-bold text-gray-800">{card.value}</span>
                    </div>
                    <h3 className="text-gray-600 text-sm mb-1">{card.title}</h3>
                    <p className="text-xs text-gray-400">últimos 30 dias</p>
                  </div>
                );
              })}
            </div>

            {/* Gráfico e Categorias */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Usuários Ativos - DO BANCO */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <User size={18} className="text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Usuários Ativos</h3>
                  <span className="ml-auto text-sm text-emerald-600">{usuarios.length} online</span>
                </div>
                <div className="space-y-3 max-h-64 overflow-auto">
                  {usuarios.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      <User size={40} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Nenhum usuário ativo</p>
                    </div>
                  ) : (
                    usuarios.map((user, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{user.nome || user.username}</p>
                          <p className="text-xs text-gray-400">@{user.username} · {user.perfil}</p>
                        </div>
                        <span className="text-xs text-emerald-600">{user.tempoOnline || 'Agora'}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Top Categorias - ZERADAS */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                    <PieChart size={18} className="text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Top Categorias</h3>
                </div>
                <div className="space-y-4">
                  {categorias.map((cat, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{cat.nome}</span>
                        <span className="font-medium text-gray-800">{cat.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className={`${cat.color} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evolução Mensal - ZERADA */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <BarChart3 size={18} className="text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Evolução Mensal</h3>
                  <div className="ml-auto flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    <Activity size={12} />
                    <span>0%</span>
                  </div>
                </div>
                <div className="h-48 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <Activity size={40} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Sem dados disponíveis</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Relatórios e Notificações - VAZIOS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Relatórios - VAZIO */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <FileText size={18} className="text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-gray-800">Relatórios</h3>
                    </div>
                    <button className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                      Ver todos <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                  <div className="p-8 text-center text-gray-400">
                    <FileText size={40} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Nenhum relatório disponível</p>
                  </div>
                </div>
              </div>

              {/* Notificações - VAZIO */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                        <Bell size={18} className="text-amber-600" />
                      </div>
                      <h3 className="font-semibold text-gray-800">Notificações</h3>
                    </div>
                    <button className="text-xs text-gray-400 hover:text-gray-600">
                      Marcar todas como lidas
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                  <div className="p-8 text-center text-gray-400">
                    <Bell size={40} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Nenhuma notificação</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Outras Abas */}
        {activeTab !== 'dashboard' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                {(() => {
                  const tab = tabs.find(t => t.id === activeTab);
                  const Icon = tab?.icon || LayoutDashboard;
                  return <Icon size={40} className="text-gray-400" />;
                })()}
              </div>
              <h2 className="text-xl font-semibold text-gray-800">
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
              <p className="text-gray-500 mt-2">Módulo em desenvolvimento</p>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="flex justify-around py-2">
          {tabs.slice(0, 4).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all
                  ${activeTab === tab.id ? 'text-emerald-600' : 'text-gray-500'}
                `}
              >
                <Icon size={20} />
                <span className="text-xs">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
          <button className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-gray-500">
            <Menu size={20} />
            <span className="text-xs">Mais</span>
          </button>
        </div>
      </div>

      <div className="lg:hidden h-16"></div>
    </div>
  );
}