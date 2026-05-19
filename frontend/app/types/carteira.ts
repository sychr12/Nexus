// frontend/app/types/carteira.ts

// Tipos para o backend Spring Boot - Carteira Digital
export interface CarteiraResponse {
  id: number;
  registro: string;
  cpf: string;
  nome: string;
  propriedade: string;
  unloc: string;
  inicio: string;
  validade: string;
  endereco: string;
  atividade1: string;
  atividade2: string;
  georef: string;
  usuario: string;
  createdAt: string;
  fotosBase64?: string[];
}

export interface CarteiraRequest {
  registro: string;
  cpf: string;
  nome: string;
  propriedade: string;
  unloc: string;
  inicio: string;
  validade: string;
  endereco: string;
  atividade1: string;
  atividade2: string;
  georef: string;
  fotos?: File[];
}

export interface FiltroBusca {
  termoPesquisa?: string;
  periodo?: string;
  usuario?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface CarteiraEstatistica {
  totalCarteiras: number;
  totalUsuarios: number;
  totalPorUnloc: Record<string, number>;
}

// Tipos para o modal de lote
export interface BatchResult {
  batchId: string;
  totalArquivos: number;
  sucessos: number;
  erros: number;
  ignorados: number;
  tempoTotalMs: number;
  detalhes: BatchItem[];
}

export interface BatchItem {
  arquivo: string;
  cpf: string;
  sucesso: boolean;
  mensagem: string;
}

// Tipos legados para compatibilidade
export interface CarteiraEntrada {
  id: number;
  descricao: string;
  valor: number;
  data: string;
  usuario: string;
}

export interface CarteiraUsuario {
  id: string;
  nome: string;
}

export interface CarteiraForm {
  descricao: string;
  valor: number;
  usuarioId: string;
}