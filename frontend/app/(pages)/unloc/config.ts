import type { DocumentoProcesso, TipoProcessoSicpr } from "@/app/_features/fluxo/types";

export const initialForm = {
  produtor: "",
  cpf: "",
  tipoProcesso: "inscricao" as TipoProcessoSicpr,
  unidadeLocal: "",
};

export type AnexoUpload = Pick<DocumentoProcesso, "id" | "nome" | "arquivo" | "conteudo" | "mimeType" | "tamanho"> & {
  categoria?: DocumentoProcesso["categoria"];
};
export type GeneratedDocKey = "fac" | "declaracao_produtor";
export type ProcessoFilter = "todos" | "em_elaboracao" | "encaminhado_gerente" | "em_analise" | "devolvidos" | "concluidos";
export type DetailTab = "dados" | "historico" | "documentos";
export type CampoDocumento = {
  key: string;
  label: string;
  placeholder?: string;
  secao?: string;
  tipo?: "text" | "select" | "textarea";
  opcoes?: string[];
  obrigatorio?: boolean;
  complementar?: boolean;
};

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
  campos: CampoDocumento[];
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
      { key: "rg", label: "RG / Documento de identidade", placeholder: "Ex.: 194.514 SSP/AC", secao: "Dados básicos", obrigatorio: true },
      { key: "emissor", label: "Estado emissor", placeholder: "Ex.: SEP/AC", secao: "Dados básicos", obrigatorio: true },
      { key: "rua", label: "Rua / Av.", placeholder: "Ex.: Zona Rural", secao: "Dados básicos", obrigatorio: true },
      { key: "bairro", label: "Bairro", placeholder: "Ex.: Zona Rural", secao: "Dados básicos", obrigatorio: true },
      { key: "municipio", label: "Município", placeholder: "Ex.: Boca do Acre", secao: "Dados básicos", obrigatorio: true },
      { key: "uf", label: "UF", placeholder: "Ex.: AM", secao: "Dados básicos", obrigatorio: true },
      { key: "endereco", label: "Endereço da propriedade", placeholder: "Ex.: Margem direita do Rio Purus", secao: "Dados do imóvel", obrigatorio: true },
      { key: "propriedade", label: "Nome da propriedade", placeholder: "Ex.: Sítio Terra Nova", secao: "Dados do imóvel", obrigatorio: true },
      { key: "comunidade", label: "Comunidade", placeholder: "Ex.: Lago Novo", secao: "Dados do imóvel", obrigatorio: true },
      { key: "posse", label: "Tipo de posse", secao: "Dados do imóvel", tipo: "select", opcoes: ["Proprietário", "Arrendatário", "Comodatário", "Usufrutuário", "Posseiro", "Outros"], obrigatorio: true },
      { key: "situacao", label: "Situação do imóvel", secao: "Dados do imóvel", tipo: "select", opcoes: ["Zona rural", "Zona urbana", "Parte rural", "Parte urbana"], obrigatorio: true },
      { key: "acesso", label: "Condição de acesso", secao: "Dados do imóvel", tipo: "select", opcoes: ["Asfalto", "Via fluvial", "Terra", "Rio"], obrigatorio: true },
      { key: "areaTotal", label: "Área total do imóvel (ha)", placeholder: "Ex.: 15,00", secao: "Dados do imóvel", obrigatorio: true },
      { key: "areaExplorada", label: "Área explorada (ha)", placeholder: "Ex.: 0,5", secao: "Dados do imóvel", obrigatorio: true },
      { key: "atividadeTipo", label: "Tipo de atividade", secao: "Produção", tipo: "select", opcoes: ["Extrativismo", "Lavoura", "Pecuária", "Agropecuária", "Silvicultura", "Avicultura", "Pesca", "Outra"], obrigatorio: true },
      { key: "producoes", label: "Principais produções", placeholder: "Ex.: Banana, mandioca, milho", secao: "Produção", tipo: "textarea", obrigatorio: true },
      { key: "observacao", label: "Observações", placeholder: "Campo livre", secao: "Produção", tipo: "textarea" },
      { key: "inscricaoEstadual", label: "Inscrição estadual", placeholder: "Opcional", secao: "Cadastro", complementar: true },
      { key: "inscricaoImovel", label: "Número do INCRA", placeholder: "Ex.: INCRA / SEPROR / PM", secao: "Dados fundiários", complementar: true },
      { key: "areaOutroEstado", label: "Área em outro estado", placeholder: "Ex.: Não", secao: "Áreas complementares", complementar: true },
      { key: "areaArrendada", label: "Área arrendada", placeholder: "Ex.: Não", secao: "Áreas complementares", complementar: true },
      { key: "maquina", label: "Possui máquina de beneficiamento?", secao: "Informações complementares", tipo: "select", opcoes: ["Não", "Sim"], complementar: true },
      { key: "terceiros", label: "Beneficia produtos de terceiros?", secao: "Informações complementares", tipo: "select", opcoes: ["Não", "Sim"], complementar: true },
      { key: "talonario", label: "Possui talonário de notas fiscais?", secao: "Informações complementares", tipo: "select", opcoes: ["Não", "Sim"], complementar: true },
      { key: "parceria", label: "Possui parceria?", secao: "Informações complementares", tipo: "select", opcoes: ["Não", "Sim"], complementar: true },
      { key: "distancia", label: "Distância até a sede do município", placeholder: "Ex.: 20 km", secao: "Informações complementares", complementar: true },
      { key: "beneficiados", label: "Produtos fabricados ou beneficiados", placeholder: "Ex.: Farinha, polpa, queijo", secao: "Produção complementar", tipo: "textarea", complementar: true },
      { key: "marcas", label: "Marcas utilizadas", placeholder: "Campo texto", secao: "Marcas utilizadas", complementar: true },
      { key: "localMarca", label: "Local de colocação da marca", placeholder: "Campo texto", secao: "Marcas utilizadas", complementar: true },
    ],
  },
];
