import { 
  DashboardStats, 
  UsuarioAtivo, 
  AtividadeRecente, 
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
      if (!res.ok) throw new Error('Erro');
      return res.json();
    } catch {
      return {
        usuariosOnline: 3,
        usuariosOffline: 5,
        totalUsuarios: 8,
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
      if (!res.ok) throw new Error('Erro');
      return res.json();
    } catch {
      return [
        { username: 'admin', nome: 'Administrador', perfil: 'ADMIN', ultimoAcesso: new Date().toISOString(), tempoOnline: 'Agora' },
        { username: 'joao', nome: 'João Silva', perfil: 'USUARIO', ultimoAcesso: new Date().toISOString(), tempoOnline: '5 min' },
        { username: 'maria', nome: 'Maria Santos', perfil: 'USUARIO', ultimoAcesso: new Date().toISOString(), tempoOnline: '15 min' }
      ];
    }
  },

  async getAtividadesRecentes(): Promise<AtividadeRecente[]> {
    try {
      const res = await fetch(`${API_URL}/dashboard/atividades`, { headers: headers() });
      if (!res.ok) throw new Error('Erro');
      return res.json();
    } catch {
      return [
        { tipo: 'RELATORIO', usuario: 'João', descricao: 'Gerou relatório de lançamentos', dataHora: new Date().toISOString(), icone: '' },
        { tipo: 'MEMORANDO', usuario: 'Maria', descricao: 'Criou novo memorando', dataHora: new Date().toISOString(), icone: '' },
        { tipo: 'CARTAO', usuario: 'Pedro', descricao: 'Emitiu novo cartão', dataHora: new Date().toISOString(), icone: '' },
      ];
    }
  },

  async getTopCategorias(): Promise<TopCategoria[]> {
    try {
      const res = await fetch(`${API_URL}/dashboard/categorias`, { headers: headers() });
      if (!res.ok) throw new Error('Erro');
      return res.json();
    } catch {
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
      if (!res.ok) throw new Error('Erro');
      return res.json();
    } catch {
      return [
        { nome: 'Relatório de Lançamentos', descricao: 'Lançamentos por período' },
        { nome: 'Memorando por status', descricao: 'Memorandos emitidos' },
        { nome: 'Cartões emitidos', descricao: 'Cartões por produtor' },
        { nome: 'Relatório Financeiro', descricao: 'Resumo financeiro' },
      ];
    }
  },

  async getNotificacoes(): Promise<Notificacao[]> {
    try {
      const res = await fetch(`${API_URL}/dashboard/notificacoes`, { headers: headers() });
      if (!res.ok) throw new Error('Erro');
      return res.json();
    } catch {
      return [
        { titulo: 'Memorando MEM-2024-0001', mensagem: 'Novo memorando criado', dataHora: 'Há 5 minutos', lida: false },
        { titulo: 'Novo lançamento', mensagem: 'Lançamento registrado', dataHora: 'Há 1 hora', lida: false },
        { titulo: 'Cartão emitido', mensagem: 'Cartão emitido com sucesso', dataHora: 'Há 2 horas', lida: true },
      ];
    }
  },
};