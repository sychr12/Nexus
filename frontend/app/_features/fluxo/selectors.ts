import type { DocumentoGeradoProcesso, FacStatus, ProcessoSicpr } from "./types";
export function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function getOutrosDocumentos(processo: ProcessoSicpr) {
  return processo.documentos.filter((documento) => (documento.categoria === "outros" || !documento.obrigatorio) && documento.categoria !== "fac_assinada");
}

export function getFacAssinada(processo: ProcessoSicpr) {
  return processo.documentos.find((documento) => documento.categoria === "fac_assinada");
}

export function getFacStatus(processo: ProcessoSicpr): FacStatus {
  if (getFacAssinada(processo)) return "assinada_anexada";
  if (processo.facStatus === "rejeitada") return "rejeitada";
  if (processo.documentosGerados?.fac) return "gerada";
  return "nao_gerada";
}

export function getDocumentosGerados(processo: ProcessoSicpr): DocumentoGeradoProcesso[] {
  const memorandoGerado =
    Boolean(processo.memorandoArquivo && processo.memorandoNumero && processo.gerenteAssinadoEm) &&
    ["em_analise", "devolvido_analise", "aprovado_lancamento", "concluido"].includes(processo.situacao);

  const documentos: DocumentoGeradoProcesso[] = [
    { nome: "Formulario", arquivo: processo.formulario, tipo: "formulario" },
    { nome: "FAC", arquivo: processo.fac, tipo: "fac" },
    { nome: "Declaração", arquivo: processo.declaracaoProdutor, tipo: "declaracao_produtor" },
    ...(memorandoGerado ? [{ nome: "Memorando", arquivo: processo.memorandoArquivo!, tipo: "memorando" as const }] : []),
  ];

  return documentos.map((documento) => ({
    ...documento,
    preenchido: documento.tipo === "memorando" || Boolean(processo.documentosGerados?.[documento.tipo]),
    dados: processo.documentosGerados?.[documento.tipo],
  }));
}

