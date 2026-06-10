import type {
  AssinaturaEletronica,
  DocumentoAssinadoRegistro,
  DocumentoGeradoProcesso,
  DocumentoProcesso,
  FacStatus,
  GerenteUnidade,
  MemorandoProcessoRegistro,
  ProcessoSicpr,
  TipoProcessoSicpr,
} from "./types";
import { MEMORANDO_SEQUENCE_KEY, TIPO_PROCESSO_LABELS } from "./constants";
import { historico } from "./history";
import { getFacAssinada, getFacStatus } from "./selectors";
import { nowIso, uid } from "./utils";
export function addProcesso(
  processos: ProcessoSicpr[],
  input: {
    produtor: string;
    cpf: string;
    tipoProcesso: TipoProcessoSicpr;
    unidadeLocal: string;
    tecnicoResponsavel: string;
    documentosGerados: Partial<Record<DocumentoGeradoProcesso["tipo"], Record<string, string>>>;
    outrosDocumentos: Array<Pick<DocumentoProcesso, "nome" | "arquivo" | "conteudo" | "mimeType" | "tamanho"> & { id?: string; categoria?: DocumentoProcesso["categoria"] }>;
  },
) {
  const createdAt = nowIso();
  const processo: ProcessoSicpr = {
    id: uid("proc"),
    produtor: input.produtor,
    cpf: input.cpf,
    tipoProcesso: input.tipoProcesso,
    unidadeLocal: input.unidadeLocal,
    tecnicoResponsavel: input.tecnicoResponsavel,
    formulario: `Formulario cadastral - ${input.produtor}.pdf`,
    fac: `FAC - ${input.produtor}.pdf`,
    declaracaoProdutor: `Declaracao do produtor rural - ${input.produtor}.pdf`,
    declaracoes: "",
    documentosGerados: input.documentosGerados,
    facStatus: getFacStatusFromData(input.documentosGerados, input.outrosDocumentos),
    facGeradaEm: input.documentosGerados.fac ? createdAt : undefined,
    facGeradaPor: input.documentosGerados.fac ? input.tecnicoResponsavel : undefined,
    facAssinadaAnexadaEm: getFacAssinadaDocumento(input.outrosDocumentos) ? createdAt : undefined,
    facAssinadaAnexadaPor: getFacAssinadaDocumento(input.outrosDocumentos) ? input.tecnicoResponsavel : undefined,
    facAssinadaDocumentoId: getFacAssinadaDocumento(input.outrosDocumentos)?.id,
    documentos: [
      ...input.outrosDocumentos.map((documento, index) => ({
        id: uid("doc"),
        nome: documento.nome || `Outro anexo ${index + 1}`,
        arquivo: documento.arquivo,
        obrigatorio: documento.categoria === "fac_assinada",
        categoria: documento.categoria || ("outros" as const),
        conteudo: documento.conteudo,
        mimeType: documento.mimeType,
        tamanho: documento.tamanho,
      })),
    ],
    situacao: "em_elaboracao",
    criadoEm: createdAt,
    historico: [
      historico(input.tecnicoResponsavel, "Processo criado", TIPO_PROCESSO_LABELS[input.tipoProcesso]),
      ...(input.documentosGerados.fac ? [historico(input.tecnicoResponsavel, "FAC gerada", "Documento preenchido automaticamente pelo SICPR")] : []),
      ...(getFacAssinadaDocumento(input.outrosDocumentos) ? [historico(input.tecnicoResponsavel, "FAC assinada anexada", getFacAssinadaDocumento(input.outrosDocumentos)?.arquivo)] : []),
    ],
  };

  return [processo, ...processos];
}

export function atualizarProcessoUnloc(
  processos: ProcessoSicpr[],
  id: string,
  usuario: string,
  input: {
    produtor: string;
    cpf: string;
    tipoProcesso: TipoProcessoSicpr;
    unidadeLocal: string;
    documentosGerados: Partial<Record<DocumentoGeradoProcesso["tipo"], Record<string, string>>>;
    outrosDocumentos: Array<Pick<DocumentoProcesso, "id" | "nome" | "arquivo" | "conteudo" | "mimeType" | "tamanho"> & { categoria?: DocumentoProcesso["categoria"] }>;
  },
) {
  return moverProcesso(processos, id, (processo) => ({
    ...(() => {
      const facAnterior = processo.documentos.find((documento) => documento.categoria === "fac_assinada");
      const facAtual = getFacAssinadaDocumento(input.outrosDocumentos);
      const facFoiGerada = !processo.documentosGerados?.fac && Boolean(input.documentosGerados.fac);
      const facFoiAnexada = !facAnterior && Boolean(facAtual);
      const facFoiSubstituida = Boolean(facAnterior && facAtual && facAnterior.id !== facAtual.id);
      return {
        ...processo,
        facStatus: getFacStatusFromData(input.documentosGerados, input.outrosDocumentos),
        facGeradaEm: processo.facGeradaEm || (facFoiGerada ? nowIso() : undefined),
        facGeradaPor: processo.facGeradaPor || (facFoiGerada ? usuario : undefined),
        facAssinadaAnexadaEm: facFoiAnexada || facFoiSubstituida ? nowIso() : processo.facAssinadaAnexadaEm,
        facAssinadaAnexadaPor: facFoiAnexada || facFoiSubstituida ? usuario : processo.facAssinadaAnexadaPor,
        facAssinadaDocumentoId: facAtual?.id,
      };
    })(),
    produtor: input.produtor,
    cpf: input.cpf,
    tipoProcesso: input.tipoProcesso,
    unidadeLocal: input.unidadeLocal,
    tecnicoResponsavel: processo.tecnicoResponsavel || usuario,
    formulario: `Formulario cadastral - ${input.produtor}.pdf`,
    fac: `FAC - ${input.produtor}.pdf`,
    declaracaoProdutor: `Declaracao do produtor rural - ${input.produtor}.pdf`,
    documentosGerados: input.documentosGerados,
    documentos: input.outrosDocumentos.map((documento, index) => ({
      id: documento.id || uid("doc"),
      nome: documento.nome || `Outro anexo ${index + 1}`,
      arquivo: documento.arquivo,
      obrigatorio: documento.categoria === "fac_assinada",
      categoria: documento.categoria || ("outros" as const),
      conteudo: documento.conteudo,
      mimeType: documento.mimeType,
      tamanho: documento.tamanho,
    })),
    historico: [
      ...processo.historico,
      historico(usuario, "Correcao salva pela UNLOC", input.unidadeLocal),
      ...(!processo.documentosGerados?.fac && input.documentosGerados.fac ? [historico(usuario, "FAC gerada", "Documento preenchido automaticamente pelo SICPR")] : []),
      ...(!processo.documentos.find((documento) => documento.categoria === "fac_assinada") && getFacAssinadaDocumento(input.outrosDocumentos) ? [historico(usuario, "FAC assinada anexada", getFacAssinadaDocumento(input.outrosDocumentos)?.arquivo)] : []),
      ...(processo.documentos.find((documento) => documento.categoria === "fac_assinada") && getFacAssinadaDocumento(input.outrosDocumentos) && processo.documentos.find((documento) => documento.categoria === "fac_assinada")?.id !== getFacAssinadaDocumento(input.outrosDocumentos)?.id ? [historico(usuario, "FAC substituida", getFacAssinadaDocumento(input.outrosDocumentos)?.arquivo)] : []),
    ],
  }));
}

export function moverProcesso(
  processos: ProcessoSicpr[],
  id: string,
  updater: (processo: ProcessoSicpr, dataHora: string) => ProcessoSicpr,
) {
  const dataHora = nowIso();
  return processos.map((processo) => (processo.id === id ? updater(processo, dataHora) : processo));
}

export function encaminharGerente(processos: ProcessoSicpr[], id: string, usuario: string) {
  return moverProcesso(processos, id, (processo, dataHora) => ({
    ...(podeEncaminharGerente(processo)
      ? {
          ...processo,
          situacao: "encaminhado_gerente" as const,
          tecnicoResponsavel: processo.tecnicoResponsavel || usuario,
          encaminhadoGerenteEm: dataHora,
          ultimaJustificativa: undefined,
          historico: [...processo.historico, historico(usuario, "Encaminhado ao gerente", processo.unidadeLocal)],
        }
      : {
          ...processo,
          ultimaJustificativa: "A FAC assinada pelo produtor ainda não foi anexada ao processo.",
          historico: [...processo.historico, historico("Sistema", "Encaminhamento bloqueado", "FAC assinada pelo produtor obrigatória")],
        }),
  }));
}

export function devolverPeloGerente(processos: ProcessoSicpr[], id: string, gerente: string, justificativa: string) {
  return moverProcesso(processos, id, (processo) => ({
    ...processo,
    situacao: "devolvido_gerente",
    gerenteResponsavel: gerente,
    ultimaJustificativa: justificativa,
    historico: [...processo.historico, historico(gerente, "Devolvido pelo gerente", justificativa)],
  }));
}

export function aprovarLoteGerente(processos: ProcessoSicpr[], ids: string[], gerente: GerenteUnidade) {
  const memorandoNumero = gerarNumeroMemorando();
  const loteId = uid("lote");
  const dataHora = nowIso();
  const selected = new Set(ids);
  const unidadeLocal = processos.find((processo) => selected.has(processo.id))?.unidadeLocal || gerente.unidadeLocal;
  const produtores = processos
    .filter((processo) => selected.has(processo.id))
    .map((processo) => ({
      id: processo.id,
      produtor: processo.produtor,
      cpf: processo.cpf,
        tipoProcesso: processo.tipoProcesso,
      }));
  const assinatura = criarAssinaturaEletronica({
    loteId,
    memorandoNumero,
    dataHora,
    gerente,
    unidadeLocal,
    produtores,
    documentosBase: processos.filter((processo) => selected.has(processo.id)),
    codigosExistentes: processos
      .map((processo) => processo.assinaturaEletronica?.codigoValidacao)
      .filter((codigo): codigo is string => Boolean(codigo)),
  });
  const memorando: MemorandoProcessoRegistro = {
    loteId,
    numero: memorandoNumero,
    arquivo: `Memorando ${memorandoNumero}.pdf`,
    criadoEm: dataHora,
    gerenteResponsavel: assinatura.gerenteNome,
    unidadeLocal,
    quantidade: produtores.length,
    produtores,
    assinatura,
  };

  return processos.map((processo) => {
    if (!selected.has(processo.id)) return processo;

    return {
      ...processo,
      situacao: "em_analise" as const,
      gerenteResponsavel: assinatura.gerenteNome,
      gerenteAssinadoEm: dataHora,
      assinaturaEletronica: assinatura,
      memorandoNumero,
      memorandoArquivo: memorando.arquivo,
      memorandoCriadoEm: dataHora,
      memorandoQuantidade: memorando.quantidade,
      memorandoProdutores: memorando.produtores,
      memorandos: [...(processo.memorandos || []), memorando],
      memorandoLoteId: loteId,
      enviadoAnaliseEm: dataHora,
      ultimaJustificativa: undefined,
      historico: [
        ...processo.historico,
        historico(assinatura.gerenteNome, "Aprovado e assinado pelo gerente", `Memorando ${memorandoNumero}`),
        historico("Sistema", "Memorando de lote gerado", `${memorandoNumero} com ${ids.length} processo(s)`),
        historico("Sistema", "Codigo de validacao gerado", assinatura.codigoValidacao),
        historico("Sistema", "Documentos automaticos assinados", assinatura.documentosAssinados.map((documento) => documento.tipo).join(", ")),
        historico(assinatura.gerenteNome, "Encaminhado para analise", processo.unidadeLocal),
      ],
    };
  });
}

export function decidirAnalise(
  processos: ProcessoSicpr[],
  id: string,
  analista: string,
  destino: "aprovado_lancamento" | "devolvido_analise",
  justificativa?: string,
) {
  return moverProcesso(processos, id, (processo, dataHora) => ({
    ...processo,
    situacao: destino,
    analistaResponsavel: analista,
    analisadoEm: dataHora,
    ultimaJustificativa: destino === "devolvido_analise" ? justificativa : undefined,
    historico: [
      ...processo.historico,
      historico(
        analista,
        destino === "aprovado_lancamento" ? "Aprovado pela análise e encaminhado para lançamento." : "Devolvido pela analise",
        destino === "devolvido_analise" ? justificativa : "Processo aguardando lançamento.",
      ),
    ],
  }));
}

export function concluirLancamento(processos: ProcessoSicpr[], id: string, usuario: string) {
  return moverProcesso(processos, id, (processo, dataHora) => ({
    ...processo,
    situacao: "concluido",
    lancadoPor: usuario,
    lancadoEm: dataHora,
    historico: [...processo.historico, historico(usuario, "Lancamento concluido", "Carteira/processo finalizado")],
  }));
}

export function podeEncaminharGerente(processo: ProcessoSicpr) {
  return getFacStatus(processo) === "assinada_anexada";
}

export function devolverLancamentoParaAnalise(processos: ProcessoSicpr[], id: string, usuario: string, justificativa: string) {
  return moverProcesso(processos, id, (processo) => ({
    ...processo,
    situacao: "em_analise",
    analistaResponsavel: undefined,
    analisadoEm: undefined,
    ultimaJustificativa: justificativa,
    historico: [
      ...processo.historico,
      historico(usuario, "Devolvido pelo lançamento para análise", justificativa),
      historico("Sistema", "Processo retornou para análise", "Devolução registrada na etapa de lançamentos."),
    ],
  }));
}

function gerarNumeroMemorando() {
  const currentYear = new Date().getFullYear();
  const suffix = String(currentYear).slice(-2);
  const key = `${MEMORANDO_SEQUENCE_KEY}-${suffix}`;
  const next = Number(localStorage.getItem(key) || "0") + 1;
  localStorage.setItem(key, String(next));
  return `${String(next).padStart(4, "0")}/${suffix}`;
}

function criarAssinaturaEletronica(input: {
  loteId: string;
  memorandoNumero: string;
  dataHora: string;
  gerente: GerenteUnidade;
  unidadeLocal: string;
  produtores: Array<{ id: string; produtor: string; cpf: string; tipoProcesso: TipoProcessoSicpr }>;
  documentosBase: ProcessoSicpr[];
  codigosExistentes: string[];
}): AssinaturaEletronica {
  const codigoBase = gerarCodigoValidacao(input.memorandoNumero, input.codigosExistentes);
  const documentosAssinados = criarDocumentosAssinados(codigoBase, input.documentosBase);

  return {
    id: uid("ass"),
    loteId: input.loteId,
    codigoValidacao: codigoBase,
    assinadaEm: input.dataHora,
    gerenteId: input.gerente.id,
    gerenteNome: input.gerente.nome,
    gerenteCargo: input.gerente.cargo,
    gerenteStatus: input.gerente.status,
    gerenteTelefoneCorporativo: input.gerente.telefoneCorporativo,
    gerenteTelefonePessoal: input.gerente.telefonePessoal,
    unidadeLocal: input.unidadeLocal,
    memorandoNumero: input.memorandoNumero,
    quantidadeProcessos: input.produtores.length,
    quantidadeProdutores: new Set(input.produtores.map((produtor) => produtor.cpf)).size,
    documentosAssinados,
  };
}

function criarDocumentosAssinados(codigoBase: string, processos: ProcessoSicpr[]): DocumentoAssinadoRegistro[] {
  const memorando = processos[0];
  const byKey = new Map<string, DocumentoAssinadoRegistro>();
  const add = (documento: DocumentoAssinadoRegistro) => byKey.set(`${documento.tipo}-${documento.arquivo}`, documento);

  if (memorando?.memorandoArquivo || memorando?.memorandoNumero) {
    add({
      tipo: "memorando",
      nome: "Memorando",
      arquivo: memorando.memorandoArquivo || `Memorando ${memorando.memorandoNumero}.pdf`,
      codigoDocumento: codigoDocumento(codigoBase, "MEM"),
    });
  } else {
    add({
      tipo: "memorando",
      nome: "Memorando",
      arquivo: `Memorando ${codigoBase.split("-")[2] || "do lote"}.pdf`,
      codigoDocumento: codigoDocumento(codigoBase, "MEM"),
    });
  }

  processos.forEach((processo) => {
    add({
      tipo: "declaracao_produtor",
      nome: `Declaracao - ${processo.produtor}`,
      arquivo: processo.declaracaoProdutor,
      codigoDocumento: codigoDocumento(codigoBase, "DEC"),
    });
  });

  return Array.from(byKey.values());
}

function gerarCodigoValidacao(memorandoNumero: string, codigosExistentes: string[]) {
  const year = new Date().getFullYear();
  const numero = memorandoNumero.split("/")[0]?.replace(/\D/g, "") || "0000";
  const existentes = new Set(codigosExistentes);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const random = Math.random().toString(16).slice(2, 6).toUpperCase().padEnd(4, "0");
    const codigo = `SICPR-${year}-${numero}-${random}`;
    if (!existentes.has(codigo)) return codigo;
  }

  return `SICPR-${year}-${numero}-${Date.now().toString(16).slice(-4).toUpperCase()}`;
}

function codigoDocumento(codigoBase: string, tipo: string) {
  const parts = codigoBase.split("-");
  const sufixo = parts.pop() || "";
  return `${parts.join("-")}-${tipo}-${sufixo}`;
}

function getFacStatusFromData(
  documentosGerados: Partial<Record<DocumentoGeradoProcesso["tipo"], Record<string, string>>>,
  documentos: Array<Pick<DocumentoProcesso, "nome" | "arquivo" | "conteudo" | "mimeType" | "tamanho"> & { id?: string; categoria?: DocumentoProcesso["categoria"] }>,
): FacStatus {
  if (getFacAssinadaDocumento(documentos)) return "assinada_anexada";
  if (documentosGerados.fac) return "gerada";
  return "nao_gerada";
}

function getFacAssinadaDocumento(
  documentos: Array<Pick<DocumentoProcesso, "nome" | "arquivo" | "conteudo" | "mimeType" | "tamanho"> & { id?: string; categoria?: DocumentoProcesso["categoria"] }>,
) {
  return documentos.find((documento) => documento.categoria === "fac_assinada");
}

