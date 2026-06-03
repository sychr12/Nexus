export type TipoProcessoSicpr = "inscricao" | "renovacao" | "alteracao";

export type SituacaoProcessoSicpr =
  | "em_elaboracao"
  | "encaminhado_gerente"
  | "devolvido_gerente"
  | "aprovado_gerente"
  | "em_analise"
  | "devolvido_analise"
  | "aprovado_lancamento"
  | "concluido";

export type DocumentoProcesso = {
  id: string;
  nome: string;
  arquivo: string;
  obrigatorio: boolean;
  categoria: "obrigatorio" | "outros";
  conteudo?: string;
  mimeType?: string;
  tamanho?: number;
};

export type DocumentoGeradoProcesso = {
  nome: string;
  arquivo: string;
  tipo: "formulario" | "declaracao_produtor" | "fac" | "declaracoes" | "memorando";
  preenchido?: boolean;
  dados?: Record<string, string>;
};

export type ProdutorMemorandoLote = {
  id: string;
  produtor: string;
  cpf: string;
  tipoProcesso: TipoProcessoSicpr;
};

export type MemorandoProcessoRegistro = {
  loteId: string;
  numero: string;
  arquivo: string;
  criadoEm: string;
  gerenteResponsavel: string;
  unidadeLocal: string;
  quantidade: number;
  produtores: ProdutorMemorandoLote[];
};

export type HistoricoProcesso = {
  id: string;
  usuario: string;
  acao: string;
  dataHora: string;
  observacao?: string;
};

export type ProcessoSicpr = {
  id: string;
  produtor: string;
  cpf: string;
  tipoProcesso: TipoProcessoSicpr;
  unidadeLocal: string;
  tecnicoResponsavel: string;
  formulario: string;
  fac: string;
  declaracaoProdutor: string;
  declaracoes: string;
  memorandoArquivo?: string;
  memorandoCriadoEm?: string;
  memorandoQuantidade?: number;
  memorandoProdutores?: ProdutorMemorandoLote[];
  memorandos?: MemorandoProcessoRegistro[];
  documentosGerados?: Partial<Record<DocumentoGeradoProcesso["tipo"], Record<string, string>>>;
  documentos: DocumentoProcesso[];
  situacao: SituacaoProcessoSicpr;
  criadoEm: string;
  encaminhadoGerenteEm?: string;
  gerenteResponsavel?: string;
  gerenteAssinadoEm?: string;
  memorandoNumero?: string;
  memorandoLoteId?: string;
  enviadoAnaliseEm?: string;
  analistaResponsavel?: string;
  analisadoEm?: string;
  lancadoPor?: string;
  lancadoEm?: string;
  ultimaJustificativa?: string;
  historico: HistoricoProcesso[];
};
