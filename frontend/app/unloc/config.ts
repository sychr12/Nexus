import type { DocumentoProcesso, TipoProcessoSicpr } from "../fluxo/types";

export const initialForm = {
  produtor: "",
  cpf: "",
  tipoProcesso: "inscricao" as TipoProcessoSicpr,
  unidadeLocal: "",
};

export type AnexoUpload = Pick<DocumentoProcesso, "id" | "nome" | "arquivo" | "conteudo" | "mimeType" | "tamanho">;
export type GeneratedDocKey = "fac" | "declaracao_produtor";
export type ProcessoFilter = "todos" | "em_elaboracao" | "encaminhado_gerente" | "em_analise" | "devolvidos" | "concluidos";
export type DetailTab = "dados" | "historico" | "documentos";

export const PAGE_SIZE = 50;

export const PROCESS_FILTERS: Array<{ id: ProcessoFilter; label: string }> = [
  { id: "em_elaboracao", label: "Em elaboração" },
  { id: "encaminhado_gerente", label: "Aguardando gerente" },
  { id: "em_analise", label: "Em análise" },
  { id: "devolvidos", label: "Devolvidos" },
  { id: "concluidos", label: "Concluídos" },
  { id: "todos", label: "Todos" },
];

export const DETAIL_TABS: Array<{ key: DetailTab; label: string }> = [
  { key: "dados", label: "Dados" },
  { key: "historico", label: "Histórico" },
  { key: "documentos", label: "Documentos" },
];

export const DOCUMENT_MODELS: Array<{
  tipo: GeneratedDocKey;
  nome: string;
  descricao: string;
  campos: Array<{ key: string; label: string; placeholder: string }>;
}> = [
  {
    tipo: "declaracao_produtor",
    nome: "Declaração",
    descricao: "Declaracao textual assinada pela unidade local.",
    campos: [
      { key: "numero", label: "Numero da declaracao", placeholder: "Ex.: BOA 437/2026" },
      { key: "rg", label: "RG / Documento de identidade", placeholder: "Ex.: 194.514 SEP/AC" },
      { key: "propriedade", label: "Nome da propriedade", placeholder: "Ex.: Sitio Terra Nova" },
      { key: "endereco", label: "Endereco/comunidade", placeholder: "Ex.: Margem direita do Rio Purus Comunidade Lago Novo" },
      { key: "anoAtendimento", label: "Atendido desde", placeholder: "Ex.: 2012" },
      { key: "atividadePrincipal", label: "Atividade principal", placeholder: "Ex.: Horticultura" },
      { key: "area", label: "Area", placeholder: "Ex.: 0,2 ha" },
      { key: "incluindo", label: "Incluindo", placeholder: "Ex.: Cultivo de Alface e Cebola de palha" },
      { key: "latitude", label: "Latitude", placeholder: "Ex.: 08°75'28,62\"" },
      { key: "longitude", label: "Longitude", placeholder: "Ex.: 67°37'10,93\"" },
    ],
  },
  {
    tipo: "fac",
    nome: "FAC",
    descricao: "Declaracao de produtor rural com dados cadastrais.",
    campos: [
      { key: "inscricaoEstadual", label: "Inscricao estadual", placeholder: "Opcional" },
      { key: "rg", label: "RG / Documento de identidade", placeholder: "Ex.: 194.514 SSP/AC" },
      { key: "emissor", label: "Estado emissor", placeholder: "Ex.: SEP/AC" },
      { key: "rua", label: "Rua / Av.", placeholder: "Ex.: Zona Rural" },
      { key: "bairro", label: "Bairro", placeholder: "Ex.: Zona Rural" },
      { key: "municipio", label: "Municipio", placeholder: "Ex.: Boca do Acre" },
      { key: "uf", label: "UF", placeholder: "Ex.: AM" },
      { key: "endereco", label: "Endereco da propriedade", placeholder: "Ex.: Margem direita do Rio Purus" },
      { key: "propriedade", label: "Nome da propriedade", placeholder: "Ex.: Sitio Terra Nova" },
      { key: "comunidade", label: "Comunidade", placeholder: "Ex.: Lago Novo" },
      { key: "atividade", label: "Atividade principal", placeholder: "Ex.: Horticultura" },
      { key: "areaTotal", label: "Area total", placeholder: "Ex.: 15,00" },
      { key: "areaExplorada", label: "Area explorada", placeholder: "Ex.: 0,5 HA" },
      { key: "producoes", label: "Principais producoes", placeholder: "Ex.: Horticultura, exceto morango" },
      { key: "observacao", label: "Observacoes", placeholder: "Ex.: Atividade Principal - Alface 0,2 ha" },
    ],
  },
];
