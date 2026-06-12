"use client";

import { Printer, Save, X } from "lucide-react";
import { GeneratedDocumentPreview } from "@/app/_features/fluxo/DocumentPreviews";
import { SICPR_COLORS } from "@/app/_features/fluxo/SharedUi";
import type { DocumentoGeradoProcesso, ProcessoSicpr, TipoProcessoSicpr } from "@/app/_features/fluxo/types";
import type { CampoDocumento, GeneratedDocKey } from "./config";
import { DocumentOptionSelect, groupDocumentFields } from "./UnlocUi";

const COLORS = SICPR_COLORS;

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
  const visibleFieldGroups = groupDocumentFields((activeModel?.campos || []).filter((campo) => !campo.complementar));
  const complementaryFieldGroups = groupDocumentFields((activeModel?.campos || []).filter((campo) => campo.complementar));

  function updateField(key: string, value: string) {
    onDraftChange({ ...documentDraft, [key]: value });
  }

  function renderDocumentField(campo: CampoDocumento) {
    const fieldId = `document-field-${campo.key}`;
    const value = documentDraft[campo.key] || "";
    const fieldStyle = { borderColor: COLORS.border, color: COLORS.text };

    return (
      <label key={campo.key} htmlFor={fieldId} className="block">
        <span className="mb-1 block text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>
          {campo.label}{campo.obrigatorio ? " *" : ""}
        </span>
        {campo.tipo === "select" ? (
          <DocumentOptionSelect
            value={value}
            onChange={(nextValue) => updateField(campo.key, nextValue)}
            options={campo.opcoes || []}
            placeholder="Selecione"
          />
        ) : campo.tipo === "textarea" ? (
          <textarea
            id={fieldId}
            value={value}
            onChange={(event) => updateField(campo.key, event.target.value)}
            placeholder={campo.placeholder}
            maxLength={campo.maxLength}
            rows={3}
            className="w-full resize-y rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-4 focus:ring-[#6B9D4A]/10"
            style={fieldStyle}
          />
        ) : (
          <input
            id={fieldId}
            value={value}
            onChange={(event) => updateField(campo.key, event.target.value)}
            placeholder={campo.placeholder}
            maxLength={campo.maxLength}
            className="w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-4 focus:ring-[#6B9D4A]/10"
            style={fieldStyle}
          />
        )}
      </label>
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

          <div className="sicpr-print-area min-h-0 overflow-auto p-5" style={{ backgroundColor: COLORS.background }}>
            {previewDocumento && (
              <GeneratedDocumentPreview
                processo={previewProcesso}
                documento={previewDocumento}
                dados={documentDraft}
              />
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
    </div>
  );
}
