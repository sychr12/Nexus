import { apiJson } from "@/app/_lib/http";
import type { MemorandoCentralPage, MemorandoCentralStatus } from "../memorandos-data";

export const centralMemorandosService = {
  listar(params: {
    search?: string;
    status?: MemorandoCentralStatus;
    page?: number;
    size?: number;
  }) {
    const search = new URLSearchParams();
    if (params.search?.trim()) search.set("search", params.search.trim());
    if (params.status && params.status !== "todos") search.set("status", params.status);
    if (params.page) search.set("page", String(params.page));
    if (params.size) search.set("size", String(params.size));

    const suffix = search.size > 0 ? `?${search.toString()}` : "";
    return apiJson<MemorandoCentralPage>(`/central-memorandos${suffix}`, undefined, "Erro ao carregar a Central de Memorandos");
  },
};
