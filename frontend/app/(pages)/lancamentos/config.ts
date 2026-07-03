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

export const PAGE_SIZE_OPTIONS = [50, 100];

export type LancamentoFilter = "todos" | "aguardando" | "concluidos";
export type ExpandedTab = "dados" | "historico" | "documentos";

export const FILTERS: { id: LancamentoFilter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "aguardando", label: "Aguardando lançamento" },
  { id: "concluidos", label: "Concluídos" },
];
