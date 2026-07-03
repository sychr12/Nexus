"use client";

import type { ProcessoSicpr, TipoProcessoSicpr } from "./types";

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

const value = (dados: Record<string, string> | undefined, key: string, fallback = "") => dados?.[key] || fallback;
const longDate = (date = new Date()) =>
  date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
const formatSignatureDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.toLocaleDateString("pt-BR")} as ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
};

function gerenteCargoLabel(assinatura: NonNullable<DraftProcesso["assinaturaEletronica"]>) {
  if (assinatura.gerenteStatus === "respondendo") {
    return `Responsavel pela Unidade Local de ${assinatura.unidadeLocal}`;
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

export function DeclaracaoPreview({ processo, dados }: { processo: DraftProcesso; dados: Record<string, string> }) {
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

export function FormularioPreview({ processo }: { processo: DraftProcesso }) {
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

export function MemorandoPreview({ processo }: { processo: DraftProcesso }) {
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
      <p className="font-bold uppercase">MEMO Nº {processo.memorandoNumero || "0001/26"} - Unidade Local {unidadeLocal}</p>
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
