"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Search } from "lucide-react";
import { FilterStatCard as StatCard, SICPR_COLORS } from "@/app/_features/fluxo/SharedUi";
import Sidebar from "@/app/_components/layout/Sidebar";
import {
  SITUACAO_LABELS,
  STATUS_COLORS,
  TIPO_PROCESSO_LABELS,
  formatDateTime,
  getFacAssinada,
  getOutrosDocumentos,
  podeEncaminharGerente,
} from "@/app/_features/fluxo/storage";
import { fluxoApi } from "@/app/_features/fluxo/api";
import type { DocumentoGeradoProcesso, ProcessoSicpr } from "@/app/_features/fluxo/types";
import { useClientMounted } from "@/app/_hooks/useClientMounted";
import { useAuthSession } from "@/app/_hooks/useAuthSession";
import { DOCUMENT_MODELS, PAGE_SIZE, PROCESS_FILTERS, initialForm } from "./config";
import type { AnexoUpload, DetailTab, GeneratedDocKey, ProcessoFilter } from "./config";
import { normalizeDocumentDraft, printActiveDocument, validateDocumentDraft } from "./document-workflow";
import { fileToAnexo, formatCpf, onlyDigits } from "./file-utils";
import UnlocDocumentModal from "./UnlocDocumentModal";
import UnlocProcessForm from "./UnlocProcessForm";
import UnlocProcessDetailsModal from "./UnlocProcessDetailsModal";
import UnlocPreviewModal from "./UnlocPreviewModal";
import type { UnlocPreviewTarget } from "./UnlocPreviewModal";

const COLORS = SICPR_COLORS;

function generateTechnicianSignatureCode() {
  const year = new Date().getFullYear();
  const suffix = Math.random().toString(36).replace(/[^a-z0-9]/gi, "").slice(2, 8).toUpperCase().padEnd(6, "0");
  return `IDAM-TEC-${year}-${suffix}`;
}

function getFacNaturezaPedido(tipoProcesso: typeof initialForm.tipoProcesso) {
  if (tipoProcesso === "inscricao") return "Inscrição";
  if (tipoProcesso === "alteracao") return "Alteração";
  return "2a via";
}

type ProcessoFormState = typeof initialForm;

function getAutoDocumentDraft(tipo: GeneratedDocKey, formState: ProcessoFormState): Record<string, string> {
  if (tipo === "fac") {
    return {
      naturezaPedido: getFacNaturezaPedido(formState.tipoProcesso),
      municipio: formState.unidadeLocal,
      municipioPropriedade: formState.unidadeLocal,
      local: formState.unidadeLocal ? `${formState.unidadeLocal} - AM` : "",
      uf: "AM",
    };
  }

  return {
    finalidade: TIPO_PROCESSO_LABELS[formState.tipoProcesso],
    local: formState.unidadeLocal,
    municipio: formState.unidadeLocal,
  };
}

function syncAutomaticDocumentFields(
  currentDocuments: Partial<Record<GeneratedDocKey, Record<string, string>>>,
  previousForm: ProcessoFormState,
  nextForm: ProcessoFormState,
) {
  const nextDocuments = { ...currentDocuments };

  (["fac", "declaracao_produtor"] as GeneratedDocKey[]).forEach((tipo) => {
    const current = currentDocuments[tipo];
    if (!current) return;

    const previousAuto = getAutoDocumentDraft(tipo, previousForm);
    const nextAuto = getAutoDocumentDraft(tipo, nextForm);
    const synced = { ...current };

    Object.entries(nextAuto).forEach(([key, nextValue]) => {
      const currentValue = synced[key] || "";
      const previousValue = previousAuto[key] || "";

      if (!currentValue || currentValue === previousValue) {
        synced[key] = nextValue;
      }
    });

    nextDocuments[tipo] = synced;
  });

  return nextDocuments;
}

function declarationFieldsFromFac(fac: Record<string, string>): Record<string, string> {
  return {
    rg: fac.rg || "",
    propriedade: fac.propriedade || "",
    endereco: fac.endereco || "",
    municipio: fac.municipioPropriedade || fac.municipio || "",
    latitude: fac.latitude || "",
    longitude: fac.longitude || "",
    atividadePrincipal: fac.atividadeTipo || "",
    area: fac.areaCultivada || fac.areaExplorada || fac.areaTotal || "",
    incluindo: fac.producoes || "",
  };
}

function facFieldsFromDeclaration(declaracao: Record<string, string>): Record<string, string> {
  return {
    rg: declaracao.rg || "",
    propriedade: declaracao.propriedade || "",
    endereco: declaracao.endereco || "",
    municipioPropriedade: declaracao.municipio || "",
    latitude: declaracao.latitude || "",
    longitude: declaracao.longitude || "",
  };
}

function linkedFieldsForDocument(
  tipo: GeneratedDocKey,
  documents: Partial<Record<GeneratedDocKey, Record<string, string>>>,
) {
  if (tipo === "declaracao_produtor" && documents.fac) {
    return declarationFieldsFromFac(documents.fac);
  }

  if (tipo === "fac" && documents.declaracao_produtor) {
    return facFieldsFromDeclaration(documents.declaracao_produtor);
  }

  return {};
}

function syncLinkedDocumentFieldsOnSave(
  activeDocument: GeneratedDocKey,
  savedDocument: Record<string, string>,
  currentDocuments: Partial<Record<GeneratedDocKey, Record<string, string>>>,
) {
  const nextDocuments = {
    ...currentDocuments,
    [activeDocument]: savedDocument,
  };

  if (activeDocument === "fac" && currentDocuments.declaracao_produtor) {
    nextDocuments.declaracao_produtor = {
      ...currentDocuments.declaracao_produtor,
      ...declarationFieldsFromFac(savedDocument),
    };
  }

  if (activeDocument === "declaracao_produtor" && currentDocuments.fac) {
    nextDocuments.fac = {
      ...currentDocuments.fac,
      ...facFieldsFromDeclaration(savedDocument),
    };
  }

  return nextDocuments;
}

export default function UnlocPage() {
  const { username, role, logout, ready } = useAuthSession({
    defaultUsername: "Tecnico da Unidade Local",
    allowedRoles: ["ADMIN", "TECNICO", "USUARIO"],
  });
  const mounted = useClientMounted();
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
  const [preview, setPreview] = useState<UnlocPreviewTarget | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!ready || !mounted) return;
    const timer = window.setTimeout(() => {
      void fluxoApi.listarProcessos()
        .then(setProcessos)
        .catch((error) => {
          setMessageType("error");
          setMessage(error instanceof Error ? error.message : "Nao foi possivel carregar os processos.");
        });
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

  function applyProcessFilter(filter: ProcessoFilter) {
    setProcessFilter(filter);
    setPage(1);
  }

  function updateForm(nextForm: ProcessoFormState) {
    setForm((currentForm) => {
      setDocumentosGerados((currentDocuments) => syncAutomaticDocumentFields(currentDocuments, currentForm, nextForm));

      if (activeDocument) {
        const previousAuto = getAutoDocumentDraft(activeDocument, currentForm);
        const nextAuto = getAutoDocumentDraft(activeDocument, nextForm);

        setDocumentDraft((currentDraft) => {
          const syncedDraft = { ...currentDraft };
          Object.entries(nextAuto).forEach(([key, nextValue]) => {
            const currentValue = syncedDraft[key] || "";
            const previousValue = previousAuto[key] || "";

            if (!currentValue || currentValue === previousValue) {
              syncedDraft[key] = nextValue;
            }
          });

          return syncedDraft;
        });
      }

      return nextForm;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cpfDigits = onlyDigits(form.cpf);
    const missingBasicFields = [
      !form.produtor.trim() ? "nome do produtor" : "",
      !form.cpf.trim() ? "CPF" : "",
      !form.unidadeLocal.trim() ? "Unidade Local" : "",
    ].filter(Boolean);

    if (missingBasicFields.length > 0) {
      setMessageType("error");
      setMessage(`Preencha ${missingBasicFields.join(", ")} antes de criar o processo.`);
      return;
    }

    if (cpfDigits.length !== 11) {
      setMessageType("error");
      setMessage("Informe um CPF valido com 11 digitos.");
      return;
    }

    if (!documentosGerados.fac || !documentosGerados.declaracao_produtor) {
      const missingDocuments = [
        !documentosGerados.fac ? "FAC" : "",
        !documentosGerados.declaracao_produtor ? "Declaração" : "",
      ].filter(Boolean);

      setMessageType("error");
      setMessage(`Gere ${missingDocuments.join(" e ")} antes de criar o processo.`);
      return;
    }

    if (!facAssinada) {
      setMessageType("error");
      setMessage("Anexe a FAC assinada pelo produtor antes de criar ou salvar o processo.");
      return;
    }

    try {
      if (editingProcessId) {
        const updated = await fluxoApi.atualizarProcesso(editingProcessId, {
          ...form,
          cpf: formatCpf(form.cpf),
          documentosGerados,
          documentos: getDocumentosParaSalvar(),
        });
        setProcessos((current) => fluxoApi.replaceProcesso(current, updated));
        setEditingProcessId(null);
        setForm(initialForm);
        setDocumentosGerados({});
        setFacAssinada(null);
        setOutrosAnexos([]);
        setMessageType("success");
        setMessage("Correcao salva. Revise o card do processo e reenvie ao gerente quando estiver pronto.");
        return;
      }

      const created = await fluxoApi.criarProcesso({
        ...form,
        cpf: formatCpf(form.cpf),
        documentosGerados,
        documentos: getDocumentosParaSalvar(),
      });
      setProcessos((current) => [created, ...current]);
      setForm(initialForm);
      setDocumentosGerados({});
      setFacAssinada(null);
      setOutrosAnexos([]);
      setMessageType("success");
      setMessage("Processo criado em elaboracao.");
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar o processo.");
    }
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
    setDocumentDraft(documentosGerados[tipo] || {
      ...getAutoDocumentDraft(tipo, form),
      ...linkedFieldsForDocument(tipo, documentosGerados),
    });
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

    const documentToSave = activeDocument === "declaracao_produtor"
      ? {
          ...normalizedDraft,
          tecnicoAssinadaEm: new Date().toISOString(),
          tecnicoNome: username || "Tecnico da Unidade Local",
          tecnicoCargo: "Tecnico Responsavel",
          tecnicoUnidadeLocal: form.unidadeLocal || normalizedDraft.local || "",
          tecnicoCodigoValidacao: generateTechnicianSignatureCode(),
        }
      : normalizedDraft;

    setDocumentosGerados((current) => syncLinkedDocumentFieldsOnSave(activeDocument, documentToSave, current));
    setDocumentDraft(documentToSave);
    setActiveDocument(null);
    setDocumentDraft({});
    setDocumentModalMessage("");
    setMessageType("success");
    setMessage(
      activeDocument === "fac"
        ? "FAC gerada. Imprima, colete a assinatura física do produtor e anexe a versão assinada."
        : "Declaração gerada e assinada eletronicamente pelo técnico.",
    );
  }

  async function handleEncaminhar(id: string) {
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

    try {
      const updated = await fluxoApi.encaminharGerente(id);
      setProcessos((current) => fluxoApi.replaceProcesso(current, updated));
      setMessageType("success");
      setMessage("Processo encaminhado ao gerente com tecnico, unidade, data, hora e tipo registrados.");
      return true;
    } catch (error) {
      const warning = error instanceof Error ? error.message : "Nao foi possivel encaminhar o processo.";
      if (selectedProcesso?.id === id) {
        setSelectedProcessoMessage(warning);
      } else {
        setMessageType("error");
        setMessage(warning);
      }
      return false;
    }
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
        role={role}
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

            <UnlocProcessForm
              editingProcessId={editingProcessId}
              form={form}
              documentosGerados={documentosGerados}
              facAssinada={facAssinada}
              outrosAnexos={outrosAnexos}
              onSubmit={handleSubmit}
              onFormChange={updateForm}
              onOpenDocument={openDocumentModal}
              onFacAssinadaChange={(files) => void handleFacAssinadaChange(files)}
              onFileChange={(files) => void handleFileChange(files)}
              onRemoveFacAssinada={removeFacAssinada}
              onRemoveAnexo={removeAnexo}
              onCancelEditing={cancelEditing}
            />
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

      {preview && <UnlocPreviewModal preview={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
