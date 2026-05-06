// app/dashboard/lib/api.ts
import { 
  DashboardStats, 
  UsuarioAtivo, 
  AtividadeRecente, 
  ChartData,
  TopCategoria,
  Relatorio,
  Notificacao 
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

const headers = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`,
});

export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    try {
      const res = await fetch(`${API_URL}/dashboard/stats`, { headers: headers() });
      if (!res.ok) throw new Error('Erro ao carregar estatísticas');
      return res.json();
    } catch (error) {
      console.error('getStats:', error);
      // Retorna dados mock em caso de erro
      return {
        usuariosOnline: 0,
        usuariosOffline: 0,
        totalUsuarios: 0,
        totalLancamentos: 1248,
        totalMemorandos: 342,
        totalCartoes: 210,
        totalEmails: 532,
        ultimoAcesso: new Date().toLocaleString('pt-BR')
      };
    }
  },

  async getUsuariosAtivos(): Promise<UsuarioAtivo[]> {
    try {
      const res = await fetch(`${API_URL}/dashboard/usuarios-ativos`, { headers: headers() });
      if (!res.ok) throw new Error('Erro ao carregar usuários');
      return res.json();
    } catch (error) {
      console.error('getUsuariosAtivos:', error);
      // Retorna usuário admin como mock
      return [{
        username: 'admin',
        nome: 'Administrador',
        perfil: 'ADMIN',
        ultimoAcesso: new Date().toISOString(),
        tempoOnline: 'Agora'
      }];
    }
  },

  async getAtividadesRecentes(): Promise<AtividadeRecente[]> {
    try {
      const res = await fetch(`${API_URL}/dashboard/atividades`, { headers: headers() });
      if (!res.ok) throw new Error('Erro ao carregar atividades');
      return res.json();
    } catch (error) {
      console.error('getAtividadesRecentes:', error);
      return [];
    }
  },

  async getChartData(): Promise<ChartData> {
    try {
      const res = await fetch(`${API_URL}/dashboard/chart`, { headers: headers() });
      if (!res.ok) throw new Error('Erro ao carregar gráfico');
      return res.json();
    } catch (error) {
      console.error('getChartData:', error);
      const dias = [];
      const valores = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dias.push(date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
        valores.push(0);
      }
      return { dias, valores };
    }
  },

  async getTopCategorias(): Promise<TopCategoria[]> {
    try {
      const res = await fetch(`${API_URL}/dashboard/categorias`, { headers: headers() });
      if (!res.ok) throw new Error('Erro ao carregar categorias');
      return res.json();
    } catch (error) {
      console.error('getTopCategorias:', error);
      // Dados mock
      return [
        { nome: 'Combustível', total: 36 },
        { nome: 'Insumos', total: 25 },
        { nome: 'Serviços', total: 20 },
        { nome: 'Outros', total: 19 },
      ];
    }
  },

  async getRelatorios(): Promise<Relatorio[]> {
    try {
      const res = await fetch(`${API_URL}/dashboard/relatorios`, { headers: headers() });
      if (!res.ok) throw new Error('Erro ao carregar relatórios');
      return res.json();
    } catch (error) {
      console.error('getRelatorios:', error);
      // Dados mock
      return [
        { nome: 'Relatório de Lançamentos', descricao: 'Lançamentos por período' },
        { nome: 'Memorando por status', descricao: 'Memorando' },
        { nome: 'Cartões emitidos', descricao: 'Cartões emitidos' },
        { nome: 'Relatório Financeiro', descricao: 'Resumo financeiro' },
        { nome: 'Relatório de E-mails', descricao: 'E-mails enviados' },
      ];
    }
  },

  async getNotificacoes(): Promise<Notificacao[]> {
    try {
      const res = await fetch(`${API_URL}/dashboard/notificacoes`, { headers: headers() });
      if (!res.ok) throw new Error('Erro ao carregar notificações');
      return res.json();
    } catch (error) {
      console.error('getNotificacoes:', error);
      // Dados mock
      return [
        { titulo: 'Memorando MEM-2024-0001', mensagem: 'Novo memorando criado', dataHora: 'Há 5 minutos', lida: false },
        { titulo: 'Novo lançamento adicional', mensagem: 'Lançamento registrado', dataHora: 'Há 1 hora', lida: false },
        { titulo: 'Cartão emitido com sucesso', mensagem: 'Cartão emitido', dataHora: 'Há 2 horas', lida: true },
        { titulo: 'E-mail enviado para SEFAZ', mensagem: 'E-mail enviado', dataHora: 'Há 3 horas', lida: true },
        { titulo: 'Backup realizado com sucesso', mensagem: 'Backup concluído', dataHora: 'Há 5 horas', lida: true },
      ];
    }
  },
};