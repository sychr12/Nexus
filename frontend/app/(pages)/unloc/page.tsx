"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Eye, FileText, Paperclip, Plus, RotateCcw, Save, Search, Send, Trash2, UploadCloud, X } from "lucide-react";
import UnlocSelect from "@/app/_components/UnlocSelect";
import { GeneratedDocumentPreview } from "@/app/_features/fluxo/DocumentPreviews";
import { AttachmentPreview, FilterStatCard as StatCard, SICPR_COLORS } from "@/app/_features/fluxo/SharedUi";
import Sidebar from "@/app/_components/layout/Sidebar";
import {
  SITUACAO_LABELS,
  STATUS_COLORS,
  TIPO_PROCESSO_LABELS,
  addProcesso,
  atualizarProcessoUnloc,
  encaminharGerente,
  formatDateTime,
  getFacAssinada,
  getDocumentosGerados,
  getOutrosDocumentos,
  loadProcessos,
  podeEncaminharGerente,
  saveProcessos,
} from "@/app/_features/fluxo/storage";
import type { DocumentoGeradoProcesso, DocumentoProcesso, ProcessoSicpr, TipoProcessoSicpr } from "@/app/_features/fluxo/types";
import { useAuthSession } from "@/app/_hooks/useAuthSession";
import { DOCUMENT_MODELS, DETAIL_TABS, PAGE_SIZE, PROCESS_FILTERS, initialForm } from "./config";
import type { AnexoUpload, DetailTab, GeneratedDocKey, ProcessoFilter } from "./config";
import { normalizeCoordinate, validateLatitude, validateLongitude } from "./coordinate-utils";
import { fileToAnexo, formatCpf, formatFileSize, onlyDigits } from "./file-utils";
import { FacStatusBadge } from "./UnlocUi";
import UnlocDocumentModal from "./UnlocDocumentModal";
import UnlocProcessDetailsModal from "./UnlocProcessDetailsModal";

const COLORS = SICPR_COLORS;

export default function UnlocPage() {
  const { username, logout, ready } = useAuthSession({ defaultUsername: "Tecnico da Unidade Local" });
  const [processos, setProcessos] = useState<ProcessoSicpr[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingProcessId, setEditingProcessId] = useState<string | null>(null);
  const [documentosGerados, setDocumentosGerados] = useState<Partial<Record<GeneratedDocKey, Record<string, string>>>>({});
  const [activeDocument, setActiveDocument] = useState<GeneratedDocKey | null>(null);
  const [documentDraft, setDocumentDraft] = useState<Record<string, string>>({});
  const [documentModalMessage, setDocumentModalMessage] = useState("");
  const [facAssinada, setFacAssinada] = useState<AnexoUpload | null>(null);
  const [outrosAnexos, setOutrosAnexos] = useState<AnexoUpload[]>([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [processSearch, setProcessSearch] = useState("");
  const [processFilter, setProcessFilter] = useState<ProcessoFilter>("em_elaboracao");
  const [page, setPage] = useState(1);
  const [selectedProcesso, setSelectedProcesso] = useState<ProcessoSicpr | null>(null);
  const [selectedProcessoMessage, setSelectedProcessoMessage] = useState("");
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>("dados");
  const [preview, setPreview] = useState<
    | { tipo: "gerado"; processo: ProcessoSicpr; documento: DocumentoGeradoProcesso }
    | { tipo: "anexo"; processo: ProcessoSicpr; documento: DocumentoProcesso }
    | null
  >(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!ready || !mounted) return;
    const timer = window.setTimeout(() => {
      setProcessos(loadProcessos());
    }, 0);
    return () => window.clearTimeout(timer);
  }, [ready, mounted]);

  const meusProcessos = useMemo(
    () =>
      processos.filter((processo) =>
        processo.tecnicoResponsavel === username ||
        ["em_elaboracao", "devolvido_gerente", "devolvido_analise"].includes(processo.situacao),
      ),
    [processos, username],
  );

  const stats = useMemo(() => ({
    emElaboracao: meusProcessos.filter((processo) => processo.situacao === "em_elaboracao").length,
    aguardandoGerente: meusProcessos.filter((processo) => processo.situacao === "encaminhado_gerente").length,
    emAnalise: meusProcessos.filter((processo) => processo.situacao === "em_analise").length,
    devolvidos: meusProcessos.filter((processo) => processo.situacao === "devolvido_gerente" || processo.situacao === "devolvido_analise").length,
    concluidos: meusProcessos.filter((processo) => processo.situacao === "concluido").length,
  }), [meusProcessos]);

  const filteredProcessos = useMemo(() => {
    const term = processSearch.trim().toLowerCase();
    return meusProcessos
      .filter((processo) => {
        if (processFilter === "todos") return true;
        if (processFilter === "devolvidos") return processo.situacao === "devolvido_gerente" || processo.situacao === "devolvido_analise";
        if (processFilter === "concluidos") return processo.situacao === "concluido";
        return processo.situacao === processFilter;
      })
      .filter((processo) =>
        !term ||
        processo.produtor.toLowerCase().includes(term) ||
        processo.cpf.includes(term) ||
        processo.unidadeLocal.toLowerCase().includes(term) ||
        (processo.memorandoNumero || "").toLowerCase().includes(term),
      );
  }, [meusProcessos, processFilter, processSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredProcessos.length / PAGE_SIZE));
  const pagedProcessos = filteredProcessos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function persist(next: ProcessoSicpr[]) {
    setProcessos(next);
    saveProcessos(next);
  }

  function applyProcessFilter(filter: ProcessoFilter) {
    setProcessFilter(filter);
    setPage(1);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cpfDigits = onlyDigits(form.cpf);
    if (!form.produtor.trim() || !form.cpf.trim() || !form.unidadeLocal.trim()) {
      setMessageType("error");
      setMessage("Preencha produtor, CPF e Unidade Local.");
      return;
    }
    if (cpfDigits.length !== 11) {
      setMessageType("error");
      setMessage("Informe um CPF valido com 11 digitos.");
      return;
    }
    if (!facAssinada) {
      setMessageType("error");
      setMessage("Anexe a FAC assinada pelo produtor antes de criar ou salvar o processo.");
      return;
    }

    if (editingProcessId) {
      persist(atualizarProcessoUnloc(processos, editingProcessId, username, { ...form, cpf: formatCpf(form.cpf), documentosGerados, outrosDocumentos: getDocumentosParaSalvar() }));
      setEditingProcessId(null);
      setForm(initialForm);
      setDocumentosGerados({});
      setFacAssinada(null);
      setOutrosAnexos([]);
      setMessageType("success");
      setMessage("Correcao salva. Revise o card do processo e reenvie ao gerente quando estiver pronto.");
      return;
    }

    persist(addProcesso(processos, { ...form, cpf: formatCpf(form.cpf), tecnicoResponsavel: username, documentosGerados, outrosDocumentos: getDocumentosParaSalvar() }));
    setForm(initialForm);
    setDocumentosGerados({});
    setFacAssinada(null);
    setOutrosAnexos([]);
    setMessageType("success");
    setMessage("Processo criado em elaboracao.");
  }

  async function handleFileChange(files: FileList | null) {
    if (!files?.length) return;

    const anexos = await Promise.all(Array.from(files).map(fileToAnexo));
    setOutrosAnexos((current) => [...current, ...anexos]);
    setMessageType("success");
    setMessage(`${anexos.length} anexo(s) adicionado(s).`);
  }

  async function handleFacAssinadaChange(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    const anexo = await fileToAnexo(file);
    setFacAssinada({
      ...anexo,
      nome: "FAC assinada pelo produtor",
      categoria: "fac_assinada",
    });
    setMessageType("success");
    setMessage("FAC assinada pelo produtor anexada ao processo.");
  }

  function removeAnexo(index: number) {
    setOutrosAnexos((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function removeFacAssinada() {
    setFacAssinada(null);
  }

  function getDocumentosParaSalvar() {
    return [
      ...(facAssinada ? [facAssinada] : []),
      ...outrosAnexos,
    ];
  }

  function startEditing(processo: ProcessoSicpr) {
    setEditingProcessId(processo.id);
    setForm({
      produtor: processo.produtor,
      cpf: formatCpf(processo.cpf),
      tipoProcesso: processo.tipoProcesso,
      unidadeLocal: processo.unidadeLocal,
    });
    setDocumentosGerados({
      fac: processo.documentosGerados?.fac,
      declaracao_produtor: processo.documentosGerados?.declaracao_produtor,
    });
    const facDocumento = getFacAssinada(processo);
    setFacAssinada(facDocumento ? {
      id: facDocumento.id,
      nome: facDocumento.nome,
      arquivo: facDocumento.arquivo,
      conteudo: facDocumento.conteudo,
      mimeType: facDocumento.mimeType,
      tamanho: facDocumento.tamanho,
      categoria: "fac_assinada",
    } : null);
    setOutrosAnexos(getOutrosDocumentos(processo).map((documento) => ({
      id: documento.id,
      nome: documento.nome,
      arquivo: documento.arquivo,
      conteudo: documento.conteudo,
      mimeType: documento.mimeType,
      tamanho: documento.tamanho,
      categoria: documento.categoria,
    })));
    setMessageType("success");
    setMessage("Processo carregado para correcao. Ajuste os dados e salve antes de reenviar.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditing() {
    setEditingProcessId(null);
    setForm(initialForm);
    setDocumentosGerados({});
    setFacAssinada(null);
    setOutrosAnexos([]);
    setMessage("");
  }

  function openDocumentModal(tipo: GeneratedDocKey) {
    setActiveDocument(tipo);
    setDocumentDraft(documentosGerados[tipo] || {});
    setDocumentModalMessage("");
  }

  function closeDocumentModal() {
    setActiveDocument(null);
    setDocumentModalMessage("");
  }

  function saveGeneratedDocument() {
    if (!activeDocument) return;
    const model = DOCUMENT_MODELS.find((documento) => documento.tipo === activeDocument);
    const normalizedDraft = normalizeDocumentDraft(activeDocument, documentDraft);
    const missingRequired = model?.campos.find((campo) => campo.obrigatorio && !normalizedDraft[campo.key]?.trim());

    if (missingRequired) {
      setDocumentModalMessage(`Preencha o campo obrigatório: ${missingRequired.label}.`);
      return;
    }

    const validationError = validateDocumentDraft(activeDocument, normalizedDraft);
    if (validationError) {
      setDocumentModalMessage(validationError);
      return;
    }

    setDocumentosGerados((current) => ({
      ...current,
      [activeDocument]: normalizedDraft,
    }));
    setDocumentDraft(normalizedDraft);
    setActiveDocument(null);
    setDocumentDraft({});
    setDocumentModalMessage("");
    setMessageType("success");
    setMessage(activeDocument === "fac" ? "FAC gerada. Imprima, colete a assinatura fisica do produtor e anexe a versão assinada." : "Documento preenchido e pronto para geracao automatica.");
  }

  function normalizeDocumentDraft(document: GeneratedDocKey, draft: Record<string, string>) {
    if (document !== "fac" && document !== "declaracao_produtor") {
      return draft;
    }

    return {
      ...draft,
      latitude: normalizeCoordinate(draft.latitude || ""),
      longitude: normalizeCoordinate(draft.longitude || ""),
    };
  }

  function validateDocumentDraft(document: GeneratedDocKey, draft: Record<string, string>) {
    if (document !== "fac") {
      const latitude = draft.latitude?.trim();
      const longitude = draft.longitude?.trim();

      if (latitude) {
        const latitudeError = validateLatitude(latitude);
        if (latitudeError) return latitudeError;
      }

      if (longitude) {
        const longitudeError = validateLongitude(longitude);
        if (longitudeError) return longitudeError;
      }

      return "";
    }

    const latitudeError = validateLatitude(draft.latitude || "");
    if (latitudeError) return latitudeError;

    return validateLongitude(draft.longitude || "");
  }

  function printActiveDocument() {
    if (!activeDocument) return;
    const source = document.querySelector(".sicpr-print-area .sicpr-print-document");
    if (!source) return;

    const styles = Array.from(document.querySelectorAll<HTMLLinkElement | HTMLStyleElement>("link[rel='stylesheet'], style"))
      .map((node) => node.outerHTML)
      .join("\n");

    const printFrame = document.createElement("iframe");
    printFrame.title = "FAC - Impressão";
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "0";
    document.body.appendChild(printFrame);

    const printDocument = printFrame.contentDocument || printFrame.contentWindow?.document;
    if (!printDocument) {
      printFrame.remove();
      window.print();
      return;
    }

    printDocument.open();
    printDocument.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>FAC - Impressão</title>
          ${styles}
          <style>
            @page {
              size: A4 portrait;
              margin: 5mm;
            }

            html,
            body {
              width: 210mm;
              height: 297mm;
              margin: 0;
              padding: 0;
              background: #ffffff;
            }

            body {
              display: flex;
              justify-content: center;
              align-items: flex-start;
              box-sizing: border-box;
              overflow: hidden;
            }

            .sicpr-print-document {
              box-sizing: border-box !important;
              width: 188mm !important;
              max-width: 188mm !important;
              margin: 0 auto !important;
              background: #ffffff !important;
              box-shadow: none !important;
            }

            .sicpr-fac-document {
              min-height: 0 !important;
              padding: 2mm !important;
              transform-origin: top center;
              zoom: 0.9;
              break-after: avoid;
              break-before: avoid;
              break-inside: avoid;
              page-break-after: avoid;
              page-break-before: avoid;
              page-break-inside: avoid;
            }

            * {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          </style>
        </head>
        <body>
          ${source.outerHTML}
          <script>
            window.addEventListener("load", function () {
              setTimeout(function () {
                window.focus();
                window.print();
              }, 120);
            });
          </script>
        </body>
      </html>
    `);
    printDocument.close();

    const removeFrame = () => {
      setTimeout(() => printFrame.remove(), 300);
    };
    printFrame.contentWindow?.addEventListener("afterprint", removeFrame, { once: true });
  }

  function handleEncaminhar(id: string) {
    const processo = processos.find((item) => item.id === id);
    const facAssinadaAnexada = processo ? Boolean(getFacAssinada(processo)) : false;

    if (!processo || !facAssinadaAnexada || !podeEncaminharGerente(processo)) {
      const warning = "A FAC assinada pelo produtor ainda não foi anexada ao processo.";
      if (selectedProcesso?.id === id) {
        setSelectedProcessoMessage(warning);
      } else {
        setMessageType("error");
        setMessage(warning);
      }
      return false;
    }

    const next = encaminharGerente(processos, id, username);
    const updated = next.find((item) => item.id === id);

    if (updated?.situacao !== "encaminhado_gerente") {
      persist(next);
      const warning = "A FAC assinada pelo produtor ainda não foi anexada ao processo.";
      if (selectedProcesso?.id === id) {
        setSelectedProcessoMessage(warning);
      } else {
        setMessageType("error");
        setMessage(warning);
      }
      return false;
    }

    persist(next);
    setMessageType("success");
    setMessage("Processo encaminhado ao gerente com tecnico, unidade, data, hora e tipo registrados.");
    return true;
  }

  const activeModel = activeDocument
    ? DOCUMENT_MODELS.find((documento) => documento.tipo === activeDocument)
    : null;
  const documentModel = activeModel ?? null;
  const previewDocumento: DocumentoGeradoProcesso | null = activeModel
    ? {
        nome: activeModel.nome,
        arquivo: `${activeModel.nome} - ${form.produtor || "produtor"}.pdf`,
        tipo: activeModel.tipo,
        preenchido: true,
        dados: documentDraft,
      }
    : null;
  const previewProcesso = {
    produtor: form.produtor,
    cpf: form.cpf,
    tipoProcesso: form.tipoProcesso,
    unidadeLocal: form.unidadeLocal,
    tecnicoResponsavel: username,
    gerenteResponsavel: "",
    memorandoNumero: "",
    assinaturaEletronica: undefined,
  };

  if (!mounted || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.background }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderBottomColor: COLORS.primary }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
      <Sidebar
        onLogout={logout}
        username={username || "Tecnico da Unidade Local"}
        onCollapsedChange={setSidebarCollapsed}
      />

      <main
        className="transition-all duration-300 min-h-screen"
        style={{ marginLeft: sidebarCollapsed ? '72px' : '260px' }}
      >
        <div className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: COLORS.primary }}>Unidade Local</h1>
              <p className="text-sm" style={{ color: COLORS.textLight }}>
                Nova inscricao, renovacao, alteracao, documentos gerados automaticamente e envio ao gerente da Unidade Local.
              </p>
            </div>

            {message && (
              <div
                role={messageType === "error" ? "alert" : "status"}
                className="flex items-start gap-3 rounded-md border px-4 py-3 text-sm font-medium"
                style={{
                  backgroundColor: messageType === "error" ? "#FEF3F2" : COLORS.card,
                  borderColor: messageType === "error" ? "#FCA5A5" : COLORS.border,
                  color: messageType === "error" ? COLORS.danger : COLORS.primary,
                }}
              >
                {messageType === "error" ? <AlertTriangle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
                <span>{message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="rounded-lg border p-5 shadow-sm" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
              <div className="mb-4 flex items-center gap-2">
                {editingProcessId ? <RotateCcw size={18} style={{ color: COLORS.primary }} /> : <Plus size={18} style={{ color: COLORS.primary }} />}
                <div>
                  <h2 className="font-semibold" style={{ color: COLORS.text }}>{editingProcessId ? "Corrigir processo" : "Novo processo"}</h2>
                  {editingProcessId && <p className="text-xs" style={{ color: COLORS.textLight }}>Salve a correcao e depois use Reenviar ao gerente no card.</p>}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <input className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-green-500" placeholder="Nome do produtor" value={form.produtor} onChange={(e) => setForm({ ...form, produtor: e.target.value })} style={{ borderColor: COLORS.border }} />
                <input
                  className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="CPF"
                  value={form.cpf}
                  inputMode="numeric"
                  maxLength={14}
                  onChange={(e) => setForm({ ...form, cpf: formatCpf(e.target.value) })}
                  style={{ borderColor: COLORS.border }}
                />
                <select className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-green-500" value={form.tipoProcesso} onChange={(e) => setForm({ ...form, tipoProcesso: e.target.value as TipoProcessoSicpr })} style={{ borderColor: COLORS.border }}>
                  {Object.entries(TIPO_PROCESSO_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <UnlocSelect
                  value={form.unidadeLocal}
                  valueMode="municipio"
                  onChange={(value) => setForm({ ...form, unidadeLocal: value })}
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
                          onClick={() => openDocumentModal(documento.tipo)}
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
                            {documento.tipo === "fac" ? (isFilled ? "Gerada" : "Não gerada") : (isFilled ? "Preenchido" : "Preencher")}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <span className="mb-1 block text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Documentos obrigatórios assinados</span>
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
                          void handleFacAssinadaChange(event.target.files);
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
                          <button type="button" onClick={removeFacAssinada} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-red-50" style={{ color: COLORS.danger }}>
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
                          void handleFileChange(event.target.files);
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
                              onClick={() => removeAnexo(index)}
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
                    onClick={cancelEditing}
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

            <section className="rounded-lg border shadow-sm" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
              <div className="border-b px-4 py-3" style={{ borderBottomColor: COLORS.border }}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="font-semibold" style={{ color: COLORS.text }}>Meus processos</h2>
                    <p className="text-xs" style={{ color: COLORS.textLight }}>Lista compacta para grandes volumes. Clique em um processo para ver detalhes.</p>
                  </div>
                  <div className="relative lg:w-80">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textLight }} />
                    <input
                      value={processSearch}
                      onChange={(event) => {
                        setProcessSearch(event.target.value);
                        setPage(1);
                      }}
                      placeholder="Buscar nome, CPF, municipio ou memorando..."
                      className="w-full rounded-md border py-2 pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-green-500"
                      style={{ borderColor: COLORS.border }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 border-b p-4 sm:grid-cols-2 lg:grid-cols-5" style={{ borderBottomColor: COLORS.border }}>
                <StatCard label="Em elaboração" value={stats.emElaboracao} active={processFilter === "em_elaboracao"} onClick={() => applyProcessFilter("em_elaboracao")} />
                <StatCard label="Aguardando gerente" value={stats.aguardandoGerente} active={processFilter === "encaminhado_gerente"} onClick={() => applyProcessFilter("encaminhado_gerente")} />
                <StatCard label="Em análise" value={stats.emAnalise} active={processFilter === "em_analise"} onClick={() => applyProcessFilter("em_analise")} />
                <StatCard label="Devolvidos" value={stats.devolvidos} active={processFilter === "devolvidos"} onClick={() => applyProcessFilter("devolvidos")} />
                <StatCard label="Concluídos" value={stats.concluidos} active={processFilter === "concluidos"} onClick={() => applyProcessFilter("concluidos")} />
              </div>

              <div className="flex flex-wrap gap-2 px-4 pt-4">
                {PROCESS_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => applyProcessFilter(filter.id)}
                    className="rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
                    style={{
                      backgroundColor: processFilter === filter.id ? COLORS.primary : COLORS.background,
                      color: processFilter === filter.id ? "#FFFFFF" : COLORS.text,
                      border: `1px solid ${processFilter === filter.id ? COLORS.primary : COLORS.border}`,
                    }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto p-4">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase" style={{ borderBottomColor: COLORS.border, color: COLORS.textLight }}>
                      <th className="px-3 py-2">Produtor</th>
                      <th className="px-3 py-2">CPF</th>
                      <th className="px-3 py-2">Municipio</th>
                      <th className="px-3 py-2">Tipo</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedProcessos.map((processo) => (
                      <tr
                        key={processo.id}
                        onClick={() => {
                          setSelectedProcesso(processo);
                          setSelectedProcessoMessage("");
                          setActiveDetailTab("dados");
                        }}
                        className="cursor-pointer border-b transition-colors hover:bg-[#F5F7F5]"
                        style={{ borderBottomColor: COLORS.border }}
                      >
                        <td className="px-3 py-3 font-semibold" style={{ color: COLORS.text }}>{processo.produtor}</td>
                        <td className="px-3 py-3" style={{ color: COLORS.textLight }}>{processo.cpf}</td>
                        <td className="px-3 py-3" style={{ color: COLORS.text }}>{processo.unidadeLocal}</td>
                        <td className="px-3 py-3" style={{ color: COLORS.text }}>{TIPO_PROCESSO_LABELS[processo.tipoProcesso]}</td>
                        <td className="px-3 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_COLORS[processo.situacao]}`}>
                            {SITUACAO_LABELS[processo.situacao]}
                          </span>
                        </td>
                        <td className="px-3 py-3" style={{ color: COLORS.textLight }}>{formatDateTime(processo.encaminhadoGerenteEm || processo.criadoEm)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pagedProcessos.length === 0 && <div className="py-8 text-center text-sm" style={{ color: COLORS.textLight }}>Nenhum processo encontrado.</div>}
              </div>

              {filteredProcessos.length > PAGE_SIZE && (
                <div className="flex items-center justify-between border-t px-4 py-3 text-sm" style={{ borderTopColor: COLORS.border, color: COLORS.text }}>
                  <span>Pagina {page} de {totalPages} | {filteredProcessos.length} processo(s)</span>
                  <div className="flex gap-2">
                    <button type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-md px-3 py-1.5 font-semibold disabled:opacity-50 transition-colors hover:bg-gray-100" style={{ border: `1px solid ${COLORS.border}` }}>Anterior</button>
                    <button type="button" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="rounded-md px-3 py-1.5 font-semibold disabled:opacity-50 transition-colors hover:bg-gray-100" style={{ border: `1px solid ${COLORS.border}` }}>Proxima</button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Modais */}
      {selectedProcesso && (
        <UnlocProcessDetailsModal
          processo={selectedProcesso}
          message={selectedProcessoMessage}
          activeTab={activeDetailTab}
          onTabChange={setActiveDetailTab}
          onClose={() => {
            setSelectedProcesso(null);
            setSelectedProcessoMessage("");
          }}
          onEdit={startEditing}
          onEncaminhar={handleEncaminhar}
          onPreview={setPreview}
        />
      )}

      {activeDocument && (
        <UnlocDocumentModal
          activeDocument={activeDocument}
          activeModel={documentModel}
          documentDraft={documentDraft}
          message={documentModalMessage}
          previewDocumento={previewDocumento}
          previewProcesso={previewProcesso}
          onDraftChange={setDocumentDraft}
          onClose={closeDocumentModal}
          onPrint={printActiveDocument}
          onSave={saveGeneratedDocument}
        />
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-5">
          <div className="absolute inset-0 bg-black/45" onClick={() => setPreview(null)} />
          <div className="relative flex h-[90vh] w-[90vw] max-w-7xl flex-col overflow-hidden rounded-lg border shadow-2xl" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
            <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderBottomColor: COLORS.border }}>
              <div>
                <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>{preview.tipo === "gerado" ? "Documento gerado pelo sistema" : "Anexo do processo"}</p>
                <h2 className="mt-1 text-lg font-semibold" style={{ color: COLORS.primary }}>
                  {preview.tipo === "gerado" ? preview.documento.nome : preview.documento.arquivo}
                </h2>
                <p className="text-sm" style={{ color: COLORS.textLight }}>{preview.processo.produtor} | {preview.processo.unidadeLocal}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-gray-100"
                style={{ color: COLORS.textLight }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-5" style={{ backgroundColor: COLORS.background }}>
              {preview.tipo === "gerado" ? (
                <GeneratedDocumentPreview processo={preview.processo} documento={preview.documento} />
              ) : (
                <AttachmentPreview documento={preview.documento} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
