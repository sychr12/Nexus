"use client";

import { useState } from "react";
import { ExternalLink, Printer, Save, X } from "lucide-react";
import { GeneratedDocumentPreview } from "@/app/_features/fluxo/DocumentPreviews";
import { DocumentPreviewViewer, SICPR_COLORS } from "@/app/_features/fluxo/SharedUi";
import { formatDateInput, isValidDateInput } from "@/app/_lib/dateInput";
import type { DocumentoGeradoProcesso, ProcessoSicpr } from "@/app/_features/fluxo/types";
import type { CampoDocumento, GeneratedDocKey } from "./config";
import { buildGoogleEarthUrl, buildGoogleMapsEmbedUrl, formatCoordinateInput } from "./coordinate-utils";
import { DocumentOptionSelect, groupDocumentFields } from "./UnlocUi";

const COLORS = SICPR_COLORS;

function isDateField(key: string) {
  return key === "data" || key.toLowerCase().startsWith("data");
}

const FAC_FIELD_NUMBERS: Record<string, string> = {
  inscricaoEstadual: "01",
  naturezaPedido: "02",
  rg: "03",
  emissor: "04",
  rua: "06",
  numeroEndereco: "07",
  bairro: "08",
  municipio: "09",
  codigoMunicipalEndereco: "10",
  uf: "11",
  cep: "12",
  endereco: "13",
  cepPropriedade: "14",
  propriedade: "15",
  inscricaoImovel: "16",
  comunidade: "17",
  municipioPropriedade: "18",
  codigoMunicipal: "19",
  atividadeTipo: "20",
  posse: "21",
  situacao: "22",
  acesso: "23",
  areaTotal: "24",
  areaOutroEstado: "25",
  areaEstado: "26",
  areaExplorada: "27",
  areaCultivada: "27",
  areaPastagem: "28",
  areaArrendada: "29",
  areaParceria: "30",
  maquina: "31",
  terceiros: "32",
  talonario: "33",
  distancia: "34",
  parceria: "35",
  outrasPropriedades: "36",
  municipioOutras: "37",
  areaOutras: "38",
  marcas: "39",
  localMarca: "40",
  producoes: "41",
  beneficiados: "42",
  local: "43",
  data: "44",
  assinaturaProdutor: "45",
  documentoRepresentante: "46",
  funcionarioFazendario: "08",
  maspFazendario: "08",
  dataFazendaria: "08",
  dataRecebimentoCartao: "09",
  recebiCartao: "09",
  assinaturaRecebimento: "09",
  numeroCartaoIdentidade: "09",
};

const PROCESS_LOCKED_FIELDS: Record<GeneratedDocKey, Set<string>> = {
  fac: new Set(["naturezaPedido", "municipio", "municipioPropriedade", "local", "uf"]),
  declaracao_produtor: new Set(["finalidade", "local", "municipio"]),
};

type DocumentModel = {
  tipo: GeneratedDocKey;
  nome: string;
  descricao: string;
  campos: CampoDocumento[];
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

type Props = {
  activeDocument: GeneratedDocKey;
  activeModel: DocumentModel | null;
  documentDraft: Record<string, string>;
  message: string;
  previewDocumento: DocumentoGeradoProcesso | null;
  previewProcesso: DraftProcesso;
  onDraftChange: (nextDraft: Record<string, string>) => void;
  onClose: () => void;
  onPrint: () => void;
  onSave: () => void;
};

export default function UnlocDocumentModal({
  activeDocument,
  activeModel,
  documentDraft,
  message,
  previewDocumento,
  previewProcesso,
  onDraftChange,
  onClose,
  onPrint,
  onSave,
}: Props) {
  const [earthModalOpen, setEarthModalOpen] = useState(false);
  const visibleFieldGroups = groupDocumentFields((activeModel?.campos || []).filter((campo) => !campo.complementar));
  const complementaryFieldGroups = groupDocumentFields((activeModel?.campos || []).filter((campo) => campo.complementar));
  const supportsMapCheck = activeDocument === "fac" || activeDocument === "declaracao_produtor";
  const googleEarthUrl = supportsMapCheck
    ? buildGoogleEarthUrl(documentDraft.latitude || "", documentDraft.longitude || "")
    : null;
  const googleMapsEmbedUrl = supportsMapCheck
    ? buildGoogleMapsEmbedUrl(documentDraft.latitude || "", documentDraft.longitude || "")
    : null;

  function updateField(key: string, value: string) {
    if (PROCESS_LOCKED_FIELDS[activeDocument]?.has(key)) return;

    const nextValue = key === "latitude"
      ? formatCoordinateInput(value, "latitude")
      : key === "longitude"
        ? formatCoordinateInput(value, "longitude")
        : isDateField(key)
          ? formatDateInput(value)
          : value;

    onDraftChange({ ...documentDraft, [key]: nextValue });
  }

  function renderDocumentField(campo: CampoDocumento) {
    const fieldId = `document-field-${campo.key}`;
    const value = documentDraft[campo.key] || "";
    const fieldStyle = { borderColor: COLORS.border, color: COLORS.text };
    const showEarthButton = supportsMapCheck && campo.key === "longitude";
    const dateField = isDateField(campo.key);
    const dateError = dateField && value.length === 10 && !isValidDateInput(value);
    const facItemNumber = activeDocument === "fac" ? FAC_FIELD_NUMBERS[campo.key] : null;
    const isLockedFromProcess = PROCESS_LOCKED_FIELDS[activeDocument]?.has(campo.key) || false;
    const lockedStyle = isLockedFromProcess
      ? { ...fieldStyle, backgroundColor: COLORS.background, color: COLORS.textLight }
      : fieldStyle;

    return (
      <div key={campo.key} className="block">
        <label htmlFor={fieldId} className="mb-1 flex flex-wrap items-center gap-1.5 text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>
          {facItemNumber && (
            <span
              className="inline-flex h-5 items-center rounded border px-1.5 text-[10px] font-bold leading-none"
              style={{ borderColor: COLORS.border, color: COLORS.primary, backgroundColor: COLORS.background }}
            >
              Item {facItemNumber}
            </span>
          )}
          <span>{campo.label}{campo.obrigatorio ? " *" : ""}</span>
          {isLockedFromProcess && (
            <span
              className="inline-flex h-5 items-center rounded-full px-2 text-[10px] font-bold normal-case"
              style={{ backgroundColor: `${COLORS.accent}18`, color: COLORS.primary }}
            >
              Dados iniciais
            </span>
          )}
        </label>
        {campo.tipo === "select" ? (
          <DocumentOptionSelect
            value={value}
            onChange={(nextValue) => updateField(campo.key, nextValue)}
            options={campo.opcoes || []}
            placeholder="Selecione"
            disabled={isLockedFromProcess}
          />
        ) : campo.tipo === "textarea" ? (
          <textarea
            id={fieldId}
            value={value}
            onChange={(event) => updateField(campo.key, event.target.value)}
            placeholder={campo.placeholder}
            maxLength={campo.maxLength}
            rows={3}
            readOnly={isLockedFromProcess}
            className="w-full resize-y rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-4 focus:ring-[#6B9D4A]/10"
            style={lockedStyle}
          />
        ) : (
          <input
            id={fieldId}
            value={value}
            onChange={(event) => updateField(campo.key, event.target.value)}
            placeholder={dateField ? campo.placeholder || "dd/mm/aaaa" : campo.placeholder}
            maxLength={dateField ? 10 : campo.maxLength}
            inputMode={dateField ? "numeric" : undefined}
            aria-invalid={dateError || undefined}
            readOnly={isLockedFromProcess}
            className="w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-4 focus:ring-[#6B9D4A]/10"
            style={{ ...lockedStyle, borderColor: dateError ? COLORS.danger : lockedStyle.borderColor }}
          />
        )}
        {dateError && (
          <p className="mt-1 text-xs font-semibold" style={{ color: COLORS.danger }}>
            Use uma data válida no formato dia/mês/ano.
          </p>
        )}
        {showEarthButton && (
          <span className="mt-4 block">
            {googleEarthUrl ? (
              <button
                type="button"
                onClick={() => setEarthModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: COLORS.primary }}
              >
                <ExternalLink size={14} />
                Ver local no Google Earth
              </button>
            ) : (
              <span className="block rounded-md border px-3 py-2 text-xs font-semibold" style={{ borderColor: COLORS.border, color: COLORS.textLight }}>
                Informe latitude e longitude válidas para abrir no Google Earth.
              </span>
            )}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-5">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <section className="relative flex h-[90vh] w-[90vw] max-w-[1400px] flex-col overflow-hidden rounded-lg border shadow-2xl" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderBottomColor: COLORS.border }}>
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Geracao automatica</p>
            <h2 className="mt-1 text-lg font-semibold" style={{ color: COLORS.primary }}>
              {activeModel?.nome}
            </h2>
            <p className="text-sm" style={{ color: COLORS.textLight }}>
              Preencha os dados necessarios. O sistema usara essas informacoes para montar o documento.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-gray-100"
            style={{ color: COLORS.textLight }}
          >
            <X size={18} />
          </button>
        </div>

        {message && (
          <div className="border-b px-5 py-3" style={{ borderBottomColor: COLORS.border }}>
            <div className="rounded-md border px-3 py-2 text-sm font-semibold" style={{ borderColor: "#F59E0B", backgroundColor: "#FFFBEB", color: "#92400E" }}>
              {message}
            </div>
          </div>
        )}

        <div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-[390px_minmax(0,1fr)]">
          <div className="min-h-0 overflow-y-auto border-r px-5 py-4" style={{ borderRightColor: COLORS.border }}>
            <div className="grid gap-5">
              {visibleFieldGroups.map((group) => (
                <section key={group.secao} className="grid gap-3">
                  <h3 className="text-xs font-semibold uppercase" style={{ color: COLORS.primary }}>{group.secao}</h3>
                  <div className="grid gap-3">
                    {group.campos.map(renderDocumentField)}
                  </div>
                </section>
              ))}

              {complementaryFieldGroups.length > 0 && (
                <details className="rounded-md border bg-white" style={{ borderColor: COLORS.border }}>
                  <summary className="cursor-pointer px-3 py-2 text-sm font-semibold" style={{ color: COLORS.text }}>
                    Informacoes Complementares
                  </summary>
                  <div className="grid gap-5 border-t px-3 py-3" style={{ borderTopColor: COLORS.border }}>
                    {complementaryFieldGroups.map((group) => (
                      <section key={group.secao} className="grid gap-3">
                        <h3 className="text-xs font-semibold uppercase" style={{ color: COLORS.primary }}>{group.secao}</h3>
                        <div className="grid gap-3">
                          {group.campos.map(renderDocumentField)}
                        </div>
                      </section>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>

          <div className="sicpr-print-area min-h-0 p-5" style={{ backgroundColor: COLORS.background }}>
            {previewDocumento && (
              <DocumentPreviewViewer title="Prévia do documento">
                <GeneratedDocumentPreview
                  processo={previewProcesso}
                  documento={previewDocumento}
                  dados={documentDraft}
                />
              </DocumentPreviewViewer>
            )}
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t px-5 py-4" style={{ borderTopColor: COLORS.border }}>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-semibold transition-colors hover:bg-gray-100"
            style={{ border: `1px solid ${COLORS.border}`, color: COLORS.text }}
          >
            Cancelar
          </button>
          {activeDocument === "fac" && (
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors hover:bg-gray-100"
              style={{ border: `1px solid ${COLORS.border}`, color: COLORS.text }}
            >
              <Printer size={15} />
              Imprimir FAC
            </button>
          )}
          <button
            type="button"
            onClick={onSave}
            className="sicpr-action-button inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: COLORS.primary }}
          >
            <Save size={15} />
            Gerar documento
          </button>
        </div>
      </section>

      {earthModalOpen && googleMapsEmbedUrl && googleEarthUrl && (
        <section className="absolute inset-4 z-[90] flex flex-col overflow-hidden rounded-lg border bg-white shadow-2xl" style={{ borderColor: COLORS.border }}>
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderBottomColor: COLORS.border }}>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: COLORS.primary }}>Conferir localização</h3>
              <p className="text-xs" style={{ color: COLORS.textLight }}>
                Conferência visual da latitude e longitude informadas no documento.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={googleEarthUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors hover:bg-gray-100"
                style={{ border: `1px solid ${COLORS.border}`, color: COLORS.text }}
              >
                <ExternalLink size={14} />
                Abrir no Google Earth
              </a>
              <button
                type="button"
                onClick={() => setEarthModalOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-gray-100"
                style={{ color: COLORS.textLight }}
                aria-label="Fechar mapa"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 bg-black">
            <iframe
              title="Mapa de conferência da localização"
              src={googleMapsEmbedUrl}
              className="h-full w-full border-0"
              referrerPolicy="no-referrer-when-downgrade"
              allow="fullscreen; geolocation"
            />
          </div>
        </section>
      )}
    </div>
  );
}
