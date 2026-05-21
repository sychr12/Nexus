import { ANALYSIS_TODAY, COLORS, MEMORANDO_CHECKLIST_PADRAO } from "./data";
import type {
  AnalysisFlags,
  ChecklistStatus,
  MemorandoAnalise,
  MemoStatus,
  MotivoProcessoDevolucao,
  ProcessoProdutor,
} from "./types";

export const emptyFlags = (): AnalysisFlags => ({
  memorandoInvalido: false,
  checklistIncompleto: false,
  gccDivergente: false,
  declaracaoVencida: false,
  declaracaoFutura: false,
  cpfDivergente: false,
});

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
  return `${formatDate(value)} as ${formatTime(value)}`;
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
      detail: "Informe a data da declaracao antes de decidir.",
      validade: "-",
      tone: "danger" as const,
      issue: "missing" as const,
      blocking: true,
      autoMotivo: "Data invalida" as MotivoProcessoDevolucao,
    };
  }

  const declaracao = new Date(`${processo.dataDeclaracao}T00:00:00`);
  const validade = addMonths(processo.dataDeclaracao, 6);
  const recebido = new Date(`${processo.recebidoEm}T00:00:00`);

  if (Number.isNaN(declaracao.getTime())) {
    return {
      label: "Data invalida",
      detail: "A data informada nao pode ser validada.",
      validade: "-",
      tone: "danger" as const,
      issue: "invalid" as const,
      blocking: true,
      autoMotivo: "Data invalida" as MotivoProcessoDevolucao,
    };
  }

  if (declaracao > ANALYSIS_TODAY) {
    return {
      label: "Data futura",
      detail: "A declaracao tem data futura. O lancamento fica bloqueado.",
      validade: "-",
      tone: "danger" as const,
      issue: "future" as const,
      blocking: true,
      autoMotivo: "Data invalida" as MotivoProcessoDevolucao,
    };
  }

  if (declaracao > recebido) {
    return {
      label: "Data posterior ao recebimento",
      detail: "A declaracao foi emitida depois do recebimento do memorando.",
      validade: "-",
      tone: "danger" as const,
      issue: "after_receipt" as const,
      blocking: true,
      autoMotivo: "Data invalida" as MotivoProcessoDevolucao,
    };
  }

  if (validade < recebido) {
    return {
      label: "Vencida no recebimento",
      detail: "A declaracao ja chegou vencida. O processo deve ir para devolucao.",
      validade: validade.toLocaleDateString("pt-BR"),
      tone: "danger" as const,
      issue: "expired_on_arrival" as const,
      blocking: true,
      autoMotivo: "Data invalida" as MotivoProcessoDevolucao,
    };
  }

  if (validade < ANALYSIS_TODAY) {
    return {
      label: "Venceu apos chegar",
      detail: "Chegou valida e venceu por atraso interno. Permitir lancamento e registrar ocorrencia.",
      validade: validade.toLocaleDateString("pt-BR"),
      tone: "warning" as const,
      issue: "expired_internal" as const,
      blocking: false,
      autoMotivo: undefined,
    };
  }

  return {
    label: "Valida",
    detail: "A declaracao esta dentro do prazo de 6 meses.",
    validade: validade.toLocaleDateString("pt-BR"),
    tone: "success" as const,
    issue: "valid" as const,
    blocking: false,
    autoMotivo: undefined,
  };
};

export const getStatusTone = (status: string) => {
  const tones: Record<string, { background: string; color: string; border: string }> = {
    recebido: { background: COLORS.background, color: COLORS.textLight, border: COLORS.border },
    em_analise: { background: "#EFF8FF", color: COLORS.info, border: "#B2DDFF" },
    finalizado: { background: `${COLORS.light}90`, color: COLORS.primary, border: COLORS.light },
    nao_analisado: { background: "#FFFAEB", color: COLORS.warning, border: "#FEDF89" },
    lancamento: { background: "#ECFDF3", color: "#027A48", border: "#ABEFC6" },
    devolucao: { background: "#FEF3F2", color: COLORS.danger, border: "#FECDCA" },
  };

  return tones[status] || tones.recebido;
};

export const getChecklistTone = (status: ChecklistStatus) => {
  if (status === "recebido") return { background: "#ECFDF3", color: "#027A48", border: "#ABEFC6" };
  if (status === "faltando") return { background: "#FEF3F2", color: COLORS.danger, border: "#FECDCA" };
  return { background: COLORS.background, color: COLORS.textLight, border: COLORS.border };
};

export const getProcessoTipo = (processo: ProcessoProdutor) =>
  processo.tipoIdentificado || "nao_definido";

export const getProcessoGccStatus = (processo: ProcessoProdutor) =>
  processo.gccStatus || "nao_consultado";

export const isGccDataChecked = (processo: ProcessoProdutor) =>
  processo.dadosGccConferidos ?? false;

export const getMemorandoChecklist = (memorando: MemorandoAnalise) =>
  memorando.memorandoChecklist || MEMORANDO_CHECKLIST_PADRAO;

export const hasMemorandoIssue = (memorando: MemorandoAnalise) =>
  Boolean(memorando.flags?.memorandoInvalido || memorando.memorandoDecisao === "incorreto");

export const getProcessoFlags = (processo: ProcessoProdutor): AnalysisFlags => {
  const declaration = getDeclarationInfo(processo);
  return {
    memorandoInvalido: false,
    checklistIncompleto: processo.checklist.some((item) => item.status === "faltando"),
    gccDivergente: getProcessoGccStatus(processo) === "divergencia",
    declaracaoVencida: declaration.issue === "expired_on_arrival",
    declaracaoFutura: declaration.issue === "future" || declaration.issue === "after_receipt",
    cpfDivergente: Boolean(processo.flags?.cpfDivergente),
  };
};

export const getProcessoStatus = (processo: ProcessoProdutor) =>
  processo.decisao || "nao_analisado";

export const getMemorandoSummary = (memorando: MemorandoAnalise) => {
  const summary = {
    total: memorando.processos.length,
    naoAnalisados: 0,
    lancamentos: 0,
    devolucoes: 0,
    finalizados: 0,
  };

  memorando.processos.forEach((processo) => {
    if (processo.decisao === "lancamento") summary.lancamentos += 1;
    if (processo.decisao === "devolucao") summary.devolucoes += 1;
    if (!processo.decisao) summary.naoAnalisados += 1;
  });

  summary.finalizados = summary.lancamentos + summary.devolucoes;
  return summary;
};

export const isMemorandoConcluido = (memorando: MemorandoAnalise) => {
  const summary = getMemorandoSummary(memorando);
  return memorando.memorandoDecisao === "incorreto" || (summary.total > 0 && summary.finalizados === summary.total);
};

export const getDerivedMemoStatus = (memorando: MemorandoAnalise): MemoStatus => {
  if (isMemorandoConcluido(memorando)) return "finalizado";
  if (memorando.abertoEm || memorando.status === "em_analise") return "em_analise";
  return "recebido";
};

export const getMaxDeclarationDate = (processo: ProcessoProdutor) => {
  const recebido = new Date(`${processo.recebidoEm}T00:00:00`);
  const maxDate = recebido < ANALYSIS_TODAY ? recebido : ANALYSIS_TODAY;
  return maxDate.toISOString().slice(0, 10);
};

export const getNextMemoStatusAfterDecision = (processos: ProcessoProdutor[], wholeMemoReturned = false): MemoStatus => {
  if (wholeMemoReturned || processos.every((processo) => processo.decisao)) return "finalizado";
  return "em_analise";
};
