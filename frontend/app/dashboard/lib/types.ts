// app/dashboard/lib/types.ts
export interface DashboardStats {
  usuariosOnline: number;
  usuariosOffline: number;
  totalUsuarios: number;
  totalLancamentos: number;
  totalMemorandos: number;
  totalCartoes: number;
  totalEmails: number;
  ultimoAcesso: string;
}

export interface UsuarioAtivo {
  username: string;
  nome: string;
  perfil: string;
  ultimoAcesso: string;
  tempoOnline: string;
}

export interface AtividadeRecente {
  tipo: string;
  usuario: string;
  descricao: string;
  dataHora: string;
  icone: string;
}

export interface ChartData {
  dias: string[];
  valores: number[];
}

export interface TopCategoria {
  nome: string;
  total: number;
  percentage?: number;
}

export interface Relatorio {
  nome: string;
  descricao: string;
}

export interface Notificacao {
  titulo: string;
  mensagem: string;
  dataHora: string;
  lida: boolean;
}