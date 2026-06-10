
export interface User {
  id: number;
  username: string;
  nomeCompleto: string;
  telefone: string;
  perfil: 'ADMIN' | 'CHEFE' | 'USUARIO';
  status: 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
  cargo?: string;
  funcao?: string;
  foto?: string;
  criadoEm: string;
  ultimoLogin?: string;
  senhaAlteradaEm?: string;
  tentativasFalhas?: number;
  bloqueadoAte?: string;
}

export interface UserRequest {
  username: string;
  password: string;
  nomeCompleto: string;
  telefone: string;
  perfil: string;
  status: string;
  cargo?: string;
  funcao?: string;
}

export interface UserFilters {
  search?: string;
  perfil?: string;
  status?: string;
}

export interface UserStats {
  total: number;
  ativos: number;
  inativos: number;
  bloqueados: number;
  administradores: number;
  chefes: number;
  usuarios: number;
}
