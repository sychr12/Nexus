"use client";

import type { FormEvent } from "react";
import { CheckCircle2, FileText, Paperclip, Plus, RotateCcw, Save, Trash2, UploadCloud } from "lucide-react";
import StyledSelect from "@/app/_components/StyledSelect";
import UnlocSelect from "@/app/_components/UnlocSelect";
import { SICPR_COLORS } from "@/app/_features/fluxo/SharedUi";
import { TIPO_PROCESSO_LABELS } from "@/app/_features/fluxo/storage";
import type { TipoProcessoSicpr } from "@/app/_features/fluxo/types";
import { DOCUMENT_MODELS } from "./config";
import type { AnexoUpload, GeneratedDocKey } from "./config";
import { formatCpf, formatFileSize } from "./file-utils";

const COLORS = SICPR_COLORS;

type ProcessoFormState = {
  produtor: string;
  cpf: string;
  tipoProcesso: TipoProcessoSicpr;
  unidadeLocal: string;
};

type Props = {
  editingProcessId: string | null;
  form: ProcessoFormState;
  documentosGerados: Partial<Record<GeneratedDocKey, Record<string, string>>>;
  facAssinada: AnexoUpload | null;
  outrosAnexos: AnexoUpload[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFormChange: (form: ProcessoFormState) => void;
  onOpenDocument: (documento: GeneratedDocKey) => void;
  onFacAssinadaChange: (files: FileList | null) => void;
  onFileChange: (files: FileList | null) => void;
  onRemoveFacAssinada: () => void;
  onRemoveAnexo: (index: number) => void;
  onCancelEditing: () => void;
};

export default function UnlocProcessForm({
  editingProcessId,
  form,
  documentosGerados,
  facAssinada,
  outrosAnexos,
  onSubmit,
  onFormChange,
  onOpenDocument,
  onFacAssinadaChange,
  onFileChange,
  onRemoveFacAssinada,
  onRemoveAnexo,
  onCancelEditing,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="rounded-lg border p-5 shadow-sm" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
      <div className="mb-4 flex items-center gap-2">
        {editingProcessId ? <RotateCcw size={18} style={{ color: COLORS.primary }} /> : <Plus size={18} style={{ color: COLORS.primary }} />}
        <div>
          <h2 className="font-semibold" style={{ color: COLORS.text }}>{editingProcessId ? "Corrigir processo" : "Novo processo"}</h2>
          {editingProcessId && <p className="text-xs" style={{ color: COLORS.textLight }}>Salve a correcao e depois use Reenviar ao gerente no card.</p>}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <input className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-green-500" placeholder="Nome do produtor" value={form.produtor} onChange={(e) => onFormChange({ ...form, produtor: e.target.value })} style={{ borderColor: COLORS.border }} />
        <input
          className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-green-500"
          placeholder="CPF"
          value={form.cpf}
          inputMode="numeric"
          maxLength={14}
          onChange={(e) => onFormChange({ ...form, cpf: formatCpf(e.target.value) })}
          style={{ borderColor: COLORS.border }}
        />
        <StyledSelect
          value={form.tipoProcesso}
          onChange={(value) => onFormChange({ ...form, tipoProcesso: value as TipoProcessoSicpr })}
          size="compact"
          options={Object.entries(TIPO_PROCESSO_LABELS).map(([value, label]) => ({ value, label }))}
          colors={COLORS}
        />
        <UnlocSelect
          value={form.unidadeLocal}
          valueMode="municipio"
          onChange={(value) => onFormChange({ ...form, unidadeLocal: value })}
          placeholder="Selecione a Unidade Local"
          searchPlaceholder="Buscar Unidade Local..."
          size="compact"
          colors={COLORS}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <div className="rounded-md border p-3" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
          <p className="mb-2 text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Documentos gerados pelo sistema</p>
          <div className="grid gap-2">
            {[...DOCUMENT_MODELS].sort((a) => (a.tipo === "fac" ? -1 : 1)).map((documento) => {
              const isFilled = Boolean(documentosGerados[documento.tipo]);
              return (
                <button
                  key={documento.tipo}
                  type="button"
                  onClick={() => onOpenDocument(documento.tipo)}
                  className="group flex items-start justify-between gap-3 rounded-md border bg-white px-3 py-2 text-left text-sm shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  style={{ borderColor: isFilled ? COLORS.accent : COLORS.border }}
                >
                  <span className="min-w-0">
                    <span className="block font-semibold" style={{ color: COLORS.text }}>{documento.nome}</span>
                    <span className="mt-0.5 block text-xs" style={{ color: COLORS.textLight }}>{documento.descricao}</span>
                  </span>
                  <span
                    className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold"
                    style={{
                      backgroundColor: isFilled ? `${COLORS.accent}18` : "#F3F4F6",
                      color: isFilled ? COLORS.primary : COLORS.textLight,
                    }}
                  >
                    {isFilled && <CheckCircle2 size={12} />}
                    {documento.tipo === "fac" ? (isFilled ? "Gerada" : "Nao gerada") : (isFilled ? "Preenchido" : "Preencher")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="mb-1 block text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Documentos obrigatorios assinados</span>
          <div className="mb-4 rounded-md border border-dashed p-3 transition-colors hover:bg-[#F5F7F5]" style={{ borderColor: facAssinada ? COLORS.accent : COLORS.border, color: COLORS.textLight }}>
            <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-md px-4 py-4 text-center">
              <UploadCloud size={26} style={{ color: COLORS.primary }} />
              <span className="mt-2 text-sm font-semibold" style={{ color: COLORS.text }}>Anexar FAC assinada pelo produtor</span>
              <span className="mt-1 text-xs">Envie a FAC impressa, assinada fisicamente e digitalizada.</span>
              <input
                type="file"
                className="hidden"
                accept="image/*,.pdf"
                onChange={(event) => {
                  onFacAssinadaChange(event.target.files);
                  event.currentTarget.value = "";
                }}
              />
            </label>

            <div className="mt-3 rounded-md border bg-white px-3 py-2 text-sm" style={{ borderColor: COLORS.border }}>
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0">
                  <span className="block font-semibold" style={{ color: COLORS.text }}>FAC assinada pelo produtor</span>
                  <span className="block text-xs" style={{ color: facAssinada ? COLORS.primary : COLORS.danger }}>
                    {facAssinada ? "Assinada e anexada" : "Assinatura pendente"}
                  </span>
                </span>
                {facAssinada && (
                  <button type="button" onClick={onRemoveFacAssinada} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-red-50" style={{ color: COLORS.danger }}>
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
              {facAssinada && <p className="mt-2 truncate text-xs" style={{ color: COLORS.textLight }}>{facAssinada.arquivo} · {formatFileSize(facAssinada.tamanho)}</p>}
            </div>
          </div>

          <span className="mb-1 block text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Documentos complementares</span>
          <div
            className="rounded-md border border-dashed p-3 transition-colors hover:bg-[#F5F7F5]"
            style={{ borderColor: COLORS.border, color: COLORS.textLight }}
          >
            <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-md px-4 py-4 text-center">
              <UploadCloud size={26} style={{ color: COLORS.primary }} />
              <span className="mt-2 text-sm font-semibold" style={{ color: COLORS.text }}>Selecionar arquivos</span>
              <span className="mt-1 text-xs">Fotos, PDF, comprovantes ou documentos complementares.</span>
              <input
                type="file"
                multiple
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                onChange={(event) => {
                  onFileChange(event.target.files);
                  event.currentTarget.value = "";
                }}
              />
            </label>

            {outrosAnexos.length > 0 && (
              <div className="mt-3 grid gap-2 border-t pt-3 sm:grid-cols-2" style={{ borderTopColor: COLORS.border }}>
                {outrosAnexos.map((anexo, index) => (
                  <div
                    key={`${anexo.arquivo}-${index}`}
                    className="group flex min-w-0 items-center justify-between gap-2 rounded-md border bg-white px-3 py-2 text-sm shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    style={{ borderColor: COLORS.border }}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: `${COLORS.accent}18`, color: COLORS.primary }}>
                        <Paperclip size={15} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold" style={{ color: COLORS.text }}>{anexo.arquivo}</span>
                        <span className="text-xs" style={{ color: COLORS.textLight }}>{formatFileSize(anexo.tamanho)}</span>
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveAnexo(index)}
                      title={`Remover ${anexo.arquivo}`}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md opacity-85 transition-colors hover:bg-red-50 group-hover:opacity-100"
                      style={{ color: COLORS.danger }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {editingProcessId && (
          <button
            type="button"
            onClick={onCancelEditing}
            className="rounded-md px-4 py-2 text-sm font-semibold transition-colors hover:bg-gray-100"
            style={{ color: COLORS.textLight }}
          >
            Cancelar correcao
          </button>
        )}
        <button className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90" style={{ backgroundColor: COLORS.primary }}>
          {editingProcessId ? <Save size={16} /> : <FileText size={16} />}
          {editingProcessId ? "Salvar correcao" : "Criar processo"}
        </button>
      </div>
    </form>
  );
}
