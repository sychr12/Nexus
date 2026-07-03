import type { ProcessoSicpr } from "@/app/_features/fluxo/types";
import { getMemorandoStatus } from "./helpers";

export const PAGE_SIZE_OPTIONS = [25, 50, 100];

export type MemorandoAnaliseResumo = {
  id: string;
  numero: string;
  criadoEm?: string;
  gerente?: string;
  unidadeLocal: string;
  processos: ProcessoSicpr[];
};

export type MemorandoStatusFilter = "todos" | "em_analise" | "concluido";
export type DetailTab = "dados" | "historico" | "documentos";

export const MEMORANDO_STATUS_FILTERS: { key: MemorandoStatusFilter; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "em_analise", label: "Em análise" },
  { key: "concluido", label: "Concluído" },
];

export const DETAIL_TABS: { key: DetailTab; label: string }[] = [
  { key: "dados", label: "Dados" },
  { key: "historico", label: "Histórico" },
  { key: "documentos", label: "Documentos" },
];

export function filtrarProcessosAnalise(processos: ProcessoSicpr[], search: string) {
  const term = search.trim().toLowerCase();
  return processos
    .filter((processo) => ["em_analise", "aprovado_lancamento", "concluido"].includes(processo.situacao) && processo.memorandoNumero)
    .filter((processo) =>
      !term ||
      processo.produtor.toLowerCase().includes(term) ||
      processo.cpf.includes(term) ||
      processo.unidadeLocal.toLowerCase().includes(term) ||
      processo.tecnicoResponsavel.toLowerCase().includes(term) ||
      (processo.gerenteResponsavel || "").toLowerCase().includes(term) ||
      (processo.memorandoNumero || "").toLowerCase().includes(term),
    );
}

export function buildMemorandosAnalise(processos: ProcessoSicpr[], statusFilter: MemorandoStatusFilter) {
  const grupos = new Map<string, MemorandoAnaliseResumo>();

  processos.forEach((processo) => {
    const key = processo.memorandoLoteId || processo.memorandoNumero || processo.id;
    const grupo = grupos.get(key);

    if (grupo) {
      if (!grupo.processos.some((item) => item.id === processo.id)) grupo.processos.push(processo);
      return;
    }

    grupos.set(key, {
      id: key,
      numero: processo.memorandoNumero || "-",
      criadoEm: processo.memorandoCriadoEm || processo.enviadoAnaliseEm,
      gerente: processo.gerenteResponsavel,
      unidadeLocal: processo.unidadeLocal,
      processos: [processo],
    });
  });

  return Array.from(grupos.values())
    .filter((memorando) => statusFilter === "todos" || getMemorandoStatus(memorando).key === statusFilter)
    .sort((a, b) => new Date(b.criadoEm || "").getTime() - new Date(a.criadoEm || "").getTime());
}
