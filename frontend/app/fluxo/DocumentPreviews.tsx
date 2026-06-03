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

function FacCell({ label, children, className = "" }: { label: string; children?: ReactNode; className?: string }) {
  return (
    <div className={`min-h-9 border border-[#6B8370] px-1.5 py-1 ${className}`}>
      <p className="text-[7px] font-semibold uppercase leading-none text-[#536A58]">{label}</p>
      <div className="mt-1 min-h-4 text-[11px] font-semibold leading-tight text-black">{children || "\u00A0"}</div>
    </div>
  );
}

function CheckBox({ active, label }: { active?: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px]">
      <span className="inline-flex h-4 w-4 items-center justify-center border border-[#6B8370] text-[10px] font-bold">
        {active ? "X" : ""}
      </span>
      {label}
    </span>
  );
}

function FacPreview({ processo, dados }: { processo: DraftProcesso; dados: Record<string, string> }) {
  const pedido = processo.tipoProcesso;

  return (
    <div className="mx-auto aspect-[0.72] w-full max-w-[760px] bg-[#FBFCF8] p-4 text-black shadow-sm">
      <div className="grid grid-cols-[1.2fr_2.4fr_.6fr] border border-[#6B8370] text-[10px]">
        <div className="border-r border-[#6B8370] p-2 text-[8px] font-bold uppercase text-[#42664A]">
          Secretaria de Estado da Economia, Fazenda e Turismo
        </div>
        <div className="border-r border-[#6B8370] p-2 text-center text-base font-bold uppercase">
          Declaracao de Produtor Rural (Dados Cadastrais)
        </div>
        <div className="p-2 text-center text-[8px] uppercase">Microfilme</div>
      </div>

      <div className="mt-1 grid grid-cols-[1.1fr_2fr] gap-1">
        <div className="border border-[#6B8370] p-2">
          <p className="mb-2 text-[8px] font-bold uppercase text-[#536A58]">Natureza do pedido</p>
          <div className="grid grid-cols-2 gap-2">
            <CheckBox active={pedido === "inscricao"} label="Inscricao" />
            <CheckBox label="Baixa" />
            <CheckBox active={pedido === "alteracao"} label="Alteracao" />
            <CheckBox active={pedido === "renovacao"} label="2a via/Renovacao" />
          </div>
        </div>
        <div className="grid grid-cols-2">
          <FacCell label="Inscricao de produtor">{value(dados, "inscricaoEstadual", "Nao utilize em caso de inscricao")}</FacCell>
          <FacCell label="No do CPF">{processo.cpf}</FacCell>
          <FacCell label="No de documento de identidade">{value(dados, "rg", "194.514")}</FacCell>
          <FacCell label="Estado emissor">{value(dados, "emissor", "SEP/AC")}</FacCell>
        </div>
      </div>

      <div className="mt-1">
        <FacCell label="Identificacao/caracterizacao do produtor e do imovel" className="text-center">
          {processo.produtor || "Nome do produtor"}
        </FacCell>
      </div>

      <div className="grid grid-cols-4">
        <FacCell label="Rua/Av">{value(dados, "rua", "Zona Rural")}</FacCell>
        <FacCell label="Bairro">{value(dados, "bairro", "Zona Rural")}</FacCell>
        <FacCell label="Municipio">{value(dados, "municipio", processo.unidadeLocal)}</FacCell>
        <FacCell label="UF">{value(dados, "uf", "AM")}</FacCell>
        <FacCell label="Endereco da propriedade" className="col-span-2">{value(dados, "endereco", "Margem direita do Rio Purus")}</FacCell>
        <FacCell label="Nome da propriedade">{value(dados, "propriedade", "Sitio Terra Nova")}</FacCell>
        <FacCell label="Comunidade">{value(dados, "comunidade", "Lago Novo")}</FacCell>
      </div>

      <div className="mt-1 grid grid-cols-5">
        <FacCell label="Atividade">{value(dados, "atividade", "Horticultura")}</FacCell>
        <FacCell label="Tipo de posse">{value(dados, "posse", "Proprietario")}</FacCell>
        <FacCell label="Situacao do imovel">{value(dados, "situacao", "Zona rural")}</FacCell>
        <FacCell label="Area total do imovel">{value(dados, "areaTotal", "15,00")}</FacCell>
        <FacCell label="Area explorada">{value(dados, "areaExplorada", "0,5 HA")}</FacCell>
      </div>

      <div className="mt-1 grid grid-cols-4">
        <FacCell label="Possui maquina de beneficiamento">{value(dados, "maquina", "Nao")}</FacCell>
        <FacCell label="Beneficia produtos de terceiros">{value(dados, "terceiros", "Nao")}</FacCell>
        <FacCell label="Possui talonarios de notas fiscais">{value(dados, "talonario", "Nao")}</FacCell>
        <FacCell label="Distancia do imovel a sede do municipio">{value(dados, "distancia", "20 minutos")}</FacCell>
      </div>

      <div className="mt-1 grid grid-cols-2">
        <FacCell label="Principais producoes do imovel">{value(dados, "producoes", "Horticultura, exceto morango")}</FacCell>
        <FacCell label="Produtos fabricados ou beneficiados no imovel">{value(dados, "beneficiados", "")}</FacCell>
        <FacCell label="Observacoes do produtor" className="col-span-2">
          {value(dados, "observacao", "Atividade Principal - Alface 0,2 ha")}
        </FacCell>
      </div>

      <div className="mt-8 grid grid-cols-[1fr_1fr_1fr] items-end gap-2 text-[11px]">
        <FacCell label="Local">{value(dados, "local", `${processo.unidadeLocal} - AM`)}</FacCell>
        <FacCell label="Data">{value(dados, "data", new Date().toLocaleDateString("pt-BR"))}</FacCell>
        <div className="border-t border-black pt-1 text-center">Assinatura do produtor</div>
      </div>
    </div>
  );
}

function DeclaracaoPreview({ processo, dados }: { processo: DraftProcesso; dados: Record<string, string> }) {
  return (
    <div className="relative mx-auto min-h-[930px] w-full max-w-[680px] overflow-hidden bg-white px-16 py-10 text-[15px] leading-8 text-black shadow-sm">
      <div className="absolute left-0 top-0 h-16 w-16 border-l-2 border-t-2 border-[#315B6D]/40" />
      <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-[70px] border-b-2 border-l-2 border-[#D9B64C]/40" />
      <AmazonasHeader />
      <h2 className="text-center text-xl font-bold">Declaracao</h2>

      <p className="mt-12 text-right">
        {processo.unidadeLocal || "Unidade Local"} - AM, {value(dados, "data", new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }))}.
      </p>
      <p className="mt-4 font-bold">No. {value(dados, "numero", "BOA 437/2026")}.</p>

      <p className="mt-12 text-justify">
        Declaramos para os devidos fins de <strong>{typeLabels[processo.tipoProcesso]}</strong> da Carteira do Produtor Primario,
        que o Senhor: <strong>{processo.produtor || "Nome do produtor"}</strong>, Portador do RG No <strong>{value(dados, "rg", "194.514 SEP/AC")}</strong>
        e CPF No <strong>{processo.cpf || "000.000.000-00"}</strong>, e possuidor de um imovel rural denominado de
        <strong> {value(dados, "propriedade", "Sitio Terra Nova")}</strong>, localizado na
        <strong> {value(dados, "endereco", "Margem direita do Rio Purus Comunidade Lago Novo")}</strong>, situado no Municipio de
        <strong> {processo.unidadeLocal || "Boca do Acre"}</strong>, com o numero de controle <strong>{value(dados, "numeroControle", "BOA 437/2026")}</strong>.
      </p>

      <p className="mt-4 text-justify">
        O Produtor e atendido pela Unidade local de {processo.unidadeLocal || "Boca do Acre"} / IDAM - Instituto de Desenvolvimento
        Agropecuario e Florestal Sustentavel do Estado do Amazonas, desde o ano de {value(dados, "anoAtendimento", "2012")},
        tendo como <strong>Atividade principal: {value(dados, "atividadePrincipal", "Horticultura em area de 0,2 ha")}</strong>,
        incluindo: <strong>{value(dados, "incluindo", "Cultivo de Alface e Cebola de palha")}.</strong>
      </p>

      <div className="mt-12 grid grid-cols-2 gap-8 text-center font-bold">
        <p>Latitude {value(dados, "latitude", "08°75'28,62\"")}</p>
        <p>Longitude {value(dados, "longitude", "67°37'10,93\"")}</p>
      </div>

      <div className="mt-28 grid grid-cols-2 gap-16 text-center">
        <div>
          <div className="border-t border-black pt-2">Tecnico Responsavel</div>
          <p className="text-xs">{processo.tecnicoResponsavel || "Tecnico responsavel"}</p>
        </div>
        <div>
          <div className="border-t border-black pt-2">{processo.gerenteResponsavel || "Gerente da Unloc"}</div>
          <p className="text-xs">Visto/Gerente da Unloc</p>
        </div>
      </div>

      <footer className="absolute bottom-0 left-0 right-0 grid grid-cols-[1fr_1.2fr_1.4fr] gap-4 border-t border-gray-200 px-8 py-5 text-[10px] leading-4 text-[#315B6D]">
        <div>www.idam.am.gov.br<br />facebook.com/idam_govam<br />instagram.com/idam_govam</div>
        <div>presidencia@idam.am.gov.br<br />Av. Carlos Drummond de Andrade<br />Manaus - AM</div>
        <div className="font-bold text-[#315B6D]">Instituto de Desenvolvimento Agropecuario e Florestal Sustentavel do Estado do Amazonas - IDAM</div>
      </footer>
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
      style={{ backgroundImage: "url('/idam-papel-timbrado-30anos.png')", backgroundSize: "100% 100%", backgroundRepeat: "no-repeat" }}
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
      <div className="mx-auto mt-20 w-80 border-t border-black pt-2 text-center">
        <p className="font-semibold uppercase">{gerente}</p>
        <p>Gerente da Unloc {unidadeLocal}</p>
      </div>
      <MemorandoTimbradoFooter />
    </div>
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
        <img src="/idam-30anos-logo.png" alt="IDAM 30 anos" className="h-14 w-auto object-contain" />
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
