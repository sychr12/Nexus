export interface Memorando {
  id: number;
  numero: string;
  descricao: string;
  unloc: string;
  municipio: string;
  memoEntrada: string;
  dataEmissao: string;
  usuario: string;
}

export interface MemorandoForm {
  numero: string;
  descricao: string;
  unloc: string;
  memoEntrada: string;
}