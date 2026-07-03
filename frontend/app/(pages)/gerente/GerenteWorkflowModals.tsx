import { AlertTriangle, FileSignature, RotateCcw, X } from "lucide-react";
import { AttachmentPreview, DetailInfoCard, DocumentPreviewViewer, SICPR_COLORS } from "@/app/_features/fluxo/SharedUi";
import { GERENTE_STATUS_LABELS } from "@/app/_features/fluxo/storage";
import type { DocumentoGeradoProcesso, DocumentoProcesso, GerenteUnidade, ProcessoSicpr } from "@/app/_features/fluxo/types";
import { GeneratedDocumentPreview } from "./GerenteDocumentPreviews";

const COLORS = SICPR_COLORS;

type SignatureSummary = {
  memorando: string;
  quantidadeProcessos: number;
  quantidadeProdutores: number;
  documentos: string[];
};

type PreviewState =
  | {
      tipo: "gerado";
      processo: ProcessoSicpr;
      documento: DocumentoGeradoProcesso;
    }
  | {
      tipo: "anexo";
      processo: ProcessoSicpr;
      documento: DocumentoProcesso;
    };

export function SignatureModal({
  gerente,
  unidade,
  summary,
  onClose,
  onConfirm,
}: {
  gerente: GerenteUnidade;
  unidade: string;
  summary: SignatureSummary;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-5">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-lg border shadow-2xl" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderBottomColor: COLORS.border }}>
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Confirmar assinatura eletronica</p>
            <h2 className="mt-1 text-base font-semibold" style={{ color: COLORS.primary }}>Assinar lote de documentos oficiais</h2>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-gray-100" style={{ color: COLORS.textLight }}>
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
          <DetailInfoCard label="Gerente" value={gerente.nome} />
          <DetailInfoCard label="Unidade Local" value={unidade} />
          <DetailInfoCard label="Memorando" value={summary.memorando} />
          <DetailInfoCard label="Status do responsavel" value={GERENTE_STATUS_LABELS[gerente.status]} />
          <DetailInfoCard label="Quantidade de processos" value={String(summary.quantidadeProcessos)} />
          <DetailInfoCard label="Quantidade de produtores" value={String(summary.quantidadeProdutores)} />
        </div>

        <div className="px-5 pb-4">
          <div className="rounded-md border p-4" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
            <p className="mb-2 text-sm font-semibold" style={{ color: COLORS.text }}>Documentos que serao assinados</p>
            <div className="flex flex-wrap gap-2">
              {summary.documentos.map((documento) => (
                <span key={documento} className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: COLORS.card, color: COLORS.primary, border: `1px solid ${COLORS.border}` }}>
                  {documento}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t px-5 py-4" style={{ borderTopColor: COLORS.border }}>
          <button type="button" onClick={onClose} className="rounded-md px-3 py-2 text-sm font-semibold transition-colors hover:bg-gray-100" style={{ border: `1px solid ${COLORS.border}`, color: COLORS.text }}>
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90" style={{ backgroundColor: COLORS.primary }}>
            <FileSignature size={15} />
            Assinar documentos
          </button>
        </div>
      </div>
    </div>
  );
}

export function BatchReturnModal({
  selectedCount,
  error,
  justificativa,
  onChange,
  onClose,
  onConfirm,
}: {
  selectedCount: number;
  error: string;
  justificativa: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-5">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-lg border shadow-2xl" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderBottomColor: COLORS.border }}>
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Devolucao em lote</p>
            <h2 className="mt-1 text-base font-semibold" style={{ color: COLORS.primary }}>Devolver processos selecionados</h2>
            <p className="text-sm" style={{ color: COLORS.textLight }}>{selectedCount} processo(s) selecionado(s)</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-gray-100" style={{ color: COLORS.textLight }}>
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          {error && (
            <div className="flex items-start gap-2 rounded-md border px-3 py-2 text-sm font-medium" style={{ backgroundColor: "#FEF3F2", borderColor: "#FCA5A5", color: COLORS.danger }}>
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <label className="block text-sm font-semibold" style={{ color: COLORS.text }}>
            Motivo da devolucao
            <textarea
              value={justificativa}
              onChange={(event) => onChange(event.target.value)}
              placeholder="Informe a justificativa obrigatoria para devolver os processos selecionados."
              rows={4}
              className="mt-2 w-full rounded-md border px-3 py-2 text-sm font-normal outline-none focus:ring-1 focus:ring-green-500"
              style={{ borderColor: COLORS.border }}
            />
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t px-5 py-4" style={{ borderTopColor: COLORS.border }}>
          <button type="button" onClick={onClose} className="rounded-md px-3 py-2 text-sm font-semibold transition-colors hover:bg-gray-100" style={{ border: `1px solid ${COLORS.border}`, color: COLORS.text }}>
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90" style={{ backgroundColor: COLORS.danger }}>
            <RotateCcw size={15} />
            Confirmar devolucao
          </button>
        </div>
      </div>
    </div>
  );
}

export function GerentePreviewModal({ preview, onClose }: { preview: PreviewState; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 py-5">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative flex h-[90vh] w-[90vw] max-w-7xl flex-col overflow-hidden rounded-lg border shadow-2xl" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderBottomColor: COLORS.border }}>
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>
              {preview.tipo === "gerado" ? "Modelo gerado automaticamente" : "Anexo enviado pela Unidade Local"}
            </p>
            <h2 className="mt-1 text-lg font-semibold" style={{ color: COLORS.primary }}>
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
