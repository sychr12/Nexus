import type { FacStatus, GerenteUnidadeStatus, SituacaoProcessoSicpr, TipoProcessoSicpr } from "./types";

export const TIPO_PROCESSO_LABELS: Record<TipoProcessoSicpr, string> = {
  inscricao: "Inscrição",
  renovacao: "Renovação",
  alteracao: "Alteração",
};

export const SITUACAO_LABELS: Record<SituacaoProcessoSicpr, string> = {
  em_elaboracao: "Em elaboração",
  encaminhado_gerente: "Encaminhado para gerente",
  devolvido_gerente: "Devolvido pelo gerente",
  aprovado_gerente: "Aprovado pelo gerente",
  em_analise: "Em análise",
  devolvido_analise: "Devolvido pela análise",
  aprovado_lancamento: "Aguardando lançamento",
  concluido: "Concluído",
};

export const STATUS_COLORS: Record<SituacaoProcessoSicpr, string> = {
  em_elaboracao: "bg-slate-50 text-slate-700 ring-slate-200",
  encaminhado_gerente: "bg-blue-50 text-blue-700 ring-blue-100",
  devolvido_gerente: "bg-amber-50 text-amber-800 ring-amber-100",
  aprovado_gerente: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  em_analise: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  devolvido_analise: "bg-red-50 text-red-700 ring-red-100",
  aprovado_lancamento: "bg-green-50 text-green-700 ring-green-100",
  concluido: "bg-zinc-100 text-zinc-700 ring-zinc-200",
};

export const GERENTE_STATUS_LABELS: Record<GerenteUnidadeStatus, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  respondendo: "Respondendo",
};

export const FAC_STATUS_LABELS: Record<FacStatus, string> = {
  nao_gerada: "Não gerada",
  gerada: "Gerada",
  assinada_anexada: "Assinada e anexada",
  rejeitada: "Rejeitada",
};
