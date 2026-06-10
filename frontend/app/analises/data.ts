import type {
  ChecklistItem,
  DispatchTarget,
  GccStatus,
  MemorandoAnalise,
  MemoStatus,
  MotivoMemorando,
  TipoIdentificado,
} from "./types";

export const COLORS = {
  primary: "#2D452F",
  accent: "#6B9D4A",
  light: "#CFE2CE",
  background: "#F5F7F5",
  card: "#FFFFFF",
  text: "#1A2E1B",
  textLight: "#6B7C6A",
  border: "#E2E8E0",
  danger: "#B42318",
  warning: "#B54708",
  info: "#175CD3",
};

export const HOVER_LIFT =
  "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm";
export const HOVER_SOFT =
  "transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0";

export const ANALYSIS_TODAY = new Date("2026-05-21T00:00:00");

export const STATUS_LABELS: Record<MemoStatus, string> = {
  recebido: "Recebidos",
  em_analise: "Em analise",
  finalizado: "Finalizados",
};

export const STATUS_DESCRIPTIONS: Record<MemoStatus, string> = {
  recebido: "Memorandos que entraram no sistema e ainda nao foram abertos.",
  em_analise: "Memorandos abertos pela equipe e com decisao em andamento.",
  finalizado: "Memorandos com todos os produtores decididos ou devolvidos integralmente.",
};

export const MOTIVO_LABELS: Record<MotivoMemorando, string> = {
  RENOVACAO: "Renovacao",
  INSCRICAO: "Inscricao",
  DEVOLUCAO: "Devolucao",
};

export const PRODUCER_STATUS_LABELS: Record<string, string> = {
  nao_analisado: "Nao analisado",
  lancamento: "Lancamento",
  devolucao: "Devolucao",
};

export const DISPATCH_TARGET_LABELS: Record<DispatchTarget, string> = {
  lancamento: "Encaminhado para lancamento",
  devolucao: "Encaminhado para devolucao",
};

export const TIPO_IDENTIFICADO_LABELS: Record<TipoIdentificado, string> = {
  nao_definido: "A identificar no sistema de consulta",
  inscricao: "Inscricao",
  renovacao_alteracao: "Renovacao/Alteracao",
};

export const GCC_STATUS_LABELS: Record<GccStatus, string> = {
  nao_consultado: "Nao consultado",
  sem_cadastro: "CPF sem cadastro",
  cadastro_encontrado: "Cadastro encontrado",
  divergencia: "Divergencia no sistema de consulta",
};

export const MEMORANDO_CHECKLIST_PADRAO: ChecklistItem[] = [
  { nome: "Memorando presente", status: "recebido" },
  { nome: "Assinatura do gerente UNLOC", status: "recebido" },
  { nome: "Carimbo da unidade local", status: "recebido" },
  { nome: "Copia vinculada aos encaminhamentos", status: "recebido" },
];

export const MEMORANDO_DEVOLUCAO_MOTIVOS = [
  "Documento ilegivel",
  "Documento invalido",
  "Assinatura ausente",
  "Dados inconsistentes",
  "Documento ausente",
] as const;

export const PROCESSO_DEVOLUCAO_MOTIVOS = [
  "Documento ausente",
  "Documento ilegivel",
  "Documento invalido",
  "Data invalida",
  "Cadastro divergente",
  "CPF divergente",
] as const;

const createTimeline = (acao: string, dataHora: string, detalhe?: string) => [
  { id: `${dataHora}-${acao}`, usuario: "Sistema", dataHora, acao, detalhe },
];

export const INITIAL_MEMORANDOS: MemorandoAnalise[] = [
  {
    id: 1,
    numero: "MEMO/MANAUS/118/2026",
    motivo: "RENOVACAO",
    titulo: "Renovacao de 5 carteiras",
    localidade: "Manaus",
    recebidoEm: "2026-05-15T08:42:00",
    prioridade: "urgente",
    status: "recebido",
    produtoresInformados: 5,
    memorandoPdf: "memorando-118-2026.pdf",
    memorandoDecisao: null,
    flags: {
      memorandoInvalido: false,
      checklistIncompleto: false,
      gccDivergente: false,
      declaracaoVencida: false,
      declaracaoFutura: false,
      cpfDivergente: false,
    },
    timeline: createTimeline("Memorando recebido", "2026-05-15T08:42:00"),
    processos: [
      {
        id: 101,
        produtor: "Beatriz Christine Azevedo Batista",
        cpf: "018.765.432-10",
        processoPdf: "processo-beatriz-christine.pdf",
        declaracaoPdf: "declaracao-beatriz-christine.pdf",
        dataDeclaracao: "2026-03-12",
        recebidoEm: "2026-05-15",
        decisao: null,
        checklist: [
          { nome: "Declaracao", status: "recebido" },
          { nome: "FAC", status: "recebido" },
          { nome: "Documento com foto", status: "recebido" },
          { nome: "Carteira do produtor", status: "nao_obrigatorio" },
        ],
        observacao: "",
      },
      {
        id: 102,
        produtor: "Paula Tejano Rego",
        cpf: "742.105.998-21",
        processoPdf: "processo-paula-tejano.pdf",
        declaracaoPdf: "declaracao-paula-tejano.pdf",
        dataDeclaracao: "2025-09-04",
        recebidoEm: "2026-05-15",
        decisao: null,
        checklist: [
          { nome: "Declaracao", status: "recebido" },
          { nome: "FAC", status: "faltando" },
          { nome: "Documento com foto", status: "recebido" },
          { nome: "Carteira do produtor", status: "nao_obrigatorio" },
        ],
        observacao: "",
      },
      {
        id: 103,
        produtor: "Raimundo Costa Lima",
        cpf: "132.456.709-55",
        processoPdf: "processo-raimundo-costa.pdf",
        declaracaoPdf: "declaracao-raimundo-costa.pdf",
        dataDeclaracao: "2025-12-20",
        recebidoEm: "2025-12-28",
        decisao: null,
        checklist: [
          { nome: "Declaracao", status: "recebido" },
          { nome: "FAC", status: "recebido" },
          { nome: "Documento com foto", status: "recebido" },
          { nome: "Carteira do produtor", status: "recebido" },
        ],
        observacao: "",
      },
    ],
  },
  {
    id: 2,
    numero: "MEMO/PARINTINS/109/2026",
    motivo: "INSCRICAO",
    titulo: "Inscricao de 4 produtores rurais",
    localidade: "Parintins",
    recebidoEm: "2026-05-14T15:07:00",
    prioridade: "normal",
    status: "recebido",
    produtoresInformados: 4,
    memorandoPdf: "memorando-109-2026.pdf",
    memorandoDecisao: null,
    flags: {
      memorandoInvalido: false,
      checklistIncompleto: false,
      gccDivergente: false,
      declaracaoVencida: false,
      declaracaoFutura: false,
      cpfDivergente: false,
    },
    timeline: createTimeline("Memorando recebido", "2026-05-14T15:07:00"),
    processos: [
      {
        id: 201,
        produtor: "Ana Cristina Moura",
        cpf: "409.312.447-03",
        processoPdf: "processo-ana-cristina.pdf",
        declaracaoPdf: "declaracao-ana-cristina.pdf",
        dataDeclaracao: "2026-01-10",
        recebidoEm: "2026-05-14",
        decisao: null,
        checklist: [
          { nome: "Declaracao", status: "recebido" },
          { nome: "FAC", status: "recebido" },
          { nome: "Documento com foto", status: "recebido" },
          { nome: "Carteira do produtor", status: "recebido" },
        ],
        observacao: "",
      },
      {
        id: 202,
        produtor: "Luciana Pereira da Costa",
        cpf: "654.700.120-44",
        processoPdf: "processo-luciana-pereira.pdf",
        declaracaoPdf: "declaracao-luciana-pereira.pdf",
        dataDeclaracao: "2026-02-02",
        recebidoEm: "2026-05-14",
        decisao: null,
        checklist: [
          { nome: "Declaracao", status: "recebido" },
          { nome: "FAC", status: "recebido" },
          { nome: "Documento com foto", status: "recebido" },
          { nome: "Carteira do produtor", status: "faltando" },
        ],
        observacao: "",
      },
    ],
  },
];
