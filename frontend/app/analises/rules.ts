/**
 * Lógica de negócio e regras da análise de memorandos.
 * Implementa:
 * - Validação de datas: declaração futura, vencida na chegada, vencida por atraso
 * - Cálculo de status: pendente (aguardando conferência) / apto / devolução / concluído
 * - Verificação de checklist: documentos faltando, não obrigatórios, etc.
 * - Lógica GCC: consulta ao sistema de busca (inscrição vs. renovação/alteração)
 * - Resumos: contadores de produtores por status, encaminhamentos, etc.
 * - Transições de workflow: próximo status após conclusão de processos
 * 
 * Centraliza toda a inteligência do sistema de análise.
 */


import { ANALYSIS_TODAY, COLORS, MEMORANDO_CHECKLIST_PADRAO } from "./data";
import type { ChecklistStatus, MemorandoAnalise, MemoStatus, ProcessoProdutor, ProducerStatus } from "./types";

export const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR");
};

export const formatTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

export const formatDateTime = (value?: string) => {
  if (!value) return "-";
  return `${formatDate(value)} às ${formatTime(value)}`;
};

const addMonths = (value: string, months: number) => {
  const date = new Date(`${value}T00:00:00`);
  date.setMonth(date.getMonth() + months);
  return date;
};

export const getDeclarationInfo = (processo: ProcessoProdutor) => {
  if (!processo.dataDeclaracao) {
    return {
      label: "Sem data",
      detail: "Informe a data da declaração para calcular a validade.",
      validade: "-",
      tone: "neutral",
      issue: "missing",
    };
  }

  const declaracao = new Date(`${processo.dataDeclaracao}T00:00:00`);
  const validade = addMonths(processo.dataDeclaracao, 6);
  const recebido = new Date(`${processo.recebidoEm}T00:00:00`);

  if (declaracao > ANALYSIS_TODAY || declaracao > recebido) {
    return {
      label: "Data inconsistente",
      detail: "A data da declaração não pode ser posterior ao recebimento do e-mail ou à data atual da análise. Confira o PDF antes de continuar.",
      validade: "-",
      tone: "warning",
      issue: "future",
    };
  }

  if (validade < recebido) {
    return {
      label: "Vencida no recebimento",
      detail: "A declaração já chegou vencida. O processo deve ir para devolução.",
      validade: validade.toLocaleDateString("pt-BR"),
      tone: "danger",
      issue: "expired_on_arrival",
    };
  }

  if (validade < ANALYSIS_TODAY) {
    return {
      label: "Venceu por atraso interno",
      detail: "A declaração estava válida quando chegou. Não penalizar o produtor pelo atraso da análise.",
      validade: validade.toLocaleDateString("pt-BR"),
      tone: "warning",
      issue: "expired_internal",
    };
  }

  return {
    label: "Válida",
    detail: "A declaração está dentro do prazo de 6 meses.",
    validade: validade.toLocaleDateString("pt-BR"),
    tone: "success",
    issue: "valid",
  };
};

export const getStatusTone = (status: ProducerStatus | MemoStatus) => {
  const tones: Record<string, { background: string; color: string; border: string }> = {
    recebido: { background: COLORS.background, color: COLORS.textLight, border: COLORS.border },
    em_analise: { background: "#EFF8FF", color: COLORS.info, border: "#B2DDFF" },
    lancamento: { background: "#ECFDF3", color: "#027A48", border: "#ABEFC6" },
    devolucao: { background: "#FEF3F2", color: COLORS.danger, border: "#FECDCA" },
    concluido: { background: `${COLORS.light}90`, color: COLORS.primary, border: COLORS.light },
    pendente: { background: "#FFFAEB", color: COLORS.warning, border: "#FEDF89" },
    apto: { background: "#ECFDF3", color: "#027A48", border: "#ABEFC6" },
  };

  return tones[status] || tones.recebido;
};

export const getChecklistTone = (status: ChecklistStatus) => {
  if (status === "recebido") return { background: "#ECFDF3", color: "#027A48", border: "#ABEFC6" };
  if (status === "faltando") return { background: "#FEF3F2", color: COLORS.danger, border: "#FECDCA" };
  return { background: COLORS.background, color: COLORS.textLight, border: COLORS.border };
};

export const getProcessoTipo = (processo: ProcessoProdutor) =>
  processo.tipoIdentificado || (processo.status === "apto" || processo.status === "devolucao" ? "renovacao_alteracao" : "nao_definido");

export const getProcessoGccStatus = (processo: ProcessoProdutor) =>
  processo.gccStatus || (processo.status === "apto" || processo.status === "devolucao" ? "cadastro_encontrado" : "nao_consultado");

export const isGccDataChecked = (processo: ProcessoProdutor) =>
  processo.dadosGccConferidos ?? (processo.status === "apto" || processo.status === "devolucao");

export const getMemorandoChecklist = (memorando: MemorandoAnalise) => memorando.memorandoChecklist || MEMORANDO_CHECKLIST_PADRAO;

export const hasMemorandoIssue = (memorando: MemorandoAnalise) =>
  getMemorandoChecklist(memorando).some((item) => item.status === "faltando");

const hasGccIssue = (processo: ProcessoProdutor) => {
  const tipo = getProcessoTipo(processo);
  const gccStatus = getProcessoGccStatus(processo);

  if (tipo === "nao_definido" || gccStatus === "nao_consultado") return "pending";
  if (gccStatus === "divergencia") return "issue";
  if (tipo === "inscricao" && gccStatus !== "sem_cadastro") return "issue";
  if (tipo === "inscricao" && gccStatus === "sem_cadastro") return "ok";
  if (tipo === "renovacao_alteracao" && gccStatus !== "cadastro_encontrado") return "issue";
  if (!isGccDataChecked(processo)) return "pending";

  return "ok";
};

export const getProcessoStatus = (processo: ProcessoProdutor): ProducerStatus => {
  if (processo.status === "concluido") return "concluido";

  const declaration = getDeclarationInfo(processo);
  const gccIssue = hasGccIssue(processo);
  if (declaration.issue === "expired_on_arrival") return "devolucao";
  if (declaration.issue === "future") return "devolucao";
  if (processo.checklist.some((item) => item.status === "faltando")) return "devolucao";
  if (gccIssue === "issue") return "devolucao";
  if (declaration.issue === "missing") return "pendente";
  if (gccIssue === "pending") return "pendente";

  return "apto";
};

export const getMemorandoSummary = (memorando: MemorandoAnalise) => {
  const summary = {
    total: memorando.processos.length,
    aptos: 0,
    pendentes: 0,
    devolucoes: 0,
    concluidos: 0,
    lancamentosEncaminhados: 0,
    devolucoesEncaminhadas: 0,
  };

  memorando.processos.forEach((processo) => {
    const status = getProcessoStatus(processo);
    if (status === "apto") summary.aptos += 1;
    if (status === "pendente") summary.pendentes += 1;
    if (status === "devolucao") summary.devolucoes += 1;
    if (status === "concluido") summary.concluidos += 1;
    if (processo.encaminhadoPara === "lancamento") summary.lancamentosEncaminhados += 1;
    if (processo.encaminhadoPara === "devolucao") summary.devolucoesEncaminhadas += 1;
  });

  return summary;
};

export const isMemorandoConcluido = (memorando: MemorandoAnalise) => {
  const summary = getMemorandoSummary(memorando);
  return memorando.status === "concluido" || (summary.total > 0 && summary.concluidos === summary.total);
};

export const getMaxDeclarationDate = (processo: ProcessoProdutor) => {
  const recebido = new Date(`${processo.recebidoEm}T00:00:00`);
  const maxDate = recebido < ANALYSIS_TODAY ? recebido : ANALYSIS_TODAY;
  return maxDate.toISOString().slice(0, 10);
};

export const getNextMemoStatusAfterCompletion = (processos: ProcessoProdutor[]): MemoStatus => {
  const allConcluded = processos.every((processo) => getProcessoStatus(processo) === "concluido");
  return allConcluded ? "concluido" : "em_analise";
};
