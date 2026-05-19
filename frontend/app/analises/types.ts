/**
 * Definições de tipos TypeScript para a área de análises.
 * Inclui todas as interfaces e tipos para:
 * - Memorandos (MemorandoAnalise) com status e lista de processos
 * - Processos por produtor (ProcessoProdutor) com documentos e checklist
 * - Encaminhamentos (EncaminhamentoAnalise) para lançamento/devolução
 * - Estados do workflow (MemoStatus, ProducerStatus, ModalScope, etc.)
 * 
 * Fornece type safety completo para toda a aplicação de análise.
 */


export type MemoStatus = "recebido"  | "em_analise"  | "lancamento" | "devolucao" | "concluido";
export type AnalysisViewMode = "memorandos" | "produtores";
export type ModalScope = "memorando" | "produtor";
export type Priority = "urgente" | "normal";
export type MotivoMemorando = "RENOVACAO" | "INSCRICAO" | "DEVOLUCAO";
export type ModalTab = "resumo" | "memorando" | "processos" | "observacoes" | "fluxo";
export type ChecklistStatus = "recebido" | "faltando" | "nao_obrigatorio";
export type ProducerStatus = "pendente"  | "apto"  | "devolucao" | "concluido";
export type ViewerKind = "processo" | "declaracao";
export type DispatchTarget = "lancamento" | "devolucao";
export type FlowCompletionAction = "lancamento_aptos" | "devolucao_processos" | "lancamento_produtor" | "devolucao_produtor";
export type TipoIdentificado = "nao_definido" | "inscricao" | "renovacao_alteracao";
export type GccStatus = "nao_consultado" | "sem_cadastro" | "cadastro_encontrado" | "divergencia";

export type PendingFlowAction = {
  title: string;
  message: string;
  confirmLabel: string;
  applyStatus?: MemoStatus;
  completionAction?: FlowCompletionAction;
  notice?: string;
  tone: "warning" | "danger" | "info";
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
  status: ProducerStatus;
  checklist: ChecklistItem[];
  tipoIdentificado?: TipoIdentificado;
  gccStatus?: GccStatus;
  dadosGccConferidos?: boolean;
  observacao: string;
  observacaoAtualizadaEm?: string;
  encaminhadoPara?: DispatchTarget;
  encaminhadoEm?: string;
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
  observacao: string;
}
