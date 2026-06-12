export interface DashboardStats {
  usuariosOnline: number;
  usuariosOffline: number;
  totalUsuarios: number;
  usuariosAtivos: number;
  usuariosBloqueados: number;
  totalInscricoes: number;
  inscricoesHoje: number;
  totalLancamentos: number;
  totalMemorandos: number;
  memorandosHoje: number;
  totalCartoes: number;
  cartoesHoje: number;
  totalProcessosFluxo: number;
  processosEmElaboracao: number;
  processosGerente: number;
  processosAnalise: number;
  processosLancamento: number;
  processosConcluidos: number;
  processosDevolvidos: number;
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

export interface TopCategoria {
  nome: string;
  total: number;
}

export interface Relatorio {
  nome: string;
  descricao: string;
  rota: string;
}

export interface Notificacao {
  titulo: string;
  mensagem: string;
  dataHora: string;
  lida: boolean;
}

export interface ChartData {
  dias: string[];
  valores: number[];
}
