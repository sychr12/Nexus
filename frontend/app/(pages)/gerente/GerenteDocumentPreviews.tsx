import { GeneratedDocumentPreview as DocumentTemplatePreview } from "@/app/_features/fluxo/DocumentPreviews";
import type { DocumentoGeradoProcesso, ProcessoSicpr } from "@/app/_features/fluxo/types";

export function GeneratedDocumentPreview({ processo, documento }: { processo: ProcessoSicpr; documento: DocumentoGeradoProcesso }) {
  return <DocumentTemplatePreview processo={processo} documento={documento} />;
}
