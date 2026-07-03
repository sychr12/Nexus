"use client";

import { X } from "lucide-react";
import { GeneratedDocumentPreview } from "@/app/_features/fluxo/DocumentPreviews";
import { AttachmentPreview, DocumentPreviewViewer } from "@/app/_features/fluxo/SharedUi";
import type { DocumentoGeradoProcesso, DocumentoProcesso, ProcessoSicpr } from "@/app/_features/fluxo/types";
import { COLORS } from "./config";

export type LancamentoPreviewTarget =
  | { tipo: "gerado"; processo: ProcessoSicpr; documento: DocumentoGeradoProcesso }
  | { tipo: "anexo"; processo: ProcessoSicpr; documento: DocumentoProcesso };

export default function LancamentoPreviewModal({
  preview,
  onClose,
}: {
  preview: LancamentoPreviewTarget;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 py-5">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative flex h-[90vh] w-[90vw] max-w-7xl flex-col overflow-hidden rounded-lg border shadow-2xl" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderBottomColor: COLORS.border }}>
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>
              {preview.tipo === "gerado" ? "Documento gerado pelo sistema" : "Anexo enviado pela Unidade Local"}
            </p>
            <h2 className="mt-1 text-base font-semibold" style={{ color: COLORS.primary }}>
              {preview.tipo === "gerado" ? preview.documento.nome : preview.documento.arquivo}
            </h2>
            <p className="text-sm" style={{ color: COLORS.textLight }}>{preview.processo.produtor} | {preview.processo.unidadeLocal}</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-gray-100" style={{ color: COLORS.textLight }}>
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 p-5" style={{ backgroundColor: COLORS.background }}>
          <DocumentPreviewViewer title={preview.tipo === "gerado" ? "Documento gerado" : "Anexo do processo"}>
            {preview.tipo === "gerado" ? (
              <GeneratedDocumentPreview processo={preview.processo} documento={preview.documento} />
            ) : (
              <AttachmentPreview documento={preview.documento} />
            )}
          </DocumentPreviewViewer>
        </div>
      </div>
    </div>
  );
}
