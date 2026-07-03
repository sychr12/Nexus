import {
  getDocumentosGerados,
  getFacAssinada,
  getOutrosDocumentos,
} from "@/app/_features/fluxo/storage";
import type { MemorandoProcessoRegistro, ProcessoSicpr } from "@/app/_features/fluxo/types";

export const COLORS = {
  primary: "#2D452F",
  accent: "#6B9D4A",
  background: "#F5F7F5",
  card: "#FFFFFF",
  text: "#1A2E1B",
  textLight: "#6B7C6A",
  border: "#E2E8E0",
  danger: "#B42318",
};

export const PAGE_SIZE = 50;

export type MemorandoCentralStatus =
  | "todos"
  | "em_elaboracao"
  | "assinado"
  | "em_analise"
  | "devolvido"
  | "reencaminhado"
  | "aprovado"
  | "lancado"
  | "cancelado";

export const STATUS_FILTERS: Array<{ key: MemorandoCentralStatus; label: string }> = [
  { key: "todos", label: "Todos" },
  { key: "em_elaboracao", label: "Em elaboração" },
  { key: "assinado", label: "Assinado" },
  { key: "em_analise", label: "Em análise" },
  { key: "devolvido", label: "Devolvido" },
  { key: "reencaminhado", label: "Reencaminhado" },
  { key: "aprovado", label: "Aprovado" },
  { key: "lancado", label: "Lançado" },
  { key: "cancelado", label: "Cancelado" },
];

export const STATUS_META: Record<Exclude<MemorandoCentralStatus, "todos">, { label: string; className: string }> = {
  em_elaboracao: { label: "Em elaboração", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  assinado: { label: "Assinado", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  em_analise: { label: "Em análise", className: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
  devolvido: { label: "Devolvido", className: "bg-red-50 text-red-700 ring-red-200" },
  reencaminhado: { label: "Reencaminhado", className: "bg-orange-50 text-orange-700 ring-orange-200" },
  aprovado: { label: "Aprovado", className: "bg-purple-50 text-purple-700 ring-purple-200" },
  lancado: { label: "Lançado", className: "bg-slate-50 text-slate-700 ring-slate-200" },
  cancelado: { label: "Cancelado", className: "bg-zinc-100 text-zinc-700 ring-zinc-200" },
};

export type MemorandoResumo = MemorandoProcessoRegistro & {
  processos: ProcessoSicpr[];
  status: Exclude<MemorandoCentralStatus, "todos">;
  ultimaMovimentacao: string;
  tecnicos: string[];
  relacionadoAnterior?: string;
  sucessor?: string;
  cadeiaSucessao: string[];
};

export type MemorandoCentralPage = {
  items: MemorandoResumo[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  statusCounts: Partial<Record<MemorandoCentralStatus, number>>;
};

export function getHistoricoGeral(memorando: MemorandoResumo) {
  const institutionalActions = [
    "memorando gerado",
    "assinado eletronicamente",
    "encaminhado para analise",
    "recebido pela analise",
    "aprovado",
    "encaminhado para lancamento",
    "lancado",
    "cancelado",
  ];

  return uniqueBy(
    getAuditoria(memorando).filter((item) => {
      const action = normalize(item.acao);
      return institutionalActions.some((institutionalAction) => action.includes(institutionalAction));
    }),
    (item) => `${normalize(item.acao)}-${item.dataHora}`
  );
}

export function getDevolucoes(memorando: MemorandoResumo) {
  return memorando.processos.flatMap((processo) =>
    processo.historico
      .filter((item) => normalize(item.acao).includes("devolvido"))
      .map((evento) => ({ processo, evento }))
  );
}

export function getDocumentsByProducer(memorando: MemorandoResumo) {
  return memorando.processos.map((processo) => {
    const generated = getDocumentosGerados(processo).map((doc) => ({ label: doc.nome, detail: doc.arquivo }));
    const attachments = [
      ...(getFacAssinada(processo) ? [getFacAssinada(processo)!] : []),
      ...getOutrosDocumentos(processo),
    ].map((doc) => ({ label: doc.nome, detail: doc.arquivo }));

    return {
      processo,
      items: uniqueBy([...generated, ...attachments], (item) => `${item.label}-${item.detail}`),
    };
  });
}

export function getDevolucaoMotivo(observacao?: string) {
  if (!observacao) return "-";
  return observacao.split("|")[0]?.trim() || observacao;
}

export function getAuditDotClass(acao: string) {
  const value = normalize(acao);
  if (value.includes("devolvido")) return "bg-red-500 ring-red-100";
  if (value.includes("assinado") || value.includes("aprovado") || value.includes("lancado")) return "bg-emerald-500 ring-emerald-100";
  if (value.includes("encaminhado")) return "bg-amber-500 ring-amber-100";
  return "bg-slate-400 ring-slate-100";
}

export function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function getAuditoria(memorando: MemorandoResumo) {
  const events = memorando.processos.flatMap((processo) =>
    processo.historico.map((item) => ({
      ...item,
      observacao: [processo.produtor, item.observacao].filter(Boolean).join(" | "),
    }))
  );

  const baseEvents = [
    {
      id: `${memorando.loteId}-memorando`,
      usuario: "Sistema",
      acao: "Memorando gerado",
      dataHora: memorando.criadoEm,
      observacao: `${memorando.numero} | ${memorando.quantidade} processo(s)`,
    },
    ...(memorando.assinatura ? [{
      id: `${memorando.loteId}-assinatura`,
      usuario: memorando.assinatura.gerenteNome,
      acao: "Assinado eletronicamente",
      dataHora: memorando.assinatura.assinadaEm,
      observacao: memorando.assinatura.codigoValidacao,
    }] : []),
  ];

  return [...baseEvents, ...events].sort((a, b) => a.dataHora.localeCompare(b.dataHora));
}

function uniqueBy<T>(values: T[], getKey: (value: T) => string) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = getKey(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
