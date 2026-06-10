import type { GerenteUnidade, MemorandoProcessoRegistro, ProcessoSicpr } from "./types";
import { getFacAssinada, getFacStatus } from "./selectors";
import { nowIso } from "./utils";
export function normalizeProcesso(processo: ProcessoSicpr): ProcessoSicpr {
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
        assinatura: processo.assinaturaEletronica,
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
    facStatus: getFacStatus(processo),
    facGeradaEm: processo.facGeradaEm,
    facGeradaPor: processo.facGeradaPor,
    facImpressaEm: processo.facImpressaEm,
    facImpressaPor: processo.facImpressaPor,
    facAssinadaAnexadaEm: processo.facAssinadaAnexadaEm,
    facAssinadaAnexadaPor: processo.facAssinadaAnexadaPor,
    facAssinadaDocumentoId: processo.facAssinadaDocumentoId || getFacAssinada(processo)?.id,
    facRejeitadaMotivo: processo.facRejeitadaMotivo,
    documentos: processo.documentos.map((documento) => ({
      ...documento,
      categoria: documento.categoria || (documento.obrigatorio ? "obrigatorio" : "outros"),
    })),
  };
}

export function normalizeGerenteUnidade(gerente: GerenteUnidade): GerenteUnidade {
  return {
    ...gerente,
    cargo: gerente.cargo || "Gerente da Unidade Local",
    telefoneCorporativo: gerente.telefoneCorporativo || "",
    telefonePessoal: gerente.telefonePessoal || "",
    status: gerente.status || "ativo",
    cadastradoEm: gerente.cadastradoEm || nowIso(),
  };
}

