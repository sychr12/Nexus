/**
 * Constantes e dados fixos da área de análises.
 * Inclui:
 * - COLORS: paleta de cores padrão da aplicação
 * - STATUS_LABELS e STATUS_DESCRIPTIONS: textos dos estados do workflow
 * - MOTIVO_LABELS, PRODUCER_STATUS_LABELS, TIPO_IDENTIFICADO_LABELS: dicionários de rótulos
 * - HOVER_LIFT, HOVER_SOFT: animações CSS padrão
 * - ANALYSIS_TODAY: data base para cálculos (será substituída por data dinâmica)
 * - INITIAL_MEMORANDOS: dados de exemplo/teste (será substituído por dados da API)
 * 
 * Centraliza toda a configuração visual e textual da aplicação.
 */


import type {
  ChecklistItem,
  DispatchTarget,
  GccStatus,
  MemorandoAnalise,
  MemoStatus,
  MotivoMemorando,
  ProducerStatus,
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

export const ANALYSIS_TODAY = new Date("2026-05-16T00:00:00");

export const STATUS_LABELS: Record<MemoStatus, string> = {
  recebido: "Recebidos",
  em_analise: "Em análise",
  lancamento: "Lançamento",
  devolucao: "Devolução",
  concluido: "Concluídos",
};

export const STATUS_DESCRIPTIONS: Record<MemoStatus, string> = {
  recebido: "Memorandos recém-identificados pelo sistema a partir dos e-mails.",
  em_analise: "Memorandos com processos sendo conferidos pela equipe.",
  lancamento: "Memorandos ainda não concluídos que foram separados para lançamento.",
  devolucao: "Processos com documento faltando, data inconsistente, declaração vencida na chegada ou divergência.",
  concluido: "Processos que já saíram da análise e foram encaminhados para outra aba do sistema.",
};

export const MOTIVO_LABELS: Record<MotivoMemorando, string> = {
  RENOVACAO: "Renovação",
  INSCRICAO: "Inscrição",
  DEVOLUCAO: "Devolução",
};

export const PRODUCER_STATUS_LABELS: Record<ProducerStatus, string> = {
  pendente: "A conferir",
  apto: "Apto",
  devolucao: "Devolução",
  concluido: "Concluído",
};

export const DISPATCH_TARGET_LABELS: Record<DispatchTarget, string> = {
  lancamento: "Encaminhado para lançamento",
  devolucao: "Encaminhado para devolução",
};

export const TIPO_IDENTIFICADO_LABELS: Record<TipoIdentificado, string> = {
  nao_definido: "A identificar no sistema de consulta",
  inscricao: "Inscrição",
  renovacao_alteracao: "Renovação/Alteração",
};

export const GCC_STATUS_LABELS: Record<GccStatus, string> = {
  nao_consultado: "Não consultado",
  sem_cadastro: "CPF sem cadastro",
  cadastro_encontrado: "Cadastro encontrado",
  divergencia: "Divergência no sistema de consulta",
};

export const MEMORANDO_CHECKLIST_PADRAO: ChecklistItem[] = [
  { nome: "Memorando presente", status: "recebido" },
  { nome: "Assinatura do gerente UNLOC", status: "recebido" },
  { nome: "Carimbo da unidade local", status: "recebido" },
  { nome: "Cópia vinculada aos encaminhamentos", status: "recebido" },
];

export const INITIAL_MEMORANDOS: MemorandoAnalise[] = [
  {
    id: 1,
    numero: "MEMO/MANAUS/118/2026",
    motivo: "RENOVACAO",
    titulo: "Renovação de 5 carteiras",
    localidade: "Manaus",
    emailOrigem: "protocolo.manaus@sepror.am.gov.br",
    recebidoEm: "2026-05-15T08:42:00",
    prioridade: "urgente",
    status: "recebido",
    produtoresInformados: 5,
    memorandoPdf: "memorando-118-2026.pdf",
    processos: [
      {
        id: 101,
        produtor: "Beatriz Christine Azevedo Batista",
        cpf: "018.765.432-10",
        processoPdf: "processo-beatriz-christine.pdf",
        declaracaoPdf: "declaracao-beatriz-christine.pdf",
        dataDeclaracao: "2026-03-12",
        recebidoEm: "2026-05-15",
        status: "pendente",
        checklist: [
          { nome: "Declaração", status: "recebido" },
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
        status: "devolucao",
        checklist: [
          { nome: "Declaração", status: "recebido" },
          { nome: "FAC", status: "faltando" },
          { nome: "Documento com foto", status: "recebido" },
          { nome: "Carteira do produtor", status: "nao_obrigatorio" },
        ],
        observacao: "Declaração já chegou vencida no e-mail. Solicitar nova declaração.",
        observacaoAtualizadaEm: "2026-05-16T09:12:00",
      },
      {
        id: 103,
        produtor: "Raimundo Costa Lima",
        cpf: "132.456.709-55",
        processoPdf: "processo-raimundo-costa.pdf",
        declaracaoPdf: "declaracao-raimundo-costa.pdf",
        dataDeclaracao: "2025-12-20",
        recebidoEm: "2025-12-28",
        status: "apto",
        checklist: [
          { nome: "Declaração", status: "recebido" },
          { nome: "FAC", status: "recebido" },
          { nome: "Documento com foto", status: "recebido" },
          { nome: "Carteira do produtor", status: "recebido" },
        ],
        observacao: "",
      },
      {
        id: 104,
        produtor: "Maria do Socorro Lima",
        cpf: "509.312.447-03",
        processoPdf: "processo-maria-socorro.pdf",
        declaracaoPdf: "declaracao-maria-socorro.pdf",
        dataDeclaracao: "2026-01-28",
        recebidoEm: "2026-05-15",
        status: "pendente",
        checklist: [
          { nome: "Declaração", status: "recebido" },
          { nome: "FAC", status: "recebido" },
          { nome: "Documento com foto", status: "faltando" },
          { nome: "Carteira do produtor", status: "nao_obrigatorio" },
        ],
        observacao: "",
      },
      {
        id: 105,
        produtor: "José Antônio Ferreira",
        cpf: "654.700.120-44",
        processoPdf: "processo-jose-antonio.pdf",
        declaracaoPdf: "declaracao-jose-antonio.pdf",
        dataDeclaracao: "2026-02-10",
        recebidoEm: "2026-05-15",
        status: "pendente",
        checklist: [
          { nome: "Declaração", status: "recebido" },
          { nome: "FAC", status: "faltando" },
          { nome: "Documento com foto", status: "recebido" },
          { nome: "Carteira do produtor", status: "faltando" },
        ],
        observacao: "",
      },
    ],
  },
  {
    id: 2,
    numero: "MEMO/PARINTINS/109/2026",
    motivo: "INSCRICAO",
    titulo: "Inscrição de 4 produtores rurais",
    localidade: "Parintins",
    emailOrigem: "cadastro.rural@sepror.am.gov.br",
    recebidoEm: "2026-05-14T15:07:00",
    prioridade: "normal",
    status: "em_analise",
    produtoresInformados: 4,
    memorandoPdf: "memorando-109-2026.pdf",
    processos: [
      {
        id: 201,
        produtor: "Ana Cristina Moura",
        cpf: "409.312.447-03",
        processoPdf: "processo-ana-cristina.pdf",
        declaracaoPdf: "declaracao-ana-cristina.pdf",
        dataDeclaracao: "2026-01-10",
        recebidoEm: "2026-05-14",
        status: "apto",
        checklist: [
          { nome: "Declaração", status: "recebido" },
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
        status: "pendente",
        checklist: [
          { nome: "Declaração", status: "recebido" },
          { nome: "FAC", status: "recebido" },
          { nome: "Documento com foto", status: "recebido" },
          { nome: "Carteira do produtor", status: "faltando" },
        ],
        observacao: "Conferir obrigatoriedade da carteira para este processo.",
        observacaoAtualizadaEm: "2026-05-15T16:40:00",
      },
      {
        id: 203,
        produtor: "Marcos Vinicius Tavares",
        cpf: "231.908.774-19",
        processoPdf: "processo-marcos-vinicius.pdf",
        declaracaoPdf: "declaracao-marcos-vinicius.pdf",
        dataDeclaracao: "2026-04-18",
        recebidoEm: "2026-05-14",
        status: "pendente",
        checklist: [
          { nome: "Declaração", status: "recebido" },
          { nome: "FAC", status: "recebido" },
          { nome: "Documento com foto", status: "recebido" },
          { nome: "Carteira do produtor", status: "nao_obrigatorio" },
        ],
        observacao: "",
      },
      {
        id: 204,
        produtor: "Silvia Regina Almeida",
        cpf: "887.112.450-76",
        processoPdf: "processo-silvia-regina.pdf",
        declaracaoPdf: "declaracao-silvia-regina.pdf",
        dataDeclaracao: "2026-03-30",
        recebidoEm: "2026-05-14",
        status: "apto",
        checklist: [
          { nome: "Declaração", status: "recebido" },
          { nome: "FAC", status: "recebido" },
          { nome: "Documento com foto", status: "recebido" },
          { nome: "Carteira do produtor", status: "recebido" },
        ],
        observacao: "",
      },
    ],
  },
  {
    id: 4,
    numero: "MEMO/TEFE/131/2026",
    motivo: "INSCRICAO",
    titulo: "Inscrição de 3 novos produtores",
    localidade: "Tefé",
    emailOrigem: "unloc.tefe@sepror.am.gov.br",
    recebidoEm: "2026-05-16T14:18:00",
    prioridade: "normal",
    status: "recebido",
    produtoresInformados: 3,
    memorandoPdf: "memorando-131-2026.pdf",
    processos: [
      {
        id: 401,
        produtor: "Carla Mendes Farias",
        cpf: "702.118.430-62",
        processoPdf: "processo-carla-mendes.pdf",
        declaracaoPdf: "declaracao-carla-mendes.pdf",
        dataDeclaracao: "2026-04-11",
        recebidoEm: "2026-05-16",
        status: "pendente",
        checklist: [
          { nome: "Declaração", status: "recebido" },
          { nome: "FAC", status: "recebido" },
          { nome: "Documento com foto", status: "recebido" },
          { nome: "Carteira do produtor", status: "nao_obrigatorio" },
        ],
        tipoIdentificado: "inscricao",
        gccStatus: "sem_cadastro",
        observacao: "",
      },
      {
        id: 402,
        produtor: "Nelson Araújo Braga",
        cpf: "116.309.884-27",
        processoPdf: "processo-nelson-araujo.pdf",
        declaracaoPdf: "declaracao-nelson-araujo.pdf",
        dataDeclaracao: "2026-03-24",
        recebidoEm: "2026-05-16",
        status: "pendente",
        checklist: [
          { nome: "Declaração", status: "recebido" },
          { nome: "FAC", status: "recebido" },
          { nome: "Documento com foto", status: "recebido" },
          { nome: "Carteira do produtor", status: "nao_obrigatorio" },
        ],
        observacao: "",
      },
      {
        id: 403,
        produtor: "Vitória Gomes de Souza",
        cpf: "950.441.207-15",
        processoPdf: "processo-vitoria-gomes.pdf",
        declaracaoPdf: "declaracao-vitoria-gomes.pdf",
        dataDeclaracao: "2026-02-19",
        recebidoEm: "2026-05-16",
        status: "pendente",
        checklist: [
          { nome: "Declaração", status: "recebido" },
          { nome: "FAC", status: "recebido" },
          { nome: "Documento com foto", status: "recebido" },
          { nome: "Carteira do produtor", status: "nao_obrigatorio" },
        ],
        observacao: "",
      },
    ],
  },
];
