import { apiJson } from "@/app/_lib/http";
import type {
  DocumentoGeradoProcesso,
  DocumentoProcesso,
  GerenteUnidade,
  GerenteUnidadeStatus,
  HistoricoProcesso,
  MemorandoProcessoRegistro,
  ProcessoSicpr,
  TipoProcessoSicpr,
} from "./types";

type ProcessoFluxoResponse = Omit<
  ProcessoSicpr,
  "tipoProcesso" | "situacao" | "facStatus" | "documentosGerados" | "documentos" | "historico" | "memorandos" | "memorandoProdutores"
> & {
  tipoProcesso: string;
  situacao: string;
  facStatus?: string;
  documentosGerados?: Record<string, Record<string, string>>;
  documentos?: Array<Omit<DocumentoProcesso, "categoria" | "tamanho"> & { categoria: string; tamanho?: number }>;
  historico?: HistoricoProcesso[];
  memorandos?: Array<Record<string, unknown>>;
  memorandoProdutores?: Array<Record<string, unknown>>;
};

type ProcessoFluxoRequest = {
  produtor: string;
  cpf: string;
  tipoProcesso: TipoProcessoSicpr;
  unidadeLocal: string;
  documentosGerados?: Partial<Record<DocumentoGeradoProcesso["tipo"], Record<string, string>>>;
  documentos: DocumentoProcesso[];
};

type GerenteUnidadeResponse = Omit<GerenteUnidade, "status"> & {
  status: string;
};

type GerenteUnidadeRequest = Omit<GerenteUnidade, "id" | "cadastradoEm" | "encerradoEm">;

type DocumentoFluxoInput = Omit<DocumentoProcesso, "obrigatorio" | "categoria"> & {
  categoria?: DocumentoProcesso["categoria"];
  obrigatorio?: boolean;
};

type ProcessoFluxoInput = Omit<ProcessoFluxoRequest, "documentos"> & {
  documentos: DocumentoFluxoInput[];
};

function normalizeProcesso(response: ProcessoFluxoResponse): ProcessoSicpr {
  return {
    ...response,
    tipoProcesso: normalizeTipoProcesso(response.tipoProcesso),
    situacao: response.situacao as ProcessoSicpr["situacao"],
    facStatus: response.facStatus as ProcessoSicpr["facStatus"],
    documentosGerados: response.documentosGerados as ProcessoSicpr["documentosGerados"],
    documentos: (response.documentos || []).map((documento) => ({
      ...documento,
      categoria: documento.categoria as DocumentoProcesso["categoria"],
      tamanho: documento.tamanho,
    })),
    historico: response.historico || [],
    memorandos: response.memorandos as MemorandoProcessoRegistro[] | undefined,
    memorandoProdutores: response.memorandoProdutores as ProcessoSicpr["memorandoProdutores"],
  };
}

function normalizeGerente(response: GerenteUnidadeResponse): GerenteUnidade {
  return {
    ...response,
    status: response.status as GerenteUnidadeStatus,
  };
}

function normalizeTipoProcesso(value: string): TipoProcessoSicpr {
  if (value === "renovacao" || value === "alteracao") return value;
  return "inscricao";
}

function processoRequest(input: ProcessoFluxoInput): ProcessoFluxoRequest {
  return {
    produtor: input.produtor,
    cpf: input.cpf,
    tipoProcesso: input.tipoProcesso,
    unidadeLocal: input.unidadeLocal,
    documentosGerados: input.documentosGerados,
    documentos: input.documentos.map((documento) => ({
      ...documento,
      categoria: documento.categoria || "outros",
      obrigatorio: documento.obrigatorio ?? documento.categoria === "fac_assinada",
    })),
  };
}

function replaceProcesso(processos: ProcessoSicpr[], updated: ProcessoSicpr) {
  return processos.map((processo) => (processo.id === updated.id ? updated : processo));
}

async function processoAction(path: string, body?: unknown) {
  const response = await apiJson<ProcessoFluxoResponse>(path, {
    method: "POST",
    body,
  });
  return normalizeProcesso(response);
}

export const fluxoApi = {
  replaceProcesso,

  async listarProcessos(params?: { situacao?: string; unidadeLocal?: string }) {
    const search = new URLSearchParams();
    if (params?.situacao) search.set("situacao", params.situacao);
    if (params?.unidadeLocal) search.set("unidadeLocal", params.unidadeLocal);

    const suffix = search.size > 0 ? `?${search.toString()}` : "";
    const response = await apiJson<ProcessoFluxoResponse[]>(`/fluxo/processos${suffix}`);
    return response.map(normalizeProcesso);
  },

  async listarPendentesGerente() {
    const response = await apiJson<ProcessoFluxoResponse[]>("/fluxo/processos/gerente");
    return response.map(normalizeProcesso);
  },

  async listarPendentesAnalise() {
    const response = await apiJson<ProcessoFluxoResponse[]>("/fluxo/processos/analise");
    return response.map(normalizeProcesso);
  },

  async criarProcesso(input: ProcessoFluxoInput) {
    const response = await apiJson<ProcessoFluxoResponse>("/fluxo/processos", {
      method: "POST",
      body: processoRequest(input),
    });
    return normalizeProcesso(response);
  },

  async atualizarProcesso(id: string, input: ProcessoFluxoInput) {
    const response = await apiJson<ProcessoFluxoResponse>(`/fluxo/processos/${id}`, {
      method: "PUT",
      body: processoRequest(input),
    });
    return normalizeProcesso(response);
  },

  encaminharGerente(id: string) {
    return processoAction(`/fluxo/processos/${id}/encaminhar-gerente`);
  },

  async aprovarLoteGerente(ids: string[], gerenteId?: string) {
    const response = await apiJson<ProcessoFluxoResponse[]>("/fluxo/gerente/aprovar-lote", {
      method: "POST",
      body: { ids, gerenteId },
    });
    return response.map(normalizeProcesso);
  },

  devolverPeloGerente(id: string, justificativa: string) {
    return processoAction(`/fluxo/processos/${id}/devolver-gerente`, { justificativa });
  },

  aprovarAnalise(id: string) {
    return processoAction(`/fluxo/processos/${id}/analise/aprovar`);
  },

  devolverAnalise(id: string, justificativa: string) {
    return processoAction(`/fluxo/processos/${id}/analise/devolver`, { justificativa });
  },

  concluirLancamento(id: string) {
    return processoAction(`/fluxo/processos/${id}/lancamento/concluir`);
  },

  devolverLancamento(id: string, justificativa: string) {
    return processoAction(`/fluxo/processos/${id}/lancamento/devolver`, { justificativa });
  },

  async listarGerentes() {
    const response = await apiJson<GerenteUnidadeResponse[]>("/fluxo/gerentes");
    return response.map(normalizeGerente);
  },

  async salvarGerente(input: GerenteUnidadeRequest, id?: string) {
    const response = await apiJson<GerenteUnidadeResponse>(id ? `/fluxo/gerentes/${id}` : "/fluxo/gerentes", {
      method: id ? "PUT" : "POST",
      body: input,
    });
    return normalizeGerente(response);
  },

  async inativarGerente(id: string) {
    const response = await apiJson<GerenteUnidadeResponse>(`/fluxo/gerentes/${id}/inativar`, {
      method: "POST",
    });
    return normalizeGerente(response);
  },
};
