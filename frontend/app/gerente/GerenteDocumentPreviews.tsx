import { GeneratedDocumentPreview as DocumentTemplatePreview } from "../fluxo/DocumentPreviews";
import { TIPO_PROCESSO_LABELS } from "../fluxo/storage";
import type { DocumentoGeradoProcesso, ProcessoSicpr } from "../fluxo/types";

const formatSignatureDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.toLocaleDateString("pt-BR")} às ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
};

function gerenteCargoLabel(assinatura: NonNullable<ProcessoSicpr["assinaturaEletronica"]>) {
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

export function GeneratedDocumentPreview({ processo, documento }: { processo: ProcessoSicpr; documento: DocumentoGeradoProcesso }) {
  if (documento.tipo === "fac" || documento.tipo === "declaracao_produtor") {
    return <DocumentTemplatePreview processo={processo} documento={documento} />;
  }

  if (documento.tipo === "formulario") {
    return <FormularioPreview processo={processo} />;
  }

  if (documento.tipo === "memorando") {
    return <MemorandoPreview processo={processo} />;
  }

  return (
    <div className="mx-auto min-h-[720px] max-w-3xl bg-white px-12 py-10 text-[14px] leading-7 shadow-sm">
      <header className="mb-8 text-center">
        <p className="text-3xl font-bold text-emerald-700">AMAZONAS</p>
        <p className="text-xs font-semibold uppercase text-gray-500">Governo do Estado</p>
      </header>
      <h3 className="text-center text-xl font-bold">{documento.nome}</h3>
      <p className="mt-10 text-right">{processo.unidadeLocal} - AM, {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}.</p>
      <p className="mt-6">
        Declaramos para os devidos fins de <strong>{processo.tipoProcesso}</strong> da Carteira do Produtor Rural que
        <strong> {processo.produtor}</strong>, CPF <strong>{processo.cpf}</strong>, possui processo cadastral vinculado a
        Unidade Local de <strong>{processo.unidadeLocal}</strong>.
      </p>
      <p className="mt-4">
        Este documento foi gerado automaticamente pelo SICPR com base nos dados preenchidos pela Unloc, sem necessidade de preenchimento manual.
      </p>
      {documento.dados && Object.keys(documento.dados).length > 0 && (
        <div className="mt-8 rounded border border-gray-200 p-4">
          <p className="mb-2 font-bold">Dados informados no preenchimento</p>
          {Object.entries(documento.dados).map(([campo, valor]) => (
            <p key={campo}>
              <strong>{campo}:</strong> {valor || "-"}
            </p>
          ))}
        </div>
      )}
      <div className="mt-20 grid grid-cols-2 gap-12 text-center">
        <div>
          <div className="border-t border-gray-500 pt-2">Tecnico responsavel</div>
          <p className="text-xs text-gray-500">{processo.tecnicoResponsavel}</p>
        </div>
        <div>
          <div className="border-t border-gray-500 pt-2">Gerente da Unidade Local</div>
          <p className="text-xs text-gray-500">{processo.gerenteResponsavel || "Aguardando assinatura"}</p>
        </div>
      </div>
      <SignatureBlock processo={processo} />
    </div>
  );
}

function FormularioPreview({ processo }: { processo: ProcessoSicpr }) {
  return (
    <div className="mx-auto min-h-[720px] max-w-3xl bg-white px-12 py-10 text-[14px] leading-7 shadow-sm">
      <header className="mb-8 text-center">
        <p className="text-3xl font-bold text-emerald-700">AMAZONAS</p>
        <p className="text-xs font-semibold uppercase text-gray-500">Governo do Estado</p>
      </header>
      <h3 className="text-center text-xl font-bold">Formulario cadastral</h3>
      <div className="mt-10 grid gap-3 rounded border border-gray-200 p-5">
        <p><strong>Produtor:</strong> {processo.produtor}</p>
        <p><strong>CPF:</strong> {processo.cpf}</p>
        <p><strong>Tipo do processo:</strong> {TIPO_PROCESSO_LABELS[processo.tipoProcesso]}</p>
        <p><strong>Unidade Local:</strong> {processo.unidadeLocal}</p>
        <p><strong>Tecnico responsavel:</strong> {processo.tecnicoResponsavel}</p>
        <p><strong>Gerente responsavel:</strong> {processo.gerenteResponsavel || "Aguardando assinatura"}</p>
      </div>
      <SignatureBlock processo={processo} />
    </div>
  );
}

function MemorandoPreview({ processo }: { processo: ProcessoSicpr }) {
  const produtores = processo.memorandoProdutores?.length
    ? processo.memorandoProdutores
    : [{ id: processo.id, produtor: processo.produtor, cpf: processo.cpf, tipoProcesso: processo.tipoProcesso }];
  const criadoEm = processo.memorandoCriadoEm ? new Date(processo.memorandoCriadoEm) : new Date();
  const dataCriacao = Number.isNaN(criadoEm.getTime()) ? new Date() : criadoEm;
  const grupos = groupProdutoresByTipoMemorando(produtores);
  const unidadeLocal = processo.unidadeLocal || "Unidade Local";
  const gerente = processo.gerenteResponsavel || "Gerente da Unidade Local";

  return (
    <div
      className="relative mx-auto min-h-[960px] max-w-3xl overflow-hidden bg-white px-14 pb-44 pt-36 text-[13px] leading-6 text-black shadow-sm"
      style={{ backgroundImage: "url('/images/PapelTimbrado.png')", backgroundSize: "100% 100%", backgroundRepeat: "no-repeat" }}
    >
      <p className="font-bold uppercase">MEMO Nº {processo.memorandoNumero} - UNLOC {unidadeLocal}</p>
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
                  <td className="border border-black px-2 py-1 uppercase">{produtor.produtor}</td>
                  <td className="border border-black px-2 py-1">{produtor.cpf}</td>
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

function SignatureBlock({ processo }: { processo: ProcessoSicpr }) {
  const assinatura = processo.assinaturaEletronica;
  if (!assinatura) return null;

  return (
    <div className="mt-8 rounded border border-[#9AA89E] bg-[#F8FBF8] p-3 text-[11px] leading-5">
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
  processo: ProcessoSicpr;
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

function groupProdutoresByTipoMemorando(
  produtores: Array<{ id?: string; produtor: string; cpf: string; tipoProcesso: ProcessoSicpr["tipoProcesso"] }>,
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
