import type { SituacaoProcessoSicpr } from "@/app/_features/fluxo/types";

type MemorandoStatusInput = {
  processos: Array<{ situacao: SituacaoProcessoSicpr }>;
};

export function getMemorandoStatus(memorando: MemorandoStatusInput) {
  const situacoes = memorando.processos.map((processo) => processo.situacao);

  if (situacoes.every((situacao) => situacao === "concluido" || situacao === "aprovado_lancamento")) {
    return { key: "concluido" as const, label: "Concluído", className: "bg-emerald-50 text-emerald-700 ring-emerald-100" };
  }
  if (situacoes.some((situacao) => situacao === "aprovado_lancamento" || situacao === "concluido")) {
    return { key: "em_analise" as const, label: "Em análise", className: "bg-indigo-50 text-indigo-700 ring-indigo-100" };
  }
  return { key: "em_analise" as const, label: "Em análise", className: "bg-indigo-50 text-indigo-700 ring-indigo-100" };
}
