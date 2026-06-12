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
  maxLength?: number;
};

export const PAGE_SIZE = 50;

export const PROCESS_FILTERS: Array<{ id: ProcessoFilter; label: string }> = [
  { id: "em_elaboracao", label: "Em elaboracao" },
  { id: "encaminhado_gerente", label: "Aguardando gerente" },
  { id: "em_analise", label: "Em analise" },
  { id: "devolvidos", label: "Devolvidos" },
  { id: "concluidos", label: "Concluidos" },
  { id: "todos", label: "Todos" },
];

export const DETAIL_TABS: Array<{ key: DetailTab; label: string }> = [
  { key: "dados", label: "Dados" },
  { key: "historico", label: "Historico" },
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
    nome: "Declaracao",
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
      { key: "latitude", label: "Latitude", placeholder: "Ex.: (S) 08°05'28,62\"", maxLength: 40 },
      { key: "longitude", label: "Longitude", placeholder: "Ex.: (W) 067°37'10,93\"", maxLength: 40 },
    ],
  },
  {
    tipo: "fac",
    nome: "FAC",
    descricao: "Declaracao de produtor rural com dados cadastrais.",
    campos: [
      { key: "rg", label: "RG / Documento de identidade", placeholder: "Ex.: 194.514 SSP/AC", secao: "Dados basicos", obrigatorio: true },
      { key: "emissor", label: "Estado emissor", placeholder: "Ex.: SSP/AM", secao: "Dados basicos", obrigatorio: true },
      { key: "rua", label: "Rua / Av.", placeholder: "Ex.: Zona Rural", secao: "Dados basicos", obrigatorio: true },
      { key: "bairro", label: "Bairro", placeholder: "Ex.: Zona Rural", secao: "Dados basicos", obrigatorio: true },
      { key: "municipio", label: "Municipio", placeholder: "Ex.: Boca do Acre", secao: "Dados basicos", obrigatorio: true },
      { key: "uf", label: "UF", placeholder: "Ex.: AM", secao: "Dados basicos", obrigatorio: true },
      { key: "endereco", label: "Endereco da propriedade", placeholder: "Ex.: Margem direita do Rio Purus", secao: "Dados do imovel", obrigatorio: true },
      { key: "propriedade", label: "Nome da propriedade", placeholder: "Ex.: Sitio Terra Nova", secao: "Dados do imovel", obrigatorio: true },
      { key: "comunidade", label: "Comunidade", placeholder: "Ex.: Lago Novo", secao: "Dados do imovel", obrigatorio: true },
      { key: "latitude", label: "Latitude", placeholder: "Ex.: (S) 08°05'28,62\"", secao: "Georreferenciamento", obrigatorio: true, maxLength: 40 },
      { key: "longitude", label: "Longitude", placeholder: "Ex.: (W) 067°37'10,93\"", secao: "Georreferenciamento", obrigatorio: true, maxLength: 40 },
      { key: "posse", label: "Tipo de posse", secao: "Dados do imovel", tipo: "select", opcoes: ["Proprietario", "Arrendatario", "Comodatario", "Usufrutuario", "Posseiro", "Outros"], obrigatorio: true },
      { key: "situacao", label: "Situacao do imovel", secao: "Dados do imovel", tipo: "select", opcoes: ["Zona rural", "Zona urbana", "Parte rural", "Parte urbana"], obrigatorio: true },
      { key: "acesso", label: "Condicao de acesso", secao: "Dados do imovel", tipo: "select", opcoes: ["Asfalto", "Via fluvial", "Terra", "Rio"], obrigatorio: true },
      { key: "areaTotal", label: "Area total do imovel (ha)", placeholder: "Ex.: 15,00", secao: "Dados do imovel", obrigatorio: true },
      { key: "areaExplorada", label: "Area explorada (ha)", placeholder: "Ex.: 0,5", secao: "Dados do imovel", obrigatorio: true },
      { key: "atividadeTipo", label: "Tipo de atividade", secao: "Producao", tipo: "select", opcoes: ["Extrativismo", "Lavoura", "Pecuaria", "Agropecuaria", "Silvicultura", "Avicultura", "Pesca", "Outra"], obrigatorio: true },
      { key: "producoes", label: "Principais producoes", placeholder: "Ex.: Banana, mandioca, milho", secao: "Producao", tipo: "textarea", obrigatorio: true },
      { key: "observacao", label: "Observacoes", placeholder: "Campo livre", secao: "Producao", tipo: "textarea" },
      { key: "numeroEndereco", label: "Nome e numero do endereco", placeholder: "Ex.: Casa 12", secao: "Dados basicos", complementar: true },
      { key: "codigoMunicipalEndereco", label: "Codigo municipal do endereco", placeholder: "Ex.: 023", secao: "Dados basicos", complementar: true },
      { key: "cep", label: "CEP para correspondencia", placeholder: "Ex.: 69000-000", secao: "Dados basicos", complementar: true },
      { key: "inscricaoEstadual", label: "Inscricao estadual", placeholder: "Opcional", secao: "Cadastro", complementar: true },
      { key: "inscricaoImovel", label: "Numero do INCRA / SEPROR / PM", placeholder: "Ex.: INCRA / SEPROR / PM", secao: "Dados fundiarios", complementar: true },
      { key: "cepPropriedade", label: "CEP da propriedade", placeholder: "Ex.: 69000-000", secao: "Dados fundiarios", complementar: true },
      { key: "municipioPropriedade", label: "Municipio da propriedade", placeholder: "Ex.: Boca do Acre", secao: "Dados fundiarios", complementar: true },
      { key: "codigoMunicipal", label: "Codigo municipal da propriedade", placeholder: "Ex.: 023", secao: "Dados fundiarios", complementar: true },
      { key: "areaOutroEstado", label: "Area em outro estado", placeholder: "Ex.: Nao", secao: "Areas complementares", complementar: true },
      { key: "areaEstado", label: "Area no estado", placeholder: "Ex.: 15,00", secao: "Areas complementares", complementar: true },
      { key: "areaCultivada", label: "Area cultivada", placeholder: "Ex.: 0,5", secao: "Areas complementares", complementar: true },
      { key: "areaArrendada", label: "Area arrendada", placeholder: "Ex.: Nao", secao: "Areas complementares", complementar: true },
      { key: "areaParceria", label: "Area explorada em parceria", placeholder: "Ex.: Nao", secao: "Areas complementares", complementar: true },
      { key: "outrasPropriedades", label: "Outras propriedades no estado", placeholder: "Relacione se houver", secao: "Outras propriedades", tipo: "textarea", complementar: true },
      { key: "municipioOutras", label: "Municipio das outras propriedades", placeholder: "Ex.: Boca do Acre", secao: "Outras propriedades", complementar: true },
      { key: "areaOutras", label: "Area total das outras propriedades", placeholder: "Ex.: 5,00", secao: "Outras propriedades", complementar: true },
      { key: "maquina", label: "Possui maquina de beneficiamento?", secao: "Informacoes complementares", tipo: "select", opcoes: ["Nao", "Sim"], complementar: true },
      { key: "terceiros", label: "Beneficia produtos de terceiros?", secao: "Informacoes complementares", tipo: "select", opcoes: ["Nao", "Sim"], complementar: true },
      { key: "talonario", label: "Possui talonario de notas fiscais?", secao: "Informacoes complementares", tipo: "select", opcoes: ["Nao", "Sim"], complementar: true },
      { key: "parceria", label: "Possui parceria?", secao: "Informacoes complementares", tipo: "select", opcoes: ["Nao", "Sim"], complementar: true },
      { key: "distancia", label: "Distancia ate a sede do municipio", placeholder: "Ex.: 20 km", secao: "Informacoes complementares", complementar: true },
      { key: "beneficiados", label: "Produtos fabricados ou beneficiados", placeholder: "Ex.: Farinha, polpa, queijo", secao: "Producao complementar", tipo: "textarea", complementar: true },
      { key: "marcas", label: "Marcas utilizadas", placeholder: "Campo texto", secao: "Marcas utilizadas", complementar: true },
      { key: "localMarca", label: "Local de colocacao da marca", placeholder: "Campo texto", secao: "Marcas utilizadas", complementar: true },
      { key: "local", label: "Local de assinatura", placeholder: "Ex.: Boca do Acre - AM", secao: "Assinatura", complementar: true },
      { key: "data", label: "Data de assinatura", placeholder: "Ex.: 12/06/2026", secao: "Assinatura", complementar: true },
    ],
  },
];
