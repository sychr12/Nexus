import type { DocumentoGeradoProcesso, DocumentoProcesso, HistoricoProcesso, MemorandoProcessoRegistro, ProcessoSicpr, SituacaoProcessoSicpr, TipoProcessoSicpr } from "./types";

export const FLUXO_PROCESSOS_KEY = "sicpr-fluxo-processos";
const MEMORANDO_SEQUENCE_KEY = "sicpr-fluxo-memorando-sequencia";

const nowIso = () => new Date().toISOString();
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

export const TIPO_PROCESSO_LABELS: Record<TipoProcessoSicpr, string> = {
  inscricao: "Inscricao",
  renovacao: "Renovacao",
  alteracao: "Alteracao",
};

export const SITUACAO_LABELS: Record<SituacaoProcessoSicpr, string> = {
  em_elaboracao: "Em elaboracao",
  encaminhado_gerente: "Encaminhado para gerente",
  devolvido_gerente: "Devolvido pelo gerente",
  aprovado_gerente: "Aprovado pelo gerente",
  em_analise: "Em analise",
  devolvido_analise: "Devolvido pela analise",
  aprovado_lancamento: "Aguardando lançamento",
  concluido: "Concluido",
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

export function historico(usuario: string, acao: string, observacao?: string): HistoricoProcesso {
  return {
    id: uid("hist"),
    usuario,
    acao,
    dataHora: nowIso(),
    observacao,
  };
}

export function loadProcessos(): ProcessoSicpr[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = JSON.parse(localStorage.getItem(FLUXO_PROCESSOS_KEY) || "[]") as ProcessoSicpr[];
    if (stored.length > 0) {
      const migrated = stored.map(normalizeProcesso);
      saveProcessos(migrated);
      return migrated;
    }
  } catch {
    localStorage.removeItem(FLUXO_PROCESSOS_KEY);
  }

  const seed = createSeedProcessos();
  saveProcessos(seed);
  return seed;
}

export function saveProcessos(processos: ProcessoSicpr[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FLUXO_PROCESSOS_KEY, JSON.stringify(processos));
}

export function addProcesso(
  processos: ProcessoSicpr[],
  input: {
    produtor: string;
    cpf: string;
    tipoProcesso: TipoProcessoSicpr;
    unidadeLocal: string;
    tecnicoResponsavel: string;
    documentosGerados: Partial<Record<DocumentoGeradoProcesso["tipo"], Record<string, string>>>;
    outrosDocumentos: Array<Pick<DocumentoProcesso, "nome" | "arquivo" | "conteudo" | "mimeType" | "tamanho">>;
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
    documentos: [
      ...input.outrosDocumentos.map((documento, index) => ({
        id: uid("doc"),
        nome: documento.nome || `Outro anexo ${index + 1}`,
        arquivo: documento.arquivo,
        obrigatorio: false,
        categoria: "outros" as const,
        conteudo: documento.conteudo,
        mimeType: documento.mimeType,
        tamanho: documento.tamanho,
      })),
    ],
    situacao: "em_elaboracao",
    criadoEm: createdAt,
    historico: [historico(input.tecnicoResponsavel, "Processo criado", TIPO_PROCESSO_LABELS[input.tipoProcesso])],
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
    outrosDocumentos: Array<Pick<DocumentoProcesso, "id" | "nome" | "arquivo" | "conteudo" | "mimeType" | "tamanho">>;
  },
) {
  return moverProcesso(processos, id, (processo) => ({
    ...processo,
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
      obrigatorio: false,
      categoria: "outros" as const,
      conteudo: documento.conteudo,
      mimeType: documento.mimeType,
      tamanho: documento.tamanho,
    })),
    historico: [...processo.historico, historico(usuario, "Correcao salva pela UNLOC", input.unidadeLocal)],
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
    ...processo,
    situacao: "encaminhado_gerente",
    tecnicoResponsavel: processo.tecnicoResponsavel || usuario,
    encaminhadoGerenteEm: dataHora,
    ultimaJustificativa: undefined,
    historico: [...processo.historico, historico(usuario, "Encaminhado ao gerente", processo.unidadeLocal)],
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

export function aprovarLoteGerente(processos: ProcessoSicpr[], ids: string[], gerente: string) {
  const memorandoNumero = gerarNumeroMemorando();
  const loteId = uid("lote");
  const dataHora = nowIso();
  const selected = new Set(ids);
  const produtores = processos
    .filter((processo) => selected.has(processo.id))
    .map((processo) => ({
      id: processo.id,
      produtor: processo.produtor,
      cpf: processo.cpf,
      tipoProcesso: processo.tipoProcesso,
    }));
  const memorando: MemorandoProcessoRegistro = {
    loteId,
    numero: memorandoNumero,
    arquivo: `Memorando ${memorandoNumero}.pdf`,
    criadoEm: dataHora,
    gerenteResponsavel: gerente,
    unidadeLocal: processos.find((processo) => selected.has(processo.id))?.unidadeLocal || "",
    quantidade: produtores.length,
    produtores,
  };

  return processos.map((processo) => {
    if (!selected.has(processo.id)) return processo;

    return {
      ...processo,
      situacao: "em_analise" as const,
      gerenteResponsavel: gerente,
      gerenteAssinadoEm: dataHora,
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
        historico(gerente, "Aprovado e assinado pelo gerente", `Memorando ${memorandoNumero}`),
        historico("Sistema", "Memorando de lote gerado", `${memorandoNumero} com ${ids.length} processo(s)`),
        historico("Sistema", "Documentos automaticos gerados", "Memorando, FAC e declaracoes"),
        historico(gerente, "Encaminhado para analise", processo.unidadeLocal),
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

export function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function getOutrosDocumentos(processo: ProcessoSicpr) {
  return processo.documentos.filter((documento) => documento.categoria === "outros" || !documento.obrigatorio);
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

function gerarNumeroMemorando() {
  const currentYear = new Date().getFullYear();
  const suffix = String(currentYear).slice(-2);
  const key = `${MEMORANDO_SEQUENCE_KEY}-${suffix}`;
  const next = Number(localStorage.getItem(key) || "0") + 1;
  localStorage.setItem(key, String(next));
  return `${String(next).padStart(4, "0")}/${suffix}`;
}

function normalizeProcesso(processo: ProcessoSicpr): ProcessoSicpr {
  const memorandoGerado =
    Boolean(processo.memorandoArquivo || processo.memorandoNumero) &&
    Boolean(processo.gerenteAssinadoEm) &&
    ["em_analise", "devolvido_analise", "aprovado_lancamento", "concluido"].includes(processo.situacao);
  const memorandoAtual: MemorandoProcessoRegistro | undefined = memorandoGerado && processo.memorandoNumero
    ? {
        loteId: processo.memorandoLoteId || `lote-legado-${processo.memorandoNumero}`,
        numero: processo.memorandoNumero,
        arquivo: processo.memorandoArquivo || `Memorando ${processo.memorandoNumero}.pdf`,
        criadoEm: processo.memorandoCriadoEm || processo.gerenteAssinadoEm || processo.enviadoAnaliseEm || processo.criadoEm,
        gerenteResponsavel: processo.gerenteResponsavel || "Gerente da Unidade Local",
        unidadeLocal: processo.unidadeLocal,
        quantidade: processo.memorandoQuantidade || processo.memorandoProdutores?.length || 1,
        produtores: processo.memorandoProdutores || [
          {
            id: processo.id,
            produtor: processo.produtor,
            cpf: processo.cpf,
            tipoProcesso: processo.tipoProcesso,
          },
        ],
      }
    : undefined;
  const memorandos = processo.memorandos || (memorandoAtual ? [memorandoAtual] : undefined);
  const ultimoMemorando = memorandos?.[memorandos.length - 1] || memorandoAtual;

  return {
    ...processo,
    formulario: processo.formulario || `Formulario cadastral - ${processo.produtor}.pdf`,
    fac: processo.fac || `FAC - ${processo.produtor}.pdf`,
    declaracaoProdutor: processo.declaracaoProdutor || `Declaracao do produtor rural - ${processo.produtor}.pdf`,
    declaracoes: "",
    memorandoArquivo: ultimoMemorando?.arquivo,
    memorandoCriadoEm: ultimoMemorando?.criadoEm,
    memorandoQuantidade: ultimoMemorando?.quantidade,
    memorandoProdutores: ultimoMemorando?.produtores,
    memorandos,
    documentosGerados: processo.documentosGerados || {},
    documentos: processo.documentos.map((documento) => ({
      ...documento,
      categoria: documento.categoria || (documento.obrigatorio ? "obrigatorio" : "outros"),
    })),
  };
}

function createSeedProcessos(): ProcessoSicpr[] {
  const base = nowIso();
  return [
    {
      id: "proc-demo-1",
      produtor: "Beatriz Christine Azevedo Batista",
      cpf: "018.765.432-10",
      tipoProcesso: "inscricao",
      unidadeLocal: "Manacapuru",
      tecnicoResponsavel: "Tecnico UNLOC",
      formulario: "Formulario cadastral - Beatriz.pdf",
      fac: "FAC - Beatriz.pdf",
      declaracaoProdutor: "Declaracao do produtor rural - Beatriz.pdf",
      declaracoes: "",
      documentosGerados: {
        fac: {
          endereco: "Margem direita do Rio Purus",
          propriedade: "Sitio Terra Nova",
          atividade: "Horticultura",
        },
        declaracao_produtor: {
          atividadePrincipal: "Horticultura",
          area: "0,2 ha",
        },
      },
      documentos: [
        { id: "doc-demo-3", nome: "Outro anexo 1", arquivo: "croqui-propriedade.pdf", obrigatorio: false, categoria: "outros" },
      ],
      situacao: "encaminhado_gerente",
      criadoEm: base,
      encaminhadoGerenteEm: base,
      historico: [
        historico("Tecnico UNLOC", "Processo criado", "Inscricao"),
        historico("Tecnico UNLOC", "Encaminhado ao gerente", "Manacapuru"),
      ],
    },
  ];
}
