import type { GerenteUnidade, ProcessoSicpr } from "./types";
import { historico } from "./history";
import { nowIso } from "./utils";
export function createSeedGerentes(): GerenteUnidade[] {
  const base = nowIso();
  return [
    {
      id: "ger-demo-manacapuru",
      nome: "Gerente de Unidade Local",
      unidadeLocal: "Manacapuru",
      cargo: "Gerente da Unidade Local",
      telefoneCorporativo: "(92) 0000-0000",
      telefonePessoal: "",
      status: "ativo",
      cadastradoEm: base,
    },
  ];
}

export function createSeedProcessos(): ProcessoSicpr[] {
  const base = nowIso();
  return [
    {
      id: "proc-demo-1",
      produtor: "Beatriz Christine Azevedo Batista",
      cpf: "018.765.432-10",
      tipoProcesso: "inscricao",
      unidadeLocal: "Manacapuru",
      tecnicoResponsavel: "Tecnico da Unidade Local",
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
        historico("Tecnico da Unidade Local", "Processo criado", "Inscricao"),
        historico("Tecnico da Unidade Local", "Encaminhado ao gerente", "Manacapuru"),
      ],
    },
  ];
}

