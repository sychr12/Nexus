"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowDownToLine,
  CheckCircle2,
  Clock3,
  ClipboardList,
  FileCheck2,
  FileText,
  Inbox,
  Mail,
  Search,
  Send,
  X,
} from "lucide-react";
import TopBar from "../sidebar/page";

const COLORS = {
  primary: "#2D452F",
  secondary: "#4C6A4B",
  accent: "#6B9D4A",
  light: "#CFE2CE",
  background: "#F5F7F5",
  card: "#FFFFFF",
  text: "#1A2E1B",
  textLight: "#6B7C6A",
  border: "#E2E8E0",
  danger: "#B42318",
  warning: "#B54708",
  info: "#175CD3",
};

type AnalysisStage = "chegados" | "lancamentos" | "baixa";
type Priority = "urgente" | "normal";
type AnalysisModalTab = "resumo" | "documentos" | "fluxo" | "observacoes";

interface DocumentoEmail {
  id: string;
  nome: string;
  tipo: "processo" | "memorando" | "complementar";
  paginas: number;
  tamanho: string;
  descricao: string;
}

interface ProcessoAnalise {
  id: number;
  protocolo: string;
  produtor: string;
  cpf: string;
  municipio: string;
  memorando: string;
  emailOrigem: string;
  assunto: string;
  recebidoEm: string;
  prazo: string;
  prioridade: Priority;
  etapa: AnalysisStage;
  documentos: DocumentoEmail[];
  observacao: string;
}

const STAGE_LABELS: Record<AnalysisStage, string> = {
  chegados: "Chegados",
  lancamentos: "Lançamentos",
  baixa: "Para baixa",
};

const STAGE_DESCRIPTIONS: Record<AnalysisStage, string> = {
  chegados: "Processos recebidos por e-mail aguardando análise inicial.",
  lancamentos: "Processos conferidos e prontos para lançamento.",
  baixa: "Processos separados para baixa ou conclusão.",
};

const INITIAL_PROCESSOS: ProcessoAnalise[] = [
  {
    id: 1,
    protocolo: "SICPR-2026-0148",
    produtor: "Maria do Socorro Lima",
    cpf: "018.765.432-10",
    municipio: "Manacapuru",
    memorando: "MEMO/SEPROR/118/2026",
    emailOrigem: "protocolo@sepror.am.gov.br",
    assunto: "Solicitação de análise cadastral",
    recebidoEm: "2026-05-15T08:42:00",
    prazo: "2026-05-16",
    prioridade: "urgente",
    etapa: "chegados",
    documentos: [
      {
        id: "proc-0148",
        nome: "processo-maria-socorro-lima.pdf",
        tipo: "processo",
        paginas: 18,
        tamanho: "4.8 MB",
        descricao: "PDF principal do processo recebido para análise cadastral.",
      },
      {
        id: "memo-0148",
        nome: "memorando-118-2026.pdf",
        tipo: "memorando",
        paginas: 2,
        tamanho: "420 KB",
        descricao: "Memorando informativo encaminhado junto ao processo.",
      },
      {
        id: "comp-0148",
        nome: "documentos-complementares.pdf",
        tipo: "complementar",
        paginas: 6,
        tamanho: "1.7 MB",
        descricao: "CPF, comprovante de residência e declaração rural digitalizados.",
      },
    ],
    observacao: "Memorando solicita prioridade por vencimento de prazo administrativo.",
  },
  {
    id: 2,
    protocolo: "SICPR-2026-0149",
    produtor: "João Batista Ferreira",
    cpf: "742.105.998-21",
    municipio: "Itacoatiara",
    memorando: "MEMO/SEPROR/121/2026",
    emailOrigem: "cadastro.rural@sepror.am.gov.br",
    assunto: "Renovação de cadastro",
    recebidoEm: "2026-05-15T10:18:00",
    prazo: "2026-05-20",
    prioridade: "normal",
    etapa: "chegados",
    documentos: [
      {
        id: "proc-0149",
        nome: "processo-joao-batista-ferreira.pdf",
        tipo: "processo",
        paginas: 14,
        tamanho: "3.9 MB",
        descricao: "PDF principal do processo de renovação de cadastro.",
      },
      {
        id: "memo-0149",
        nome: "memorando-121-2026.pdf",
        tipo: "memorando",
        paginas: 2,
        tamanho: "398 KB",
        descricao: "Memorando informativo com orientação de renovação.",
      },
    ],
    observacao: "Aguardando conferência dos dados do produtor e da localidade.",
  },
  {
    id: 3,
    protocolo: "SICPR-2026-0137",
    produtor: "Ana Cristina Moura",
    cpf: "509.312.447-03",
    municipio: "Parintins",
    memorando: "MEMO/SEPROR/109/2026",
    emailOrigem: "protocolo@sepror.am.gov.br",
    assunto: "Processo apto para lançamento",
    recebidoEm: "2026-05-14T15:07:00",
    prazo: "2026-05-18",
    prioridade: "normal",
    etapa: "lancamentos",
    documentos: [
      {
        id: "proc-0137",
        nome: "processo-ana-cristina-moura.pdf",
        tipo: "processo",
        paginas: 21,
        tamanho: "5.2 MB",
        descricao: "PDF do processo já conferido e apto para lançamento.",
      },
      {
        id: "memo-0137",
        nome: "memorando-109-2026.pdf",
        tipo: "memorando",
        paginas: 1,
        tamanho: "312 KB",
        descricao: "Memorando de encaminhamento para lançamento.",
      },
    ],
    observacao: "Documentação conferida. Inserir lançamento no fluxo do SICPR.",
  },
  {
    id: 4,
    protocolo: "SICPR-2026-0131",
    produtor: "Raimundo Nonato Alves",
    cpf: "132.456.709-55",
    municipio: "Tefé",
    memorando: "MEMO/SEPROR/104/2026",
    emailOrigem: "atendimento@sepror.am.gov.br",
    assunto: "Baixa de processo concluído",
    recebidoEm: "2026-05-13T11:35:00",
    prazo: "2026-05-15",
    prioridade: "urgente",
    etapa: "baixa",
    documentos: [
      {
        id: "proc-0131",
        nome: "processo-raimundo-nonato-alves.pdf",
        tipo: "processo",
        paginas: 16,
        tamanho: "4.1 MB",
        descricao: "PDF do processo concluído para baixa.",
      },
      {
        id: "memo-0131",
        nome: "memorando-104-2026.pdf",
        tipo: "memorando",
        paginas: 2,
        tamanho: "446 KB",
        descricao: "Memorando solicitando baixa do processo.",
      },
      {
        id: "comp-0131",
        nome: "despacho-e-comprovante.pdf",
        tipo: "complementar",
        paginas: 4,
        tamanho: "1.2 MB",
        descricao: "Despacho e comprovante de lançamento anexados ao e-mail.",
      },
    ],
    observacao: "Lançamento finalizado. Encaminhar para baixa conforme memorando.",
  },
  {
    id: 5,
    protocolo: "SICPR-2026-0128",
    produtor: "Luciana Pereira da Costa",
    cpf: "654.700.120-44",
    municipio: "Autazes",
    memorando: "MEMO/SEPROR/099/2026",
    emailOrigem: "cadastro.rural@sepror.am.gov.br",
    assunto: "Análise de inscrição",
    recebidoEm: "2026-05-12T09:26:00",
    prazo: "2026-05-17",
    prioridade: "normal",
    etapa: "lancamentos",
    documentos: [
      {
        id: "proc-0128",
        nome: "processo-luciana-pereira-costa.pdf",
        tipo: "processo",
        paginas: 19,
        tamanho: "4.6 MB",
        descricao: "PDF principal do processo de inscrição.",
      },
      {
        id: "memo-0128",
        nome: "memorando-099-2026.pdf",
        tipo: "memorando",
        paginas: 2,
        tamanho: "401 KB",
        descricao: "Memorando informativo recebido com o processo.",
      },
      {
        id: "comp-0128",
        nome: "identificacao-e-residencia.pdf",
        tipo: "complementar",
        paginas: 5,
        tamanho: "1.5 MB",
        descricao: "Documentos pessoais e comprovante de residência em PDF.",
      },
    ],
    observacao: "Conferência concluída sem pendências aparentes.",
  },
];

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR");
};

const getDaysToDeadline = (value: string) => {
  const today = new Date();
  const deadline = new Date(`${value}T23:59:59`);
  if (Number.isNaN(deadline.getTime())) return null;

  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);
  return Math.ceil((deadline.getTime() - today.getTime()) / 86400000);
};

const getDocumentTypeLabel = (tipo: DocumentoEmail["tipo"]) => {
  const labels: Record<DocumentoEmail["tipo"], string> = {
    processo: "Processo",
    memorando: "Memorando",
    complementar: "Complementar",
  };

  return labels[tipo];
};

const getStageListTitle = (stage: AnalysisStage) => {
  if (stage === "baixa") return "Lista para baixa";
  return `Lista de ${STAGE_LABELS[stage].toLowerCase()}`;
};

export default function AnalisesPage() {
  const router = useRouter();
  const [processos, setProcessos] = useState<ProcessoAnalise[]>(INITIAL_PROCESSOS);
  const [activeStage, setActiveStage] = useState<AnalysisStage>("chegados");
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"todos" | Priority>("todos");
  const [selectedProcesso, setSelectedProcesso] = useState<ProcessoAnalise | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<AnalysisModalTab>("resumo");
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [analysisNotes, setAnalysisNotes] = useState<Record<number, string>>({});
  const [flowNotice, setFlowNotice] = useState<{ processId: number; etapa: AnalysisStage } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const username = typeof window !== "undefined" ? localStorage.getItem("username") || "Usuário" : "Usuário";

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    router.push("/login");
  }

  function openAnalysisModal(processo: ProcessoAnalise) {
    setSelectedProcesso(processo);
    setSelectedDocumentId(processo.documentos.find((documento) => documento.tipo === "processo")?.id || processo.documentos[0]?.id || "");
    setFlowNotice(null);
    setActiveModalTab("resumo");
  }

  function updateProcessStage(id: number, etapa: AnalysisStage) {
    const currentStage = processos.find((processo) => processo.id === id)?.etapa;
    setFlowNotice(currentStage && currentStage !== etapa ? { processId: id, etapa } : null);

    setProcessos((current) =>
      current.map((processo) =>
        processo.id === id
          ? {
              ...processo,
              etapa,
              prioridade: etapa === "baixa" ? "normal" : processo.prioridade,
            }
          : processo,
      ),
    );

    setSelectedProcesso((current) =>
      current?.id === id
        ? {
            ...current,
            etapa,
            prioridade: etapa === "baixa" ? "normal" : current.prioridade,
          }
        : current,
    );
    setActiveStage(etapa);
  }

  function togglePriority(id: number) {
    setProcessos((current) =>
      current.map((processo) =>
        processo.id === id
          ? { ...processo, prioridade: processo.prioridade === "urgente" ? "normal" : "urgente" }
          : processo,
      ),
    );

    setSelectedProcesso((current) =>
      current?.id === id
        ? { ...current, prioridade: current.prioridade === "urgente" ? "normal" : "urgente" }
        : current,
    );
  }

  function updateAnalysisNote(id: number, note: string) {
    setAnalysisNotes((current) => ({
      ...current,
      [id]: note,
    }));
  }

  const filteredProcessos = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const digits = searchTerm.replace(/\D/g, "");

    return processos.filter((processo) => {
      const cpfDigits = processo.cpf.replace(/\D/g, "");
      const matchesStage = processo.etapa === activeStage;
      const matchesPriority = priorityFilter === "todos" || processo.prioridade === priorityFilter;
      const matchesSearch =
        !term ||
        processo.protocolo.toLowerCase().includes(term) ||
        processo.produtor.toLowerCase().includes(term) ||
        processo.municipio.toLowerCase().includes(term) ||
        processo.memorando.toLowerCase().includes(term) ||
        (digits.length > 0 && cpfDigits.includes(digits));

      return matchesStage && matchesPriority && matchesSearch;
    });
  }, [activeStage, priorityFilter, processos, searchTerm]);

  const urgentProcessos = useMemo(
    () =>
      processos
        .filter((processo) => processo.prioridade === "urgente")
        .sort((a, b) => new Date(a.prazo).getTime() - new Date(b.prazo).getTime()),
    [processos],
  );

  const counts = useMemo(
    () => ({
      urgentes: urgentProcessos.length,
      chegados: processos.filter((processo) => processo.etapa === "chegados").length,
      lancamentos: processos.filter((processo) => processo.etapa === "lancamentos").length,
      baixa: processos.filter((processo) => processo.etapa === "baixa").length,
    }),
    [processos, urgentProcessos.length],
  );

  const hasActiveFilters = searchTerm.trim() !== "" || priorityFilter !== "todos";
  const selectedDocument =
    selectedProcesso?.documentos.find((documento) => documento.id === selectedDocumentId) ||
    selectedProcesso?.documentos[0] ||
    null;
  const selectedAnalysisNote = selectedProcesso ? analysisNotes[selectedProcesso.id] || "" : "";
  const selectedFlowNotice = selectedProcesso && flowNotice?.processId === selectedProcesso.id ? flowNotice : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
      <TopBar onLogout={handleLogout} username={username} />

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: COLORS.primary }}>Análises</h1>
              <p className="text-sm" style={{ color: COLORS.textLight }}>
                Acompanhe os processos recebidos por e-mail com seus respectivos memorandos
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative sm:w-80">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textLight }} />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar por produtor, CPF ou memorando..."
                  className="w-full rounded-md py-2 pl-9 pr-3 text-sm outline-none"
                  style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                />
              </div>

              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value as "todos" | Priority)}
                className="rounded-md px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
              >
                <option value="todos">Todas as prioridades</option>
                <option value="urgente">Urgentes</option>
                <option value="normal">Normais</option>
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setPriorityFilter("todos");
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-white"
                  style={{ border: `1px solid ${COLORS.border}`, color: COLORS.primary }}
                >
                  <X size={16} />
                  Limpar
                </button>
              )}
            </div>
          </div>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Urgência", value: counts.urgentes, icon: AlertTriangle, color: COLORS.warning },
              { label: "Chegados", value: counts.chegados, icon: Inbox, color: COLORS.primary },
              { label: "Lançamentos", value: counts.lancamentos, icon: Send, color: COLORS.info },
              { label: "Para baixa", value: counts.baixa, icon: ArrowDownToLine, color: COLORS.accent },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-lg border p-4 shadow-sm" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: COLORS.textLight }}>{item.label}</p>
                      <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color: COLORS.text }}>{item.value}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-md" style={{ backgroundColor: `${item.color}18` }}>
                      <Icon size={20} style={{ color: item.color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          <section
            className="rounded-lg border shadow-sm"
            style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
          >
            <div className="flex flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: "#FEF0C7" }}>
                  <AlertTriangle size={18} style={{ color: COLORS.warning }} />
                </div>
                <div>
                  <h2 className="text-base font-semibold" style={{ color: COLORS.text }}>Parte de urgência</h2>
                  <p className="text-xs" style={{ color: COLORS.textLight }}>Processos que precisam ser analisados primeiro</p>
                </div>
              </div>
              <span className="text-xs font-medium" style={{ color: COLORS.textLight }}>
                {urgentProcessos.length} processo{urgentProcessos.length === 1 ? "" : "s"} em atenção
              </span>
            </div>

            {urgentProcessos.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm" style={{ color: COLORS.textLight }}>
                Nenhum processo marcado como urgente.
              </div>
            ) : (
              <div className="grid grid-cols-1 divide-y divide-[#E2E8E0] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
                {urgentProcessos.map((processo) => {
                  const days = getDaysToDeadline(processo.prazo);
                  return (
                    <button
                      key={processo.id}
                      type="button"
                      onClick={() => {
                        setActiveStage(processo.etapa);
                        openAnalysisModal(processo);
                      }}
                      className="p-4 text-left transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{processo.produtor}</p>
                          <p className="mt-1 text-xs" style={{ color: COLORS.textLight }}>{processo.memorando}</p>
                        </div>
                        <span className="rounded-full px-2 py-1 text-[11px] font-semibold" style={{ backgroundColor: "#FEF0C7", color: COLORS.warning }}>
                          {STAGE_LABELS[processo.etapa]}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: days !== null && days <= 1 ? COLORS.danger : COLORS.textLight }}>
                        <Clock3 size={14} />
                        <span>Prazo: {formatDate(processo.prazo)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <div>
            <section
              className="rounded-lg border shadow-sm"
              style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
            >
              <div className="border-b" style={{ borderBottomColor: COLORS.border }}>
                <div className="flex flex-wrap gap-2 px-4 pt-3 pb-5">
                  {(["chegados", "lancamentos", "baixa"] as AnalysisStage[]).map((stage) => {
                    const isActive = activeStage === stage;
                    return (
                      <button
                        key={stage}
                        type="button"
                        onClick={() => setActiveStage(stage)}
                        className="rounded-md px-3 py-2 text-sm font-medium transition-colors"
                        style={{
                          backgroundColor: isActive ? COLORS.accent : COLORS.background,
                          border: `1px solid ${isActive ? COLORS.accent : COLORS.border}`,
                          color: isActive ? "#FFFFFF" : COLORS.text,
                        }}
                      >
                        {STAGE_LABELS[stage]}
                      </button>
                    );
                  })}
                </div>

                <div className="px-4 pb-4">
                  <h2 className="text-base font-semibold" style={{ color: COLORS.text }}>{getStageListTitle(activeStage)}</h2>
                  <p className="text-xs" style={{ color: COLORS.textLight }}>{STAGE_DESCRIPTIONS[activeStage]}</p>
                </div>
              </div>

              {filteredProcessos.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
                  <FileText size={34} style={{ color: COLORS.textLight }} />
                  <p className="mt-3 text-sm" style={{ color: COLORS.textLight }}>Nenhum processo encontrado para esta lista.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] border-collapse">
                    <thead style={{ backgroundColor: COLORS.background }}>
                      <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Processo</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Produtor</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Memorando</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Recebido</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Prazo</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProcessos.map((processo) => (
                        <tr key={processo.id} className="transition-colors hover:bg-gray-50" style={{ borderTop: `1px solid ${COLORS.border}` }}>
                          <td className="px-4 py-3">
                            <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{processo.protocolo}</p>
                            <p className="text-xs" style={{ color: COLORS.textLight }}>Localidade: {processo.municipio}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm" style={{ color: COLORS.text }}>{processo.produtor}</p>
                            <p className="text-xs tabular-nums" style={{ color: COLORS.textLight }}>{processo.cpf}</p>
                          </td>
                          <td className="px-4 py-3 text-sm" style={{ color: COLORS.textLight }}>{processo.memorando}</td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: COLORS.textLight }}>{formatDateTime(processo.recebidoEm)}</td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: processo.prioridade === "urgente" ? COLORS.warning : COLORS.textLight }}>
                            {formatDate(processo.prazo)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => openAnalysisModal(processo)}
                              className="group rounded-md px-3 py-2 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                              style={{ color: COLORS.primary, border: `1px solid ${COLORS.border}` }}
                              onMouseEnter={(event) => {
                                event.currentTarget.style.backgroundColor = COLORS.accent;
                                event.currentTarget.style.borderColor = COLORS.accent;
                                event.currentTarget.style.color = "#FFFFFF";
                              }}
                              onMouseLeave={(event) => {
                                event.currentTarget.style.backgroundColor = "transparent";
                                event.currentTarget.style.borderColor = COLORS.border;
                                event.currentTarget.style.color = COLORS.primary;
                              }}
                            >
                              Analisar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {selectedProcesso && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-6">
          <div className="absolute inset-0 bg-black/45" onClick={() => setSelectedProcesso(null)} />
          <section
            className="relative flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border shadow-2xl"
            style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
          >
            <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              <div>
                <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Painel de análise</p>
                <h2 className="mt-1 text-lg font-semibold" style={{ color: COLORS.primary }}>{selectedProcesso.protocolo}</h2>
                <p className="mt-1 text-sm" style={{ color: COLORS.textLight }}>{selectedProcesso.produtor}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => togglePriority(selectedProcesso.id)}
                  title={selectedProcesso.prioridade === "urgente" ? "Remover urgência" : "Marcar como urgente"}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  style={{
                    border: `1px solid ${selectedProcesso.prioridade === "urgente" ? "#D92D20" : "#F97066"}`,
                    color: selectedProcesso.prioridade === "urgente" ? "#FFFFFF" : "#B42318",
                    backgroundColor: selectedProcesso.prioridade === "urgente" ? "#D92D20" : "#FEF3F2",
                  }}
                >
                  <AlertTriangle size={14} />
                  {selectedProcesso.prioridade === "urgente" ? "Urgente" : "Marcar urgência"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProcesso(null)}
                  title="Fechar"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-gray-100"
                  style={{ color: COLORS.textLight }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 px-5 py-3" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              {[
                { id: "resumo", label: "Resumo", icon: Mail },
                { id: "documentos", label: "Documentos via e-mail", icon: FileCheck2 },
                { id: "observacoes", label: "Observações", icon: ClipboardList },
                { id: "fluxo", label: "Fluxo", icon: Send },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeModalTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveModalTab(tab.id as AnalysisModalTab)}
                    className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: isActive ? COLORS.accent : COLORS.background,
                      border: `1px solid ${isActive ? COLORS.accent : COLORS.border}`,
                      color: isActive ? "#FFFFFF" : COLORS.text,
                    }}
                  >
                    <Icon size={15} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="overflow-y-auto p-5">
              {activeModalTab === "resumo" && (
                <div className="space-y-4">
                  <div className="rounded-md border p-4" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
                    <div className="flex gap-3">
                      <Mail size={18} style={{ color: COLORS.primary }} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{selectedProcesso.assunto}</p>
                        <p className="mt-1 text-xs break-all" style={{ color: COLORS.textLight }}>{selectedProcesso.emailOrigem}</p>
                        <p className="mt-2 text-xs" style={{ color: COLORS.textLight }}>Recebido em {formatDateTime(selectedProcesso.recebidoEm)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      ["CPF", selectedProcesso.cpf],
                      ["Localidade", selectedProcesso.municipio],
                      ["Memorando", selectedProcesso.memorando],
                      ["Prazo", formatDate(selectedProcesso.prazo)],
                      ["Lista atual", STAGE_LABELS[selectedProcesso.etapa]],
                      ["Prioridade", selectedProcesso.prioridade === "urgente" ? "Urgente" : "Normal"],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-md border px-3 py-2" style={{ borderColor: COLORS.border }}>
                        <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>{label}</p>
                        <p className="mt-1 text-sm" style={{ color: COLORS.text }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-md border p-4" style={{ borderColor: COLORS.border }}>
                    <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Observação</p>
                    <p className="mt-2 text-sm leading-6" style={{ color: COLORS.text }}>{selectedProcesso.observacao}</p>
                  </div>
                </div>
              )}

              {activeModalTab === "documentos" && (
                <div className="space-y-4">
                  <div className="rounded-md border p-4" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
                    <div className="flex gap-3">
                      <Mail size={18} style={{ color: COLORS.primary }} />
                      <div>
                        <h3 className="text-sm font-semibold" style={{ color: COLORS.text }}>Documentos recebidos via e-mail</h3>
                        <p className="mt-1 text-sm" style={{ color: COLORS.textLight }}>
                          Aqui se encontram todos os anexos recebidos via e-mail, incluindo o PDF do processo, o memorando informativo e documentos complementares para análise.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
                    <div className="space-y-2">
                      {selectedProcesso.documentos.map((documento) => {
                        const isActive = selectedDocument?.id === documento.id;
                        return (
                          <button
                            key={documento.id}
                            type="button"
                            onClick={() => setSelectedDocumentId(documento.id)}
                            className="w-full rounded-md border p-3 text-left transition-colors hover:bg-gray-50"
                            style={{
                              borderColor: isActive ? COLORS.accent : COLORS.border,
                              backgroundColor: isActive ? `${COLORS.light}70` : COLORS.card,
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <FileText size={18} style={{ color: isActive ? COLORS.primary : COLORS.textLight }} />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold" style={{ color: COLORS.text }}>{documento.nome}</p>
                                <p className="mt-1 text-xs" style={{ color: COLORS.textLight }}>
                                  {getDocumentTypeLabel(documento.tipo)} · {documento.paginas} pág. · {documento.tamanho}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="min-h-[360px] rounded-md border" style={{ borderColor: COLORS.border }}>
                      {selectedDocument && (
                        <>
                          <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                            <div>
                              <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{selectedDocument.nome}</p>
                              <p className="mt-1 text-xs" style={{ color: COLORS.textLight }}>{selectedDocument.descricao}</p>
                            </div>
                            <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: `${COLORS.light}90`, color: COLORS.primary }}>
                              {getDocumentTypeLabel(selectedDocument.tipo)}
                            </span>
                          </div>

                          <div className="p-4">
                            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-md border border-dashed text-center" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
                              <FileText size={44} style={{ color: COLORS.primary }} />
                              <p className="mt-3 text-sm font-semibold" style={{ color: COLORS.text }}>
                                Prévia do PDF do {getDocumentTypeLabel(selectedDocument.tipo).toLowerCase()}
                              </p>
                              <p className="mt-2 max-w-md text-sm leading-6" style={{ color: COLORS.textLight }}>
                                Aqui fica a visualização do arquivo anexado ao e-mail para o usuário conferir o processo e o memorando antes de movimentar a análise.
                              </p>
                              <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                                <span className="rounded-md px-3 py-2" style={{ backgroundColor: COLORS.card, color: COLORS.textLight, border: `1px solid ${COLORS.border}` }}>
                                  {selectedDocument.paginas} páginas
                                </span>
                                <span className="rounded-md px-3 py-2" style={{ backgroundColor: COLORS.card, color: COLORS.textLight, border: `1px solid ${COLORS.border}` }}>
                                  {selectedDocument.tamanho}
                                </span>
                                <span className="rounded-md px-3 py-2" style={{ backgroundColor: COLORS.card, color: COLORS.textLight, border: `1px solid ${COLORS.border}` }}>
                                  PDF
                                </span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeModalTab === "fluxo" && (
                <div className="space-y-4">
                  <div className="rounded-md border p-4" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
                    <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Mover processo entre listas</p>
                    <p className="mt-1 text-sm" style={{ color: COLORS.textLight }}>
                      A movimentação abaixo organiza o processo visualmente nesta aba de análises.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => updateProcessStage(selectedProcesso.id, "chegados")}
                      className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors hover:bg-gray-50"
                      style={{ border: `1px solid ${COLORS.border}`, color: COLORS.primary }}
                    >
                      <Inbox size={16} />
                      Chegados
                    </button>
                    <button
                      type="button"
                      onClick={() => updateProcessStage(selectedProcesso.id, "lancamentos")}
                      className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors"
                      style={{ backgroundColor: COLORS.info }}
                    >
                      <Send size={16} />
                      Lançamentos
                    </button>
                    <button
                      type="button"
                      onClick={() => updateProcessStage(selectedProcesso.id, "baixa")}
                      className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors"
                      style={{ backgroundColor: COLORS.accent }}
                    >
                      <ArrowDownToLine size={16} />
                      Para baixa
                    </button>
                  </div>

                  {selectedFlowNotice && (
                    <div className="flex gap-2 rounded-md border px-3 py-3 text-sm" style={{ borderColor: "#ABEFC6", backgroundColor: "#ECFDF3", color: COLORS.primary }}>
                      <CheckCircle2 size={18} />
                      <span>
                        {selectedFlowNotice.etapa === "chegados" && "Processo movido para a lista de chegados para análise inicial."}
                        {selectedFlowNotice.etapa === "lancamentos" && "Processo encaminhado para a lista de lançamentos."}
                        {selectedFlowNotice.etapa === "baixa" && "Processo separado para baixa no fluxo de análise."}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {activeModalTab === "observacoes" && (
                <div className="space-y-4">
                  <div className="rounded-md border p-4" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
                    <div className="flex gap-3">
                      <ClipboardList size={18} style={{ color: COLORS.primary }} />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: COLORS.text }}>Registro da análise</p>
                        <p className="mt-1 text-sm" style={{ color: COLORS.textLight }}>
                          Use este espaço para anotar o que foi conferido no PDF do processo, no memorando e nos anexos recebidos por e-mail.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border p-4" style={{ borderColor: COLORS.border }}>
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <label htmlFor="analysis-note" className="text-sm font-semibold" style={{ color: COLORS.text }}>
                        Observação da análise
                      </label>
                      <span className="text-xs" style={{ color: COLORS.textLight }}>
                        {selectedAnalysisNote.length}/500
                      </span>
                    </div>
                    <textarea
                      id="analysis-note"
                      value={selectedAnalysisNote}
                      onChange={(event) => updateAnalysisNote(selectedProcesso.id, event.target.value.slice(0, 500))}
                      rows={7}
                      className="mt-3 w-full resize-none rounded-md px-3 py-2 text-sm outline-none transition-colors focus:ring-2"
                      style={{
                        border: `1px solid ${COLORS.border}`,
                        color: COLORS.text,
                        backgroundColor: COLORS.background,
                      }}
                      placeholder={
                        selectedProcesso.etapa === "chegados"
                          ? "Registre a triagem inicial: e-mail recebido, PDF aberto, memorando conferido, pendências encontradas..."
                          : selectedProcesso.etapa === "lancamentos"
                            ? "Registre o que foi conferido antes do lançamento e qualquer orientação importante..."
                            : "Registre a conferência final, motivo da baixa ou observações de encerramento..."
                      }
                    />
                    <p className="mt-2 text-xs" style={{ color: COLORS.textLight }}>
                      Esta observação fica registrada visualmente nesta tela para acompanhar o que já foi analisado no processo.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
