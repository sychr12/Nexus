"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Eye, FileText, Paperclip, Plus, RotateCcw, Save, Search, Send, Trash2, UploadCloud, X } from "lucide-react";
import UnlocSelect from "../components/UnlocSelect";
import { GeneratedDocumentPreview } from "../fluxo/DocumentPreviews";
import { HistoricoResumo, ProcessoTimeline } from "../fluxo/ProcessoTimeline";
import TopBar from "../sidebar/page";
import {
  SITUACAO_LABELS,
  STATUS_COLORS,
  TIPO_PROCESSO_LABELS,
  addProcesso,
  atualizarProcessoUnloc,
  encaminharGerente,
  formatDateTime,
  getDocumentosGerados,
  getOutrosDocumentos,
  loadProcessos,
  saveProcessos,
} from "../fluxo/storage";
import type { DocumentoGeradoProcesso, DocumentoProcesso, ProcessoSicpr, TipoProcessoSicpr } from "../fluxo/types";

const COLORS = {
  primary: "#2D452F",
  accent: "#6B9D4A",
  background: "#F5F7F5",
  card: "#FFFFFF",
  text: "#1A2E1B",
  textLight: "#6B7C6A",
  border: "#E2E8E0",
  danger: "#B42318",
};

const initialForm = {
  produtor: "",
  cpf: "",
  tipoProcesso: "inscricao" as TipoProcessoSicpr,
  unidadeLocal: "",
};

type AnexoUpload = Pick<DocumentoProcesso, "id" | "nome" | "arquivo" | "conteudo" | "mimeType" | "tamanho">;
type GeneratedDocKey = "fac" | "declaracao_produtor";
type ProcessoFilter = "todos" | "em_elaboracao" | "encaminhado_gerente" | "em_analise" | "devolvidos" | "concluidos";
type DetailTab = "dados" | "historico" | "documentos";

const PAGE_SIZE = 50;

const PROCESS_FILTERS: Array<{ id: ProcessoFilter; label: string }> = [
  { id: "em_elaboracao", label: "Em elaboração" },
  { id: "encaminhado_gerente", label: "Aguardando gerente" },
  { id: "em_analise", label: "Em análise" },
  { id: "devolvidos", label: "Devolvidos" },
  { id: "concluidos", label: "Concluídos" },
  { id: "todos", label: "Todos" },
];

const DETAIL_TABS: Array<{ key: DetailTab; label: string }> = [
  { key: "dados", label: "Dados" },
  { key: "historico", label: "Histórico" },
  { key: "documentos", label: "Documentos" },
];

const DOCUMENT_MODELS: Array<{
  tipo: GeneratedDocKey;
  nome: string;
  descricao: string;
  campos: Array<{ key: string; label: string; placeholder: string }>;
}> = [
  {
    tipo: "declaracao_produtor",
    nome: "Declaração",
    descricao: "Declaracao textual assinada pela unidade local.",
    campos: [
      { key: "numero", label: "Numero da declaracao", placeholder: "Ex.: BOA 437/2026" },
      { key: "rg", label: "RG / Documento de identidade", placeholder: "Ex.: 194.514 SEP/AC" },
      { key: "propriedade", label: "Nome da propriedade", placeholder: "Ex.: Sitio Terra Nova" },
      { key: "endereco", label: "Endereco/comunidade", placeholder: "Ex.: Margem direita do Rio Purus Comunidade Lago Novo" },
      { key: "anoAtendimento", label: "Atendido desde", placeholder: "Ex.: 2012" },
      { key: "atividadePrincipal", label: "Atividade principal", placeholder: "Ex.: Horticultura" },
      { key: "area", label: "Area", placeholder: "Ex.: 0,2 ha" },
      { key: "incluindo", label: "Incluindo", placeholder: "Ex.: Cultivo de Alface e Cebola de palha" },
      { key: "latitude", label: "Latitude", placeholder: "Ex.: 08°75'28,62\"" },
      { key: "longitude", label: "Longitude", placeholder: "Ex.: 67°37'10,93\"" },
    ],
  },
  {
    tipo: "fac",
    nome: "FAC",
    descricao: "Declaracao de produtor rural com dados cadastrais.",
    campos: [
      { key: "inscricaoEstadual", label: "Inscricao estadual", placeholder: "Opcional" },
      { key: "rg", label: "RG / Documento de identidade", placeholder: "Ex.: 194.514 SSP/AC" },
      { key: "emissor", label: "Estado emissor", placeholder: "Ex.: SEP/AC" },
      { key: "rua", label: "Rua / Av.", placeholder: "Ex.: Zona Rural" },
      { key: "bairro", label: "Bairro", placeholder: "Ex.: Zona Rural" },
      { key: "municipio", label: "Municipio", placeholder: "Ex.: Boca do Acre" },
      { key: "uf", label: "UF", placeholder: "Ex.: AM" },
      { key: "endereco", label: "Endereco da propriedade", placeholder: "Ex.: Margem direita do Rio Purus" },
      { key: "propriedade", label: "Nome da propriedade", placeholder: "Ex.: Sitio Terra Nova" },
      { key: "comunidade", label: "Comunidade", placeholder: "Ex.: Lago Novo" },
      { key: "atividade", label: "Atividade principal", placeholder: "Ex.: Horticultura" },
      { key: "areaTotal", label: "Area total", placeholder: "Ex.: 15,00" },
      { key: "areaExplorada", label: "Area explorada", placeholder: "Ex.: 0,5 HA" },
      { key: "producoes", label: "Principais producoes", placeholder: "Ex.: Horticultura, exceto morango" },
      { key: "observacao", label: "Observacoes", placeholder: "Ex.: Atividade Principal - Alface 0,2 ha" },
    ],
  },
];

export default function UnlocPage() {
  const router = useRouter();
  const [username, setUsername] = useState("Tecnico UNLOC");
  const [processos, setProcessos] = useState<ProcessoSicpr[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingProcessId, setEditingProcessId] = useState<string | null>(null);
  const [documentosGerados, setDocumentosGerados] = useState<Partial<Record<GeneratedDocKey, Record<string, string>>>>({});
  const [activeDocument, setActiveDocument] = useState<GeneratedDocKey | null>(null);
  const [documentDraft, setDocumentDraft] = useState<Record<string, string>>({});
  const [outrosAnexos, setOutrosAnexos] = useState<AnexoUpload[]>([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [processSearch, setProcessSearch] = useState("");
  const [processFilter, setProcessFilter] = useState<ProcessoFilter>("em_elaboracao");
  const [page, setPage] = useState(1);
  const [selectedProcesso, setSelectedProcesso] = useState<ProcessoSicpr | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>("dados");
  const [preview, setPreview] = useState<
    | { tipo: "gerado"; processo: ProcessoSicpr; documento: DocumentoGeradoProcesso }
    | { tipo: "anexo"; processo: ProcessoSicpr; documento: DocumentoProcesso }
    | null
  >(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    const timer = window.setTimeout(() => {
      setUsername(localStorage.getItem("username") || "Tecnico UNLOC");
      setProcessos(loadProcessos());
    }, 0);
    return () => window.clearTimeout(timer);
  }, [router]);

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

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    router.push("/login");
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

    if (editingProcessId) {
      persist(atualizarProcessoUnloc(processos, editingProcessId, username, { ...form, cpf: formatCpf(form.cpf), documentosGerados, outrosDocumentos: outrosAnexos }));
      setEditingProcessId(null);
      setForm(initialForm);
      setDocumentosGerados({});
      setOutrosAnexos([]);
      setMessageType("success");
      setMessage("Correcao salva. Revise o card do processo e reenvie ao gerente quando estiver pronto.");
      return;
    }

    persist(addProcesso(processos, { ...form, cpf: formatCpf(form.cpf), tecnicoResponsavel: username, documentosGerados, outrosDocumentos: outrosAnexos }));
    setForm(initialForm);
    setDocumentosGerados({});
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

  function removeAnexo(index: number) {
    setOutrosAnexos((current) => current.filter((_, itemIndex) => itemIndex !== index));
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
    setOutrosAnexos(getOutrosDocumentos(processo).map((documento) => ({
      id: documento.id,
      nome: documento.nome,
      arquivo: documento.arquivo,
      conteudo: documento.conteudo,
      mimeType: documento.mimeType,
      tamanho: documento.tamanho,
    })));
    setMessageType("success");
    setMessage("Processo carregado para correcao. Ajuste os dados e salve antes de reenviar.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditing() {
    setEditingProcessId(null);
    setForm(initialForm);
    setDocumentosGerados({});
    setOutrosAnexos([]);
    setMessage("");
  }

  function openDocumentModal(tipo: GeneratedDocKey) {
    setActiveDocument(tipo);
    setDocumentDraft(documentosGerados[tipo] || {});
  }

  function saveGeneratedDocument() {
    if (!activeDocument) return;
    setDocumentosGerados((current) => ({
      ...current,
      [activeDocument]: documentDraft,
    }));
    setActiveDocument(null);
    setDocumentDraft({});
    setMessageType("success");
    setMessage("Documento preenchido e pronto para geracao automatica.");
  }

  function handleEncaminhar(id: string) {
    persist(encaminharGerente(processos, id, username));
    setMessageType("success");
    setMessage("Processo encaminhado ao gerente com tecnico, unidade, data, hora e tipo registrados.");
  }

  const activeModel = activeDocument
    ? DOCUMENT_MODELS.find((documento) => documento.tipo === activeDocument)
    : null;
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
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
      <TopBar onLogout={handleLogout} username={username} />

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: COLORS.primary }}>Unloc</h1>
            <p className="text-sm" style={{ color: COLORS.textLight }}>
              Nova inscricao, renovacao, alteracao, documentos gerados automaticamente e envio ao gerente da Unidade Local.
            </p>
          </div>

          {message && (
            <div
              role={messageType === "error" ? "alert" : "status"}
              className={`sicpr-alert ${messageType === "error" ? "sicpr-alert-error" : ""} flex items-start gap-3 rounded-md border px-4 py-3 text-sm font-medium`}
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
              <input className="rounded-md border px-3 py-2 text-sm" placeholder="Nome do produtor" value={form.produtor} onChange={(e) => setForm({ ...form, produtor: e.target.value })} style={{ borderColor: COLORS.border }} />
              <input
                className="rounded-md border px-3 py-2 text-sm"
                placeholder="CPF"
                value={form.cpf}
                inputMode="numeric"
                maxLength={14}
                onChange={(e) => setForm({ ...form, cpf: formatCpf(e.target.value) })}
                style={{ borderColor: COLORS.border }}
              />
              <select className="rounded-md border px-3 py-2 text-sm" value={form.tipoProcesso} onChange={(e) => setForm({ ...form, tipoProcesso: e.target.value as TipoProcessoSicpr })} style={{ borderColor: COLORS.border }}>
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
                <p className="mb-2 text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Documentos do processo</p>
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
                          {isFilled ? "Preenchido" : "Preencher"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <span className="mb-1 block text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Outros anexos</span>
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
                          className="sicpr-remove-button inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md opacity-85 group-hover:opacity-100"
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
              <button className="sicpr-action-button inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: COLORS.primary }}>
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
                    className="w-full rounded-md border py-2 pl-9 pr-3 text-sm outline-none"
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
                  <button type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-md px-3 py-1.5 font-semibold disabled:opacity-50" style={{ border: `1px solid ${COLORS.border}` }}>Anterior</button>
                  <button type="button" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="rounded-md px-3 py-1.5 font-semibold disabled:opacity-50" style={{ border: `1px solid ${COLORS.border}` }}>Proxima</button>
                </div>
              </div>
            )}

            <div className="hidden">
              {meusProcessos.map((processo) => (
                <article key={processo.id} className="rounded-md border p-4" style={{ borderColor: COLORS.border }}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold" style={{ color: COLORS.text }}>{processo.produtor}</h3>
                      <p className="text-xs" style={{ color: COLORS.textLight }}>{processo.cpf} | {processo.unidadeLocal} | {TIPO_PROCESSO_LABELS[processo.tipoProcesso]}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_COLORS[processo.situacao]}`}>
                      {SITUACAO_LABELS[processo.situacao]}
                    </span>
                  </div>

                  {processo.ultimaJustificativa && (
                    <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">{processo.ultimaJustificativa}</p>
                  )}

                  <div className="mt-3 grid gap-2 text-xs" style={{ color: COLORS.textLight }}>
                    <span>Criado: {formatDateTime(processo.criadoEm)}</span>
                    <span>Encaminhado: {formatDateTime(processo.encaminhadoGerenteEm)}</span>
                  </div>

                  <div className="mt-3 grid gap-3 text-xs lg:grid-cols-2">
                    <div className="rounded-md border p-2" style={{ borderColor: COLORS.border }}>
                      <p className="mb-1 inline-flex items-center gap-1 font-semibold" style={{ color: COLORS.text }}>
                        <FileText size={13} /> Gerados
                      </p>
                      <div className="grid gap-1">
                        {getDocumentosGerados(processo).map((doc) => (
                          <button
                            key={doc.arquivo}
                            type="button"
                            onClick={() => setPreview({ tipo: "gerado", processo, documento: doc })}
                            className="flex w-full items-center gap-1 rounded px-1 py-1 text-left transition-colors hover:bg-[#F5F7F5]"
                            style={{ color: COLORS.textLight }}
                          >
                            <Eye size={12} style={{ color: COLORS.primary }} />
                            <span className="min-w-0 truncate">{doc.nome}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-md border p-2" style={{ borderColor: COLORS.border }}>
                      <p className="mb-1 inline-flex items-center gap-1 font-semibold" style={{ color: COLORS.text }}>
                        <Paperclip size={13} /> Outros
                      </p>
                      {getOutrosDocumentos(processo).length > 0 ? (
                        <div className="grid gap-1">
                          {getOutrosDocumentos(processo).map((doc) => (
                            <button
                              key={doc.id}
                              type="button"
                              onClick={() => setPreview({ tipo: "anexo", processo, documento: doc })}
                              className="flex w-full items-center gap-1 rounded px-1 py-1 text-left transition-colors hover:bg-[#F5F7F5]"
                              style={{ color: COLORS.textLight }}
                            >
                              <Eye size={12} style={{ color: COLORS.primary }} />
                              <span className="min-w-0 truncate">{doc.arquivo}</span>
                            </button>
                          ))}
                        </div>
                      ) : <p style={{ color: COLORS.textLight }}>Sem anexos extras</p>}
                    </div>
                  </div>

                  {processo.situacao === "em_elaboracao" && (
                    <button
                      type="button"
                      onClick={() => handleEncaminhar(processo.id)}
                      className="sicpr-action-button mt-4 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white"
                      style={{ backgroundColor: COLORS.accent }}
                    >
                      <Send size={15} />
                      Encaminhar ao gerente
                    </button>
                  )}

                  {["devolvido_gerente", "devolvido_analise"].includes(processo.situacao) && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEditing(processo)}
                        className="sicpr-action-button inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white"
                        style={{ backgroundColor: COLORS.primary }}
                      >
                        <RotateCcw size={15} />
                        Editar correcao
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEncaminhar(processo.id)}
                        className="sicpr-action-button inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white"
                        style={{ backgroundColor: COLORS.accent }}
                      >
                        <Send size={15} />
                        Reenviar ao gerente
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>

      {selectedProcesso && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center px-4 py-5">
          <div className="absolute inset-0 bg-black/45" onClick={() => setSelectedProcesso(null)} />
          <section className="relative flex h-[90vh] w-[90vw] max-w-[1400px] flex-col overflow-hidden rounded-lg border shadow-2xl" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
            <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderBottomColor: COLORS.border }}>
              <div>
                <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Detalhes do processo</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold" style={{ color: COLORS.primary }}>{selectedProcesso.produtor}</h2>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_COLORS[selectedProcesso.situacao]}`}>
                    {SITUACAO_LABELS[selectedProcesso.situacao]}
                  </span>
                </div>
                <p className="text-sm" style={{ color: COLORS.textLight }}>{selectedProcesso.cpf} | {selectedProcesso.unidadeLocal} | {TIPO_PROCESSO_LABELS[selectedProcesso.tipoProcesso]}</p>
              </div>
              <button type="button" onClick={() => setSelectedProcesso(null)} className="inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-gray-100" style={{ color: COLORS.textLight }}>
                <X size={18} />
              </button>
            </div>

            <div className="border-b px-5 pt-3" style={{ borderBottomColor: COLORS.border }}>
              <div className="flex flex-wrap gap-2">
                {DETAIL_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveDetailTab(tab.key)}
                    className="rounded-t-md px-3 py-2 text-sm font-semibold transition-colors"
                    style={{
                      backgroundColor: activeDetailTab === tab.key ? COLORS.background : "transparent",
                      color: activeDetailTab === tab.key ? COLORS.primary : COLORS.textLight,
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-5">
              {selectedProcesso.ultimaJustificativa && (
                <p className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">{selectedProcesso.ultimaJustificativa}</p>
              )}

              {activeDetailTab === "dados" && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailInfoCard label="Status" value={SITUACAO_LABELS[selectedProcesso.situacao]} badgeClass={STATUS_COLORS[selectedProcesso.situacao]} />
                  <DetailInfoCard label="Técnico responsável" value={selectedProcesso.tecnicoResponsavel} />
                  <DetailInfoCard label="Gerente responsável" value={selectedProcesso.gerenteResponsavel || "-"} />
                  <DetailInfoCard label="Data de criação" value={formatDateTime(selectedProcesso.criadoEm)} />
                  <DetailInfoCard label="Encaminhado ao gerente" value={formatDateTime(selectedProcesso.encaminhadoGerenteEm)} />
                  <DetailInfoCard label="Memorando atual" value={selectedProcesso.memorandoNumero || "-"} />
                </div>
              )}

              {activeDetailTab === "historico" && (
                <div className="grid gap-4">
                  <div className="rounded-md border p-4" style={{ borderColor: COLORS.border }}>
                    <p className="mb-3 font-semibold" style={{ color: COLORS.text }}>Resumo do histórico</p>
                    <HistoricoResumo processo={selectedProcesso} />
                  </div>
                  <div className="rounded-md border p-4" style={{ borderColor: COLORS.border }}>
                    <p className="mb-4 font-semibold" style={{ color: COLORS.text }}>Timeline do processo</p>
                    <ProcessoTimeline processo={selectedProcesso} />
                  </div>
                </div>
              )}

              {activeDetailTab === "documentos" && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-md border p-4" style={{ borderColor: COLORS.border }}>
                    <p className="mb-2 inline-flex items-center gap-2 font-semibold" style={{ color: COLORS.text }}>
                      <FileText size={15} /> Documentos gerados automaticamente
                    </p>
                    {getDocumentosGerados(selectedProcesso).map((doc) => (
                      <button
                        key={doc.arquivo}
                        type="button"
                        onClick={() => setPreview({ tipo: "gerado", processo: selectedProcesso, documento: doc })}
                        className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left transition-colors hover:bg-[#F5F7F5]"
                        style={{ color: COLORS.textLight }}
                      >
                        <Eye size={13} style={{ color: COLORS.primary }} />
                        <span className="min-w-0 truncate">{doc.nome}</span>
                      </button>
                    ))}
                  </div>
                  <div className="rounded-md border p-4" style={{ borderColor: COLORS.border }}>
                    <p className="mb-2 inline-flex items-center gap-2 font-semibold" style={{ color: COLORS.text }}>
                      <Paperclip size={15} /> Documentos anexados
                    </p>
                    {getOutrosDocumentos(selectedProcesso).length > 0 ? getOutrosDocumentos(selectedProcesso).map((doc) => (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => setPreview({ tipo: "anexo", processo: selectedProcesso, documento: doc })}
                        className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left transition-colors hover:bg-[#F5F7F5]"
                        style={{ color: COLORS.textLight }}
                      >
                        <Eye size={13} style={{ color: COLORS.primary }} />
                        <span className="min-w-0 truncate">{doc.arquivo}</span>
                      </button>
                    )) : <p className="text-sm" style={{ color: COLORS.textLight }}>Sem anexos extras</p>}
                  </div>
                </div>
              )}
            </div>

            {["em_elaboracao", "devolvido_gerente", "devolvido_analise"].includes(selectedProcesso.situacao) && (
              <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t px-5 py-4" style={{ borderTopColor: COLORS.border }}>
                {selectedProcesso.situacao === "em_elaboracao" && (
                  <button type="button" onClick={() => { handleEncaminhar(selectedProcesso.id); setSelectedProcesso(null); }} className="sicpr-action-button inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white" style={{ backgroundColor: COLORS.accent }}>
                    <Send size={15} />
                    Encaminhar ao gerente
                  </button>
                )}
                {["devolvido_gerente", "devolvido_analise"].includes(selectedProcesso.situacao) && (
                  <>
                    <button type="button" onClick={() => { startEditing(selectedProcesso); setSelectedProcesso(null); }} className="sicpr-action-button inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white" style={{ backgroundColor: COLORS.primary }}>
                      <RotateCcw size={15} />
                      Editar correcao
                    </button>
                    <button type="button" onClick={() => { handleEncaminhar(selectedProcesso.id); setSelectedProcesso(null); }} className="sicpr-action-button inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white" style={{ backgroundColor: COLORS.accent }}>
                      <Send size={15} />
                      Reenviar ao gerente
                    </button>
                  </>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {activeDocument && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-5">
          <div className="absolute inset-0 bg-black/45" onClick={() => setActiveDocument(null)} />
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
                onClick={() => setActiveDocument(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-gray-100"
                style={{ color: COLORS.textLight }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-[390px_minmax(0,1fr)]">
              <div className="min-h-0 overflow-y-auto border-r px-5 py-4" style={{ borderRightColor: COLORS.border }}>
                <div className="grid gap-4">
                  {activeModel?.campos.map((campo) => (
                    <label key={campo.key} className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>{campo.label}</span>
                      <input
                        value={documentDraft[campo.key] || ""}
                        onChange={(event) => setDocumentDraft((current) => ({ ...current, [campo.key]: event.target.value }))}
                        placeholder={campo.placeholder}
                        className="w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-4 focus:ring-[#6B9D4A]/10"
                        style={{ borderColor: COLORS.border, color: COLORS.text }}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="min-h-0 overflow-auto p-5" style={{ backgroundColor: COLORS.background }}>
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
                onClick={() => setActiveDocument(null)}
                className="rounded-md px-4 py-2 text-sm font-semibold transition-colors hover:bg-gray-100"
                style={{ color: COLORS.textLight }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveGeneratedDocument}
                className="sicpr-action-button inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: COLORS.primary }}
              >
                <Save size={15} />
                Gerar documento
              </button>
            </div>
          </section>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-5">
          <div className="absolute inset-0 bg-black/45" onClick={() => setPreview(null)} />
          <section className="relative flex h-[90vh] w-[90vw] max-w-[1400px] flex-col overflow-hidden rounded-lg border shadow-2xl" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
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
          </section>
        </div>
      )}
    </div>
  );
}

function AttachmentPreview({ documento }: { documento: DocumentoProcesso }) {
  if (documento.conteudo && documento.mimeType?.startsWith("image/")) {
    return (
      <div className="flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={documento.conteudo} alt={documento.arquivo} className="max-h-[72vh] max-w-full rounded-md border bg-white object-contain" />
      </div>
    );
  }

  if (documento.conteudo && documento.mimeType === "application/pdf") {
    return <iframe title={documento.arquivo} src={documento.conteudo} className="h-[72vh] w-full rounded-md border bg-white" />;
  }

  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-md border border-dashed bg-white text-center">
      <FileText size={48} />
      <p className="mt-3 font-semibold">{documento.arquivo}</p>
      <p className="mt-1 text-sm text-gray-500">Arquivo anexado. Pre-visualizacao disponivel para imagens e PDF.</p>
    </div>
  );
}

function StatCard({ label, value, active, onClick }: { label: string; value: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border px-3 py-2 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm"
      style={{
        borderColor: active ? COLORS.primary : COLORS.border,
        backgroundColor: active ? "#EEF5EC" : COLORS.background,
      }}
    >
      <p className="text-xs font-semibold uppercase" style={{ color: active ? COLORS.primary : COLORS.textLight }}>{label}</p>
      <p className="mt-1 text-xl font-bold" style={{ color: COLORS.primary }}>{value}</p>
    </button>
  );
}

function DetailInfoCard({ label, value, badgeClass }: { label: string; value: string; badgeClass?: string }) {
  return (
    <div className="rounded-md border bg-white px-3 py-3" style={{ borderColor: COLORS.border }}>
      <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>{label}</p>
      {badgeClass ? (
        <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${badgeClass}`}>
          {value}
        </span>
      ) : (
        <p className="mt-2 break-words text-sm font-semibold" style={{ color: COLORS.text }}>{value}</p>
      )}
    </div>
  );
}

function fileToAnexo(file: File): Promise<AnexoUpload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        id: `${Date.now()}-${file.name}-${Math.random().toString(16).slice(2)}`,
        nome: file.name,
        arquivo: file.name,
        conteudo: String(reader.result || ""),
        mimeType: file.type,
        tamanho: file.size,
      });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function formatFileSize(size?: number) {
  if (!size) return "Tamanho nao informado";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatCpf(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}
