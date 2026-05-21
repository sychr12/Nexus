export type MemoStatus = "recebido" | "em_analise" | "finalizado";
export type AnalysisViewMode = "memorandos" | "produtores";
export type ModalScope = "memorando" | "produtor";
export type Priority = "urgente" | "normal";
export type MotivoMemorando = "RENOVACAO" | "INSCRICAO" | "DEVOLUCAO";
export type ModalTab = "resumo" | "memorando" | "processos" | "decisao";
export type ChecklistStatus = "recebido" | "faltando" | "nao_obrigatorio";
export type ViewerKind = "processo" | "declaracao";
export type DispatchTarget = "lancamento" | "devolucao";
export type ProducerDecision = DispatchTarget | null;
export type MemorandoDecision = "correto" | "incorreto" | null;
export type TipoIdentificado = "nao_definido" | "inscricao" | "renovacao_alteracao";
export type GccStatus = "nao_consultado" | "sem_cadastro" | "cadastro_encontrado" | "divergencia";

export type MotivoMemorandoDevolucao =
  | "Documento ilegivel"
  | "Documento invalido"
  | "Assinatura ausente"
  | "Dados inconsistentes"
  | "Documento ausente";

export type MotivoProcessoDevolucao =
  | "Documento ausente"
  | "Documento ilegivel"
  | "Documento invalido"
  | "Data invalida"
  | "Cadastro divergente"
  | "CPF divergente";

export type TimelineEvent = {
  id: string;
  usuario: string;
  dataHora: string;
  acao: string;
  detalhe?: string;
  processoId?: number;
};

export type AnalysisFlags = {
  memorandoInvalido: boolean;
  checklistIncompleto: boolean;
  gccDivergente: boolean;
  declaracaoVencida: boolean;
  declaracaoFutura: boolean;
  cpfDivergente: boolean;
};

export interface ChecklistItem {
  nome: string;
  status: ChecklistStatus;
}

export interface ProcessoProdutor {
  id: number;
  produtor: string;
  cpf: string;
  processoPdf: string;
  declaracaoPdf: string;
  dataDeclaracao: string;
  recebidoEm: string;
  status?: string;
  decisao?: ProducerDecision;
  checklist: ChecklistItem[];
  tipoIdentificado?: TipoIdentificado;
  gccStatus?: GccStatus;
  dadosGccConferidos?: boolean;
  observacao: string;
  observacaoAtualizadaEm?: string;
  motivoDevolucao?: MotivoProcessoDevolucao;
  decisaoResponsavel?: string;
  decisaoEm?: string;
  encaminhadoPara?: DispatchTarget;
  encaminhadoEm?: string;
  flags?: Partial<AnalysisFlags>;
}

export interface MemorandoAnalise {
  id: number;
  numero: string;
  motivo: MotivoMemorando;
  titulo: string;
  localidade: string;
  emailOrigem: string;
  recebidoEm: string;
  prioridade: Priority;
  status: MemoStatus;
  produtoresInformados: number;
  memorandoPdf: string;
  memorandoChecklist?: ChecklistItem[];
  memorandoDecisao?: MemorandoDecision;
  motivoDevolucaoMemorando?: MotivoMemorandoDevolucao;
  observacaoMemorando?: string;
  memorandoResponsavel?: string;
  memorandoAnalisadoEm?: string;
  abertoPor?: string;
  abertoEm?: string;
  flags?: Partial<AnalysisFlags>;
  timeline?: TimelineEvent[];
  processos: ProcessoProdutor[];
}

export interface EncaminhamentoAnalise {
  id: string;
  memorandoId: number;
  memorandoNumero: string;
  memorandoTitulo: string;
  memorandoPdf: string;
  produtorId: number;
  produtor: string;
  cpf: string;
  localidade: string;
  processoPdf: string;
  declaracaoPdf: string;
  tipoIdentificado: string;
  resultadoConsulta: string;
  dataDeclaracao: string;
  recebidoEm: string;
  encaminhadoEm: string;
  destino: DispatchTarget;
  motivo?: string;
  observacao: string;
}
