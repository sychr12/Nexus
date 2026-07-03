import { apiJson } from "@/app/_lib/http";
import { dateInputToIsoDateTime } from "@/app/_lib/dateInput";
import type { AuditEvent, AuditFilters, PageResponse } from "../types/auditoria";

function appendParam(params: URLSearchParams, key: string, value?: string) {
  const normalized = value?.trim();
  if (normalized) params.set(key, normalized);
}

export const auditoriaService = {
  async listarEventos(filters: AuditFilters, page: number, size: number): Promise<PageResponse<AuditEvent>> {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });

    appendParam(params, "usuario", filters.usuario);
    appendParam(params, "acao", filters.acao);
    appendParam(params, "resultado", filters.resultado);
    appendParam(params, "recursoTipo", filters.recursoTipo);
    appendParam(params, "recursoId", filters.recursoId);
    appendParam(params, "de", dateInputToIsoDateTime(filters.de));
    appendParam(params, "ate", dateInputToIsoDateTime(filters.ate, true));

    return apiJson<PageResponse<AuditEvent>>(`/auditoria/eventos?${params.toString()}`, undefined, "Erro ao carregar auditoria");
  },
};
