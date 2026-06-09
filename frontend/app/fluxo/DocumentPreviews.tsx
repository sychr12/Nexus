"use client";

import type { ReactNode } from "react";
import type { DocumentoGeradoProcesso, ProcessoSicpr, TipoProcessoSicpr } from "./types";

const typeLabels: Record<TipoProcessoSicpr, string> = {
  inscricao: "Inscricao",
  renovacao: "Renovacao",
  alteracao: "Alteracao",
};

type DraftProcesso = Pick<
  ProcessoSicpr,
  | "produtor"
  | "cpf"
  | "tipoProcesso"
  | "unidadeLocal"
  | "tecnicoResponsavel"
  | "gerenteResponsavel"
  | "assinaturaEletronica"
  | "memorandoNumero"
  | "memorandoCriadoEm"
  | "memorandoQuantidade"
  | "memorandoProdutores"
>;

interface PreviewProps {
  processo: DraftProcesso;
  documento: DocumentoGeradoProcesso;
  dados?: Record<string, string>;
}

const value = (dados: Record<string, string> | undefined, key: string, fallback = "") => dados?.[key] || fallback;
const longDate = (date = new Date()) =>
  date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
const formatSignatureDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.toLocaleDateString("pt-BR")} às ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
};

function gerenteCargoLabel(assinatura: NonNullable<DraftProcesso["assinaturaEletronica"]>) {
  if (assinatura.gerenteStatus === "respondendo") {
    return `Responsável pela Unidade Local de ${assinatura.unidadeLocal}`;
  }

  const cargo = assinatura.gerenteCargo || "Gerente da Unidade Local";
  const cargoNormalizado = cargo.trim().replace(/\s+/g, " ");

  if (/unidade local de/i.test(cargoNormalizado) || /unloc/i.test(cargoNormalizado)) {
    return cargoNormalizado;
  }

  if (/unidade local$/i.test(cargoNormalizado)) {
    return `${cargoNormalizado} de ${assinatura.unidadeLocal}`;
  }

  return `${cargoNormalizado} da Unidade Local de ${assinatura.unidadeLocal}`;
}

export function GeneratedDocumentPreview({ processo, documento, dados }: PreviewProps) {
  if (documento.tipo === "fac") {
    return <FacPreview processo={processo} dados={dados || documento.dados || {}} />;
  }

  if (documento.tipo === "declaracao_produtor") {
    return <DeclaracaoPreview processo={processo} dados={dados || documento.dados || {}} />;
  }

  if (documento.tipo === "formulario") {
    return <FormularioPreview processo={processo} />;
  }

  return <MemorandoPreview processo={processo} />;
}

function AmazonasHeader() {
  return (
    <header className="mb-6 text-center">
      <div className="mx-auto flex w-fit items-center justify-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#D3A230] text-xs font-black text-[#2F6B45]">
          AM
        </div>
        <div className="text-left">
          <p className="text-4xl font-black tracking-wide text-[#58A267]">AMAZONAS</p>
          <p className="-mt-1 text-xs font-bold uppercase tracking-widest text-[#315B6D]">Governo do Estado</p>
        </div>
      </div>
      <div className="mx-auto mt-2 h-1 w-40 bg-[#315B6D]" />
      <div className="mx-auto mt-1 h-1 w-40 bg-[#E2B642]" />
    </header>
  );
}

function NumberBadge({ value }: { value: string }) {
  return (
    <span className="inline-flex h-3.5 min-w-3.5 items-center justify-center border border-[#6B8370] bg-white px-0.5 text-[7px] font-bold leading-none text-[#536A58]">
      {value}
    </span>
  );
}

function FacLabel({ label }: { label: string }) {
  const match = label.match(/^(\d{2})(?:\s+(.+))?$/);

  if (!match) {
    return <span>{label}</span>;
  }

  return (
    <span className="inline-flex items-center gap-1">
      <NumberBadge value={match[1]} />
      {match[2] ? <span>{match[2]}</span> : null}
    </span>
  );
}

function FacCell({ label, children, className = "" }: { label: string; children?: ReactNode; className?: string }) {
  return (
    <div className={`min-h-[30px] border border-[#6B8370] px-1 py-0.5 ${className}`}>
      <p className="text-[7px] font-semibold uppercase leading-none text-[#536A58]">
        <FacLabel label={label} />
      </p>
      <div className="mt-0.5 min-h-3.5 text-[10px] font-semibold leading-tight text-black">{children || "\u00A0"}</div>
    </div>
  );
}

function FacLineLabel({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`px-1.5 py-1 ${className}`}>
      <p className="text-[7px] font-semibold uppercase leading-none text-[#536A58]">{label}</p>
    </div>
  );
}

function BottomOfficialBlock({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="border border-[#6B8370] bg-white">
      <div className="flex min-h-6 items-center gap-1 px-1.5 py-1">
        <NumberBadge value={number} />
        <span className="text-[7px] font-bold uppercase leading-none text-[#536A58]">{title}</span>
      </div>
      {children}
    </div>
  );
}

function MiniBox({ active, label, code }: { active?: boolean; label: string; code?: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex h-3.5 w-3.5 items-center justify-center border border-[#6B8370] text-[9px] font-bold">
        {active ? "X" : ""}
      </span>
      <span>{label}</span>
      {code ? (
        <span className="inline-flex h-4 min-w-4 items-center justify-center border border-[#6B8370] px-0.5 text-[7px] font-bold">
          {code}
        </span>
      ) : null}
    </span>
  );
}

function FacWarningShape() {
  const clipPath = "polygon(0 0, 78% 0, 100% 50%, 78% 100%, 0 100%)";

  return (
    <div className="relative h-12 w-16 shrink-0" style={{ clipPath }}>
      <div className="absolute inset-0 bg-[#6B8370]" />
      <div className="absolute inset-px bg-white px-1 py-1 text-center text-[7px] font-bold uppercase leading-[8px] text-[#536A58]" style={{ clipPath }}>
        Não utilize em caso de inscrição
      </div>
    </div>
  );
}

function InscricaoProdutorBlock({ processo, dados }: { processo: DraftProcesso; dados: Record<string, string> }) {
  const shortDivider = "before:absolute before:left-0 before:top-0 before:h-4 before:border-l before:border-[#6B8370]";

  return (
    <div className="border-l border-[#6B8370]">
      <div className="relative flex min-h-5 items-center justify-center border-b border-[#6B8370] text-[7px] font-bold uppercase text-[#536A58]">
        <span className="absolute left-2 top-0.5 text-[10px] font-bold leading-none text-[#2F7A36]">03</span>
        Inscrição de produtor
      </div>
      <div>
        <div className="grid min-h-[58px] grid-cols-[42px_1fr] border-b border-[#6B8370]">
          <div className="px-2 py-2 text-[10px] font-bold leading-none text-[#2F7A36]">01</div>
          <div className="flex items-center gap-4 px-2 py-1">
            <FacWarningShape />
            <div className="flex min-h-12 flex-1 flex-col items-center justify-start rounded-xl border-2 border-[#9AA89E] px-3 py-2 text-center text-[7px] font-bold uppercase text-[#536A58]">
              Inscrição estadual:
              <span className="mt-3 block text-[10px] text-black">{value(dados, "inscricaoEstadual", "")}</span>
            </div>
          </div>
        </div>
        <div className="grid min-h-[32px] grid-cols-[26px_1fr] border-b border-[#6B8370]">
          <div>
            <NumberBadge value="02" />
          </div>
          <div className={`relative pl-2 ${shortDivider}`}>
            <FacLineLabel label="Nº do CPF" />
            <div className="flex justify-center text-[14px] font-bold leading-none">{processo.cpf}</div>
          </div>
        </div>
        <div className="grid min-h-[34px] grid-cols-[26px_1.45fr_26px_.8fr]">
          <div>
            <NumberBadge value="03" />
          </div>
          <div className={`relative border-r border-[#6B8370] px-1 py-0.5 pl-3 ${shortDivider}`}>
            <p className="text-[7px] font-semibold uppercase leading-none text-[#536A58]">Nº de documento de identidade</p>
            <div className="mt-1.5 text-center text-[13px] font-semibold leading-none">{value(dados, "rg", "194.514")}</div>
          </div>
          <div>
            <NumberBadge value="04" />
          </div>
          <div className={`relative px-1 py-0.5 pl-3 ${shortDivider}`}>
            <p className="text-[7px] font-semibold uppercase leading-none text-[#536A58]">Estado emissor</p>
            <div className="mt-1.5 text-center text-[13px] font-bold leading-none">{value(dados, "emissor", "SEP/AC")}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FacPreview({ processo, dados }: { processo: DraftProcesso; dados: Record<string, string> }) {
  const pedido = processo.tipoProcesso;
  const atividadeTipo = value(dados, "atividadeTipo", "Agropecuária").toLowerCase();
  const posse = value(dados, "posse", "Proprietário").toLowerCase();
  const situacao = value(dados, "situacao", "Zona rural").toLowerCase();
  const acesso = value(dados, "acesso", "Via fluvial").toLowerCase();

  return (
    <div className="sicpr-print-document sicpr-fac-document mx-auto w-full max-w-[720px] bg-white p-3 text-[9px] leading-tight text-black shadow-sm">
      <div className="grid grid-cols-[1.05fr_2.1fr_.45fr_.75fr] border border-[#6B8370]">
        <div className="flex items-center gap-2 border-r border-[#6B8370] p-2 text-[7px] font-bold uppercase text-[#42664A]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/brasao-amazonas.png" alt="Brasão do Amazonas" className="h-8 w-8 shrink-0 object-contain" />
          <span>Secretaria de Estado da Economia, Fazenda e Turismo</span>
        </div>
        <div className="border-r border-[#6B8370] p-2 text-center text-[13px] font-bold uppercase">
          Declaracao de Produtor Rural (Dados Cadastrais)
        </div>
        <div className="flex items-start justify-center border-r border-[#6B8370] p-1.5 text-[7px] uppercase">
          <NumberBadge value="01" />
        </div>
        <div className="p-2 text-center text-[7px] uppercase">Microfilme</div>
      </div>

      <div className="grid grid-cols-[1.15fr_2.85fr] border-x border-b border-[#6B8370]">
        <div className="border-r border-[#6B8370] p-2">
          <p className="mb-2 text-[7px] font-bold uppercase text-[#536A58]">
            <FacLabel label="02 Natureza do pedido" />
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[9px]">
            <MiniBox active={pedido === "inscricao"} label="Inscricao" code="1" />
            <MiniBox label="Baixa" code="2" />
            <MiniBox active={pedido === "alteracao"} label="Alteracao" code="3" />
            <MiniBox active={pedido === "renovacao"} label="2a via" code="4" />
          </div>
        </div>
        <InscricaoProdutorBlock processo={processo} dados={dados} />
      </div>

      <div className="border-x border-b border-[#6B8370]">
        <FacCell label="05 Nome do produtor" className="text-center">
          {processo.produtor || "Nome do produtor"}
        </FacCell>
      </div>

      <div className="border-x border-b border-[#6B8370]">
        <p className="border-b border-[#6B8370] py-0.5 text-center text-[7px] font-semibold uppercase text-[#536A58]">Endereço para correspondência</p>
        <div className="grid grid-cols-[.9fr_2.1fr]">
          <FacCell label="06 Rua/Av">{value(dados, "rua", "Zona Rural")}</FacCell>
          <FacCell label="07 Nome e Nº">{value(dados, "numeroEndereco", "")}</FacCell>
        </div>
        <div className="grid grid-cols-[1fr_1.3fr_.75fr_.45fr_.8fr]">
          <FacCell label="08 Bairro">{value(dados, "bairro", "Zona Rural")}</FacCell>
          <FacCell label="09 Município">{value(dados, "municipio", processo.unidadeLocal)}</FacCell>
          <FacCell label="10 Cód. municipal">{value(dados, "codigoMunicipalEndereco", "")}</FacCell>
          <FacCell label="11 UF">{value(dados, "uf", "AM")}</FacCell>
          <FacCell label="12 CEP">{value(dados, "cep", "")}</FacCell>
        </div>
      </div>

      <div className="grid grid-cols-[2.2fr_.7fr] border-x border-b border-[#6B8370]">
        <FacCell label="13 Endereço da propriedade">{value(dados, "endereco", "Margem direita do Rio Purus")}</FacCell>
        <FacCell label="14 CEP">{value(dados, "cepPropriedade", "")}</FacCell>
      </div>
      <div className="grid grid-cols-[1.75fr_1.25fr] border-x border-b border-[#6B8370]">
        <FacCell label="15 Nome da propriedade">{value(dados, "propriedade", "Sitio Terra Nova")}</FacCell>
        <FacCell label="16 Nº da inscrição INCRA ou SEPROR ou PM">{value(dados, "inscricaoImovel", "")}</FacCell>
      </div>
      <div className="grid grid-cols-[1.25fr_1.25fr_.75fr] border-x border-b border-[#6B8370]">
        <FacCell label="17 Comunidade">{value(dados, "comunidade", "Lago Novo")}</FacCell>
        <FacCell label="18 Município">{value(dados, "municipioPropriedade", value(dados, "municipio", processo.unidadeLocal))}</FacCell>
        <FacCell label="19 Cód. municipal">{value(dados, "codigoMunicipal", "")}</FacCell>
      </div>

      <div className="grid grid-cols-[1.05fr_1.15fr_1fr_1fr_1fr] border-x border-b border-[#6B8370]">
        <FacCell label="20 Atividade">
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[8px]">
            <MiniBox active={atividadeTipo.includes("extrativ")} label="Extrativismo" />
            <MiniBox active={atividadeTipo.includes("silvic")} label="Silvicultura" />
            <MiniBox active={atividadeTipo.includes("lavoura")} label="Lavoura" />
            <MiniBox active={atividadeTipo.includes("avic")} label="Avicultura" />
            <MiniBox active={atividadeTipo.includes("pecu") && !atividadeTipo.includes("agro")} label="Pecuária" />
            <MiniBox active={atividadeTipo.includes("pesca")} label="Pesca" />
            <MiniBox active={atividadeTipo.includes("agro")} label="Agropecuária" />
            <MiniBox active={atividadeTipo.includes("outra")} label="Outras" />
          </div>
        </FacCell>
        <FacCell label="21 Tipo de posse ou domínio do imóvel">
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[8px]">
            <MiniBox active={posse.includes("propriet")} label="Proprietário" />
            <MiniBox active={posse.includes("posse")} label="Posseiro" />
            <MiniBox active={posse.includes("arrend")} label="Arrendatário" />
            <MiniBox active={posse.includes("comod")} label="Comodatário" />
            <MiniBox active={posse.includes("usuf")} label="Usufrutuário" />
            <MiniBox active={posse.includes("outro")} label="Outros" />
          </div>
        </FacCell>
        <FacCell label="22 Situação do imóvel">
          <div className="grid gap-1 text-[8px]">
            <MiniBox active={situacao.includes("rural") && !situacao.includes("parte")} label="Zona rural" />
            <MiniBox active={situacao.includes("urbana") && !situacao.includes("parte")} label="Zona urbana" />
            <MiniBox active={situacao.includes("parte rural")} label="Parte rural" />
            <MiniBox active={situacao.includes("parte urbana")} label="Parte urbana" />
          </div>
        </FacCell>
        <FacCell label="23 Condição de acesso à sede do município">
          <div className="grid gap-1 text-[8px]">
            <MiniBox active={acesso.includes("asfalto")} label="Asfalto" />
            <MiniBox active={acesso.includes("fluvial")} label="Via fluvial" />
            <MiniBox active={acesso.includes("terra")} label="Terra" />
            <MiniBox active={acesso.includes("rio")} label="Rio" />
          </div>
        </FacCell>
        <FacCell label="29 Área explorada">{value(dados, "areaExplorada", "0,5 HA")}</FacCell>
      </div>

      <div className="grid grid-cols-6 border-x border-b border-[#6B8370]">
        <FacCell label="24 Área total do imóvel">{value(dados, "areaTotal", "15,00")}</FacCell>
        <FacCell label="25 Área em outro estado">{value(dados, "areaOutroEstado", "NÃO")}</FacCell>
        <FacCell label="26 Área no estado">{value(dados, "areaEstado", value(dados, "areaTotal", "15,00"))}</FacCell>
        <FacCell label="27 Área cultivada">{value(dados, "areaCultivada", value(dados, "areaExplorada", "0,5 HA"))}</FacCell>
        <FacCell label="28 Área arrendada">{value(dados, "areaArrendada", "NÃO")}</FacCell>
        <FacCell label="30 Área explorada em parceria">{value(dados, "areaParceria", "Não")}</FacCell>
      </div>

      <div className="grid grid-cols-5 border-x border-b border-[#6B8370]">
        <FacCell label="31 Possui máquina de beneficiamento">{value(dados, "maquina", "Nao")}</FacCell>
        <FacCell label="32 Beneficia produtos de terceiros">{value(dados, "terceiros", "Nao")}</FacCell>
        <FacCell label="33 Possui talonários de notas fiscais">{value(dados, "talonario", "Nao")}</FacCell>
        <FacCell label="34 Distância do imóvel à sede do município">{value(dados, "distancia", "20 minutos")}</FacCell>
        <FacCell label="35 Possui parceria">{value(dados, "parceria", "Nao")}</FacCell>
      </div>

      <div className="grid grid-cols-[1fr_1fr_1fr] border-x border-b border-[#6B8370]">
        <FacCell label="36 Relação de outras propriedades no estado" className="min-h-16">{value(dados, "outrasPropriedades", "")}</FacCell>
        <FacCell label="37 Município" className="min-h-16">{value(dados, "municipioOutras", "")}</FacCell>
        <FacCell label="38 Área total" className="min-h-16">{value(dados, "areaOutras", "")}</FacCell>
      </div>

      <div className="grid grid-cols-[1.4fr_1fr] border-x border-b border-[#6B8370]">
        <FacCell label="39 Marcas utilizadas - tipo">{value(dados, "marcas", "")}</FacCell>
        <FacCell label="40 Local de colocação da marca">{value(dados, "localMarca", "")}</FacCell>
      </div>

      <div className="grid grid-cols-[1fr_1fr] border-x border-b border-[#6B8370]">
        <FacCell label="41 Principais produções do imóvel">{value(dados, "producoes", "Horticultura, exceto morango")}</FacCell>
        <FacCell label="42 Produtos fabricados ou beneficiados no imóvel">{value(dados, "beneficiados", "")}</FacCell>
        <FacCell label="06 Observações do produtor" className="col-span-2 min-h-14">
          {value(dados, "observacao", "Atividade Principal - Alface 0,2 ha")}
        </FacCell>
      </div>

      <div className="border-x border-b border-[#6B8370] px-2 py-1 text-[9px] font-semibold">
        Latitude: {value(dados, "latitude", "")} Longitude: {value(dados, "longitude", "")}
      </div>

      <div className="border-x border-b border-[#6B8370] py-1 text-center text-[7px] uppercase text-[#536A58]">
        Declaro serem verdadeiras as informações prestadas
      </div>

      <div className="grid grid-cols-[1.4fr_1.4fr_.8fr] border-x border-b border-[#6B8370]">
        <FacCell label="43 Local" className="text-center text-[12px]">{value(dados, "local", `${processo.unidadeLocal} - AM`)}</FacCell>
        <FacCell label="45 Assinatura do produtor representante" className="min-h-12">
          <span className="block h-8 border-b border-black" />
        </FacCell>
        <FacCell label="44 Data">{value(dados, "data", new Date().toLocaleDateString("pt-BR"))}</FacCell>
      </div>

      <div className="grid grid-cols-[1.15fr_.95fr] gap-x-16 border-x border-b border-[#6B8370] px-0 py-2">
        <BottomOfficialBlock number="08" title="Uso da repartição fazendária">
          <FacLineLabel label="Funcionário" className="min-h-10 border-t border-[#6B8370]" />
          <div className="grid grid-cols-2 border-t border-[#6B8370]">
            <FacLineLabel label="MASP" className="min-h-9 border-r border-[#6B8370]" />
            <FacLineLabel label="Data" className="min-h-9" />
          </div>
        </BottomOfficialBlock>
        <BottomOfficialBlock number="09" title="Recebimento do cartão de inscrição">
          <div className="grid grid-cols-[.75fr_1.25fr] border-t border-[#6B8370]">
            <FacLineLabel label="Data recebimento cartão de inscrição" className="min-h-8 border-r border-[#6B8370]" />
            <FacLineLabel label="Recebi o cartão de inscrição do produtor rural" className="min-h-8" />
            <FacLineLabel label="Assinatura" className="min-h-8 border-r border-t border-[#6B8370]" />
            <FacLineLabel label="Número cart. identidade" className="min-h-8 border-t border-[#6B8370]" />
          </div>
        </BottomOfficialBlock>
      </div>
    </div>
  );
}

function DeclaracaoPreview({ processo, dados }: { processo: DraftProcesso; dados: Record<string, string> }) {
  const unidadeLocal = processo.unidadeLocal || "Boca do Acre";
  const finalidade = value(dados, "finalidade", typeLabels[processo.tipoProcesso]);
  const numero = value(dados, "numero", "BOA 437/2026");
  const numeroControle = value(dados, "numeroControle", numero);
  const municipio = value(dados, "municipio", unidadeLocal);
  const propriedade = value(dados, "propriedade", "Sitio Terra Nova Casa");
  const localizacao = value(dados, "endereco", "Margem direita do Rio Purus Comunidade Lago Novo");
  const anoAtendimento = value(dados, "anoAtendimento", "2012");
  const atividadePrincipal = value(dados, "atividadePrincipal", "Horticultura em area de 0,2 ha");
  const cultivos = value(dados, "incluindo", "Cultivo de Alface e Cebola de palha");
  const tecnico = processo.tecnicoResponsavel || value(dados, "tecnicoResponsavel", "Tecnico Responsavel");
  const gerente = processo.gerenteResponsavel || value(dados, "gerenteResponsavel", `Gerente da Unidade Local de ${unidadeLocal}`);

  return (
    <div
      className="relative mx-auto min-h-[960px] max-w-3xl overflow-hidden bg-white px-20 pb-44 pt-36 font-serif text-[14px] leading-7 text-[#1F1F1F] shadow-sm"
      style={{ backgroundImage: "url('/images/PapelTimbrado.png')", backgroundSize: "100% 100%", backgroundRepeat: "no-repeat" }}
    >
      <h2 className="text-center text-xl font-bold">Declaração</h2>

      <div className="mt-9 grid grid-cols-[1fr_auto] items-start gap-6 font-semibold">
        <p>Nº. {numero}.</p>
        <p className="text-right">{unidadeLocal} - AM, {value(dados, "data", longDate())}.</p>
      </div>

      <section className="mt-12 space-y-4 text-justify indent-10">
        <p>
          Declaramos para os devidos fins de <strong>{finalidade}</strong> do Cartão do Produtor Primário que o Senhor:
          {" "}<strong>{processo.produtor || "Nome do produtor"}</strong>, portador do RG nº{" "}
          <strong>{value(dados, "rg", "194.514 SEP/AC")}</strong> e CPF nº{" "}
          <strong>{processo.cpf || "000.000.000-00"}</strong>, é possuidor de um imóvel rural denominado{" "}
          <strong>{propriedade}</strong>, localizado na <strong>{localizacao}</strong>, situado no Município de{" "}
          <strong>{municipio}</strong>, com o número de controle <strong>{numeroControle}</strong>.
        </p>

        <p>
          O produtor é atendido pela Unidade Local de {unidadeLocal} / IDAM - Instituto de Desenvolvimento
          Agropecuário e Florestal Sustentável do Estado do Amazonas, desde o ano de {anoAtendimento}, tendo como{" "}
          <strong>atividade principal: {atividadePrincipal}</strong>, incluindo: <strong>{cultivos}</strong>.
        </p>
      </section>

      <div className="mt-11 grid grid-cols-2 gap-10 text-center font-bold">
        <p>Latitude {value(dados, "latitude", "08°75'28,62\"")}</p>
        <p>Longitude {value(dados, "longitude", "67°37'10,93\"")}</p>
      </div>

      <div className="mt-20 grid grid-cols-2 gap-16 text-center text-[13px] leading-5">
        <div>
          <div className="mx-auto w-44 border-t border-black pt-2">Técnico Responsável</div>
          <p className="mt-1 text-[11px] text-gray-700">{tecnico}</p>
        </div>
        <ElectronicSignatureSeal processo={processo} fallbackGerente={gerente} />
      </div>
      <SignatureBlock processo={processo} />
      <DeclaracaoTimbradoFooter />
    </div>
  );
}

function FormularioPreview({ processo }: { processo: DraftProcesso }) {
  return (
    <div className="mx-auto min-h-[720px] w-full max-w-[680px] bg-white px-12 py-10 text-[14px] leading-7 text-black shadow-sm">
      <AmazonasHeader />
      <h2 className="text-center text-xl font-bold">Formulario cadastral</h2>
      <div className="mt-10 grid gap-3 rounded border border-gray-200 p-5">
        <p><strong>Produtor:</strong> {processo.produtor || "Nome do produtor"}</p>
        <p><strong>CPF:</strong> {processo.cpf || "000.000.000-00"}</p>
        <p><strong>Tipo do processo:</strong> {typeLabels[processo.tipoProcesso]}</p>
        <p><strong>Unidade Local:</strong> {processo.unidadeLocal || "Unidade Local"}</p>
        <p><strong>Tecnico responsavel:</strong> {processo.tecnicoResponsavel || "Tecnico responsavel"}</p>
        <p><strong>Gerente responsavel:</strong> {processo.gerenteResponsavel || "Aguardando assinatura"}</p>
      </div>
    </div>
  );
}

function MemorandoPreview({ processo }: { processo: DraftProcesso }) {
  const produtores = processo.memorandoProdutores?.length
    ? processo.memorandoProdutores
    : [{ id: "1", produtor: processo.produtor, cpf: processo.cpf, tipoProcesso: processo.tipoProcesso }];
  const criadoEm = processo.memorandoCriadoEm ? new Date(processo.memorandoCriadoEm) : new Date();
  const dataCriacao = Number.isNaN(criadoEm.getTime()) ? new Date() : criadoEm;
  const grupos = groupProdutoresByTipo(produtores);
  const unidadeLocal = processo.unidadeLocal || "Unidade Local";
  const gerente = processo.gerenteResponsavel || "Gerente da Unidade Local";

  return (
    <div
      className="relative mx-auto min-h-[960px] w-full max-w-[680px] overflow-hidden bg-white px-14 pb-44 pt-36 text-[13px] leading-6 text-black shadow-sm"
      style={{ backgroundImage: "url('/images/PapelTimbrado.png')", backgroundSize: "100% 100%", backgroundRepeat: "no-repeat" }}
    >
      <p className="font-bold uppercase">MEMO Nº {processo.memorandoNumero || "0001/26"} - UNLOC {unidadeLocal}</p>
      <p className="mt-4 text-right">{unidadeLocal}, {dataCriacao.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}.</p>
      <div className="mt-8 space-y-1 uppercase">
        <p><strong>DA:</strong> UNIDADE LOCAL DE {unidadeLocal}</p>
        <p><strong>PARA:</strong> CPCPR - GABIN</p>
      </div>
      <p className="mt-8">Prezado Senhor,</p>
      {grupos.map((grupo, groupIndex) => (
        <section key={grupo.tipo} className={groupIndex === 0 ? "mt-5" : "mt-8"}>
          <p>{grupo.texto}</p>
          <table className="mt-4 w-full border-collapse text-[12px]">
            <thead>
              <tr>
                <th className="border border-black px-2 py-1 text-center">Nº</th>
                <th className="border border-black px-2 py-1 text-left">NOME</th>
                <th className="border border-black px-2 py-1 text-left">CPF</th>
              </tr>
            </thead>
            <tbody>
              {grupo.produtores.map((produtor, index) => (
                <tr key={produtor.id || `${produtor.cpf}-${index}`}>
                  <td className="border border-black px-2 py-1 text-center">{index + 1}</td>
                  <td className="border border-black px-2 py-1 uppercase">{produtor.produtor || "Nome do produtor"}</td>
                  <td className="border border-black px-2 py-1">{produtor.cpf || "000.000.000-00"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
      <p className="mt-8">Cordialmente,</p>
      <ElectronicSignatureSeal processo={processo} fallbackGerente={gerente} className="mx-auto mt-16 w-80" />
      <SignatureBlock processo={processo} />
      <MemorandoTimbradoFooter />
    </div>
  );
}

function SignatureBlock({ processo, compact = false }: { processo: DraftProcesso; compact?: boolean }) {
  const assinatura = processo.assinaturaEletronica;
  if (!assinatura) return null;

  return (
    <div className={`${compact ? "mt-4 text-[9px]" : "mt-8 text-[11px]"} rounded border border-[#9AA89E] bg-[#F8FBF8] p-3 leading-5`}>
      <p className="font-bold uppercase tracking-wide text-[#245C3A]">Detalhes da assinatura</p>
      <p><strong>Data da assinatura:</strong> {formatSignatureDate(assinatura.assinadaEm)}</p>
      <p><strong>Código de validação:</strong> {assinatura.codigoValidacao}</p>
      <p><strong>Status:</strong> Documento aprovado e assinado eletronicamente.</p>
    </div>
  );
}

function ElectronicSignatureSeal({
  processo,
  fallbackGerente,
  className = "",
}: {
  processo: DraftProcesso;
  fallbackGerente: string;
  className?: string;
}) {
  const assinatura = processo.assinaturaEletronica;
  if (!assinatura) {
    return (
      <div className={`text-center leading-5 ${className}`}>
        <div className="mx-auto w-44 border-t border-black pt-2">{fallbackGerente}</div>
        <p className="mt-1 text-[11px] text-gray-700">Visto/Gerente da Unidade Local</p>
      </div>
    );
  }

  const nome = assinatura?.gerenteNome || fallbackGerente;
  const cargo = gerenteCargoLabel(assinatura);
  const dataAssinatura = formatSignatureDate(assinatura.assinadaEm);

  return (
    <div className={`text-center leading-5 ${className}`}>
      <div className="mx-auto mb-2 inline-flex rounded border border-[#6F8F77] bg-[#F2F8F3] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#245C3A]">
        Assinado eletronicamente
      </div>
      <p className="font-semibold">{nome}</p>
      <p className="text-[11px] text-gray-700">{cargo}</p>
      {dataAssinatura && <p className="mt-1 text-[10px] text-gray-600">{dataAssinatura}</p>}
      {assinatura && (
        <div className="mx-auto mt-2 w-fit rounded border border-[#9AA89E] bg-white px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#1F3F2C]">
          <span className="block text-[8px] uppercase text-[#5C6F62]">Código de validação</span>
          {assinatura.codigoValidacao}
        </div>
      )}
    </div>
  );
}

function DeclaracaoTimbradoFooter() {
  return (
    <footer className="absolute bottom-8 left-12 right-12 grid grid-cols-[1fr_1.25fr_1.55fr] items-center gap-5 text-[11px] leading-4 text-[#315B6D]">
      <div className="space-y-0.5">
        <p>www.idam.am.gov.br</p>
        <p>twitter.com/idam_govam</p>
        <p>youtube.com/idam_govam</p>
        <p>facebook.com/idam_govam</p>
        <p>Instagram.com/@idam_govam</p>
      </div>
      <div className="border-x border-[#98A6A1] px-5">
        <p>presidencia@idam.am.gov.br</p>
        <p>Fone: (92) 98452-9911</p>
        <p>Avenida Carlos Drummond de</p>
        <p>Andrade, 1460, Bloco G - 2º Andar</p>
        <p>Conj. Atílio Andreazza - Japiim</p>
        <p>Manaus - AM - CEP: 69077-730</p>
      </div>
      <div className="pl-2 text-[13px] font-bold leading-5">
        <p>Instituto de Desenvolvimento</p>
        <p>Agropecuário e Florestal</p>
        <p>Sustentável do Estado do</p>
        <p>Amazonas - IDAM</p>
      </div>
    </footer>
  );
}

function MemorandoTimbradoFooter() {
  return (
    <footer className="absolute bottom-8 left-12 right-12 grid grid-cols-[1fr_1.25fr_1fr] items-center gap-5 text-[11px] leading-4 text-[#7D8AA5]">
      <div className="space-y-0.5">
        <p>www.idam.am.gov.br</p>
        <p>twitter.com/idam_govam</p>
        <p>youtube.com/idam_govam</p>
        <p>facebook.com/idam_govam</p>
        <p>Instagram.com/@idam_govam</p>
      </div>
      <div className="border-x border-[#98A6A1] px-5">
        <p>presidencia@idam.am.gov.br</p>
        <p>Fone: (92) 98452-9911</p>
        <p>Avenida Carlos Drummond de</p>
        <p>Andrade, 1460, Bloco G - 2º Andar</p>
        <p>Conj. Atílio Andreazza - Japiim</p>
        <p>Manaus - AM - CEP: 69077-730</p>
      </div>
      <div className="flex justify-end">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/IDAM.png" alt="IDAM 30 anos" className="h-14 w-auto object-contain" />
      </div>
    </footer>
  );
}

function groupProdutoresByTipo(
  produtores: Array<{ id?: string; produtor: string; cpf: string; tipoProcesso: DraftProcesso["tipoProcesso"] }>,
) {
  const textos = {
    renovacao: "Ao cumprimentar Vossa Senhoria, estamos encaminhando em anexo as Carteiras de Produtor Rural para que sejam revalidadas, conforme relação abaixo:",
    inscricao: "Aproveitamos o ensejo para encaminhar em anexo o Primeiro Cadastro de Produtor Rural, para que seja expedida a 1ª via da Carteira do Produtor Rural abaixo relacionado:",
    alteracao: "Aproveitamos também para encaminhar em anexo as alterações do Cadastro dos Cartões do Produtor Primário, para que sejam corrigidas, conforme relação abaixo:",
  };

  return (["renovacao", "inscricao", "alteracao"] as const)
    .map((tipo) => ({
      tipo,
      texto: textos[tipo],
      produtores: produtores.filter((produtor) => produtor.tipoProcesso === tipo),
    }))
    .filter((grupo) => grupo.produtores.length > 0);
}
