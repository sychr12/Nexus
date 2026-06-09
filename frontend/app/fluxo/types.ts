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
  categoria: "obrigatorio" | "outros" | "fac_assinada";
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

export type GerenteUnidadeStatus = "ativo" | "inativo" | "respondendo";

export type GerenteUnidade = {
  id: string;
  nome: string;
  unidadeLocal: string;
  cargo: string;
  email: string;
  telefoneCorporativo: string;
  telefonePessoal: string;
  status: GerenteUnidadeStatus;
  cadastradoEm: string;
  encerradoEm?: string;
};

export type DocumentoAssinadoRegistro = {
  tipo: "memorando" | "declaracao_produtor" | "formulario" | "declaracoes";
  nome: string;
  arquivo: string;
  codigoDocumento: string;
};

export type FacStatus = "nao_gerada" | "gerada" | "assinada_anexada" | "rejeitada";

export type AssinaturaEletronica = {
  id: string;
  loteId: string;
  codigoValidacao: string;
  assinadaEm: string;
  gerenteId: string;
  gerenteNome: string;
  gerenteCargo: string;
  gerenteStatus: GerenteUnidadeStatus;
  gerenteEmail: string;
  gerenteTelefoneCorporativo: string;
  gerenteTelefonePessoal: string;
  unidadeLocal: string;
  memorandoNumero: string;
  quantidadeProcessos: number;
  quantidadeProdutores: number;
  documentosAssinados: DocumentoAssinadoRegistro[];
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
  assinatura?: AssinaturaEletronica;
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
  facStatus?: FacStatus;
  facGeradaEm?: string;
  facGeradaPor?: string;
  facImpressaEm?: string;
  facImpressaPor?: string;
  facAssinadaAnexadaEm?: string;
  facAssinadaAnexadaPor?: string;
  facAssinadaDocumentoId?: string;
  facRejeitadaMotivo?: string;
  documentos: DocumentoProcesso[];
  situacao: SituacaoProcessoSicpr;
  criadoEm: string;
  encaminhadoGerenteEm?: string;
  gerenteResponsavel?: string;
  gerenteAssinadoEm?: string;
  assinaturaEletronica?: AssinaturaEletronica;
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
