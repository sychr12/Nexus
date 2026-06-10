import { 
  DashboardStats, 
  UsuarioAtivo, 
  AtividadeRecente, 
  TopCategoria,
  Relatorio,
  Notificacao 
} from './types';
import { apiJson } from '../../lib/http';

export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    try {
      return await apiJson<DashboardStats>('/dashboard/stats');
    } catch {
      return {
        usuariosOnline: 3,
        usuariosOffline: 5,
        totalUsuarios: 8,
        totalLancamentos: 1248,
        totalMemorandos: 342,
        totalCartoes: 210,
        ultimoAcesso: new Date().toLocaleString('pt-BR')
      };
    }
  },

  async getUsuariosAtivos(): Promise<UsuarioAtivo[]> {
    try {
      return await apiJson<UsuarioAtivo[]>('/dashboard/usuarios-ativos');
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
      return await apiJson<AtividadeRecente[]>('/dashboard/atividades');
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
      return await apiJson<TopCategoria[]>('/dashboard/categorias');
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
      return await apiJson<Relatorio[]>('/dashboard/relatorios');
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
      return await apiJson<Notificacao[]>('/dashboard/notificacoes');
    } catch {
      return [
        { titulo: 'Memorando MEM-2024-0001', mensagem: 'Novo memorando criado', dataHora: 'Há 5 minutos', lida: false },
        { titulo: 'Novo lançamento', mensagem: 'Lançamento registrado', dataHora: 'Há 1 hora', lida: false },
        { titulo: 'Cartão emitido', mensagem: 'Cartão emitido com sucesso', dataHora: 'Há 2 horas', lida: true },
      ];
    }
  },
};
