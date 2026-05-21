"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, FileText, Mail, RotateCcw, Search, X } from "lucide-react";
import { isAdminUser, resolveStoredAuthUser } from "../lib/auth";
import TopBar from "../sidebar/page";
import { EmptyState, MemorandoCard, ProdutorCard } from "./AnaliseCards";
import AnaliseModal from "./AnaliseModal";
import { COLORS, HOVER_LIFT, HOVER_SOFT, INITIAL_MEMORANDOS, STATUS_DESCRIPTIONS, STATUS_LABELS } from "./data";
import {
  emptyFlags,
  getDerivedMemoStatus,
  getNextMemoStatusAfterDecision,
  getProcessoFlags,
  isMemorandoConcluido,
} from "./rules";
import { ANALISES_STORAGE_KEY, appendEncaminhamentos, buildEncaminhamento } from "./storage";
import type {
  AnalysisFlags,
  AnalysisViewMode,
  DispatchTarget,
  MemorandoAnalise,
  MemoStatus,
  ModalScope,
  ModalTab,
  MotivoMemorandoDevolucao,
  MotivoProcessoDevolucao,
  ProcessoProdutor,
  TimelineEvent,
  ViewerKind,
} from "./types";

const STATUS_FILTERS: MemoStatus[] = ["recebido", "em_analise", "finalizado"];

const eventId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const timelineEvent = (usuario: string, acao: string, detalhe?: string, processoId?: number): TimelineEvent => ({
  id: eventId(),
  usuario,
  dataHora: new Date().toISOString(),
  acao,
  detalhe,
  processoId,
});

const normalizeStatus = (status: string | undefined): MemoStatus => {
  if (status === "finalizado" || status === "concluido" || status === "lancamento" || status === "devolucao") return "finalizado";
  if (status === "em_analise") return "em_analise";
  return "recebido";
};

const migrateDecision = (processo: ProcessoProdutor) => {
  if (processo.decisao) return processo.decisao;
  if (processo.encaminhadoPara) return processo.encaminhadoPara;
  if (processo.status === "concluido" && processo.encaminhadoPara) return processo.encaminhadoPara;
  return null;
};

const mergeFlags = (base?: Partial<AnalysisFlags>): AnalysisFlags => ({ ...emptyFlags(), ...base });

const normalizeMotivoText = (motivo?: string) =>
  motivo
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const normalizeProcessoDevolucaoMotivo = (
  motivo?: string,
): MotivoProcessoDevolucao | undefined => {
  if (!motivo) return undefined;

  const normalized = normalizeMotivoText(motivo) || "";

  if (normalized.includes("cpf")) return "CPF divergente";
  if (normalized.includes("cadastro") || normalized.includes("gcc")) return "Cadastro divergente";
  if (normalized.includes("data") || normalized.includes("declaracao vencida")) return "Data invalida";
  if (normalized.includes("ilegivel") || normalized.includes("corrompido")) return "Documento ilegivel";
  if (normalized.includes("falt") || normalized.includes("checklist") || normalized.includes("ausente")) return "Documento ausente";

  return "Documento invalido";
};

const normalizeMemorandoDevolucaoMotivo = (
  motivo?: string,
): MotivoMemorandoDevolucao | undefined => {
  if (!motivo) return undefined;

  const normalized = normalizeMotivoText(motivo) || "";

  if (normalized.includes("ilegivel") || normalized.includes("corrompido")) return "Documento ilegivel";
  if (normalized.includes("assinatura")) return "Assinatura ausente";
  if (normalized.includes("falt") || normalized.includes("ausente")) return "Documento ausente";
  if (normalized.includes("inconsistente") || normalized.includes("divergente")) return "Dados inconsistentes";

  return "Documento invalido";
};

const migrateMemorando = (memorando: MemorandoAnalise): MemorandoAnalise => {
  const processos = memorando.processos.map((processo) => {
    const migrated = {
      ...processo,
      decisao: migrateDecision(processo),
      observacao: processo.observacao || "",
      motivoDevolucao: normalizeProcessoDevolucaoMotivo(processo.motivoDevolucao),
    };
    return {
      ...migrated,
      flags: { ...getProcessoFlags(migrated), ...processo.flags },
    };
  });

  const memorandoDecisao =
    memorando.memorandoDecisao ||
    ((memorando.status as string) === "devolucao" ? "incorreto" : null);

  const status = getNextMemoStatusAfterDecision(processos, memorandoDecisao === "incorreto");

  return {
    ...memorando,
    status: status === "finalizado" ? "finalizado" : normalizeStatus(memorando.status) === "em_analise" ? "em_analise" : "recebido",
    memorandoDecisao,
    motivoDevolucaoMemorando: normalizeMemorandoDevolucaoMotivo(memorando.motivoDevolucaoMemorando),
    observacaoMemorando: memorando.observacaoMemorando || "",
    flags: {
      ...mergeFlags(memorando.flags),
      memorandoInvalido: memorandoDecisao === "incorreto" || Boolean(memorando.flags?.memorandoInvalido),
    },
    timeline: memorando.timeline || [timelineEvent("Sistema", "Memorando recebido", memorando.numero)],
    processos,
  };
};

export default function AnalisesPage() {
  const router = useRouter();
  const [memorandos, setMemorandos] = useState<MemorandoAnalise[]>(() => INITIAL_MEMORANDOS.map(migrateMemorando));
  const [analysisView, setAnalysisView] = useState<AnalysisViewMode>("memorandos");
  const [activeStatus, setActiveStatus] = useState<MemoStatus>("recebido");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMemorandoId, setSelectedMemorandoId] = useState<number | null>(null);
  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null);
  const [modalScope, setModalScope] = useState<ModalScope>("memorando");
  const [activeTab, setActiveTab] = useState<ModalTab>("resumo");
  const [viewerKind, setViewerKind] = useState<ViewerKind>("processo");
  const [flowNotice, setFlowNotice] = useState("");
  const [storageReady, setStorageReady] = useState(false);
  const [username, setUsername] = useState("Usuario");
  const [userRole, setUserRole] = useState("USUARIO");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const timer = window.setTimeout(async () => {
      const savedMemorandos = localStorage.getItem(ANALISES_STORAGE_KEY);
      if (savedMemorandos) {
        try {
          const parsedMemorandos = (JSON.parse(savedMemorandos) as MemorandoAnalise[]).map(migrateMemorando);
          const memorandosNovos = INITIAL_MEMORANDOS.map(migrateMemorando).filter(
            (memorando) => !parsedMemorandos.some((saved) => saved.id === memorando.id),
          );
          setMemorandos([...parsedMemorandos, ...memorandosNovos]);
        } catch {
          localStorage.removeItem(ANALISES_STORAGE_KEY);
        }
      }

      const authUser = await resolveStoredAuthUser("Usuario");

      setStorageReady(true);
      setUsername(authUser.username);
      setUserRole(authUser.role);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem(ANALISES_STORAGE_KEY, JSON.stringify(memorandos));
  }, [memorandos, storageReady]);

  const selectedMemorando = useMemo(
    () => memorandos.find((memorando) => memorando.id === selectedMemorandoId) || null,
    [memorandos, selectedMemorandoId],
  );

  const selectedProcesso = useMemo(
    () => selectedMemorando?.processos.find((processo) => processo.id === selectedProcessId) || selectedMemorando?.processos[0] || null,
    [selectedMemorando, selectedProcessId],
  );

  const isAdmin = isAdminUser(username, userRole);
  const selectedMemorandoLocked = selectedMemorando ? isMemorandoConcluido(selectedMemorando) : false;
  const selectedMemorandoReadOnly = selectedMemorandoLocked && !isAdmin;
  const selectedProcessoLocked = Boolean(selectedProcesso?.decisao && !isAdmin);

  const filteredMemorandos = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const digits = searchTerm.replace(/\D/g, "");

    return memorandos.filter((memorando) => {
      const derivedStatus = getDerivedMemoStatus(memorando);
      const matchesStatus = derivedStatus === activeStatus;
      const matchesSearch =
        !term ||
        memorando.numero.toLowerCase().includes(term) ||
        memorando.titulo.toLowerCase().includes(term) ||
        memorando.localidade.toLowerCase().includes(term) ||
        memorando.processos.some(
          (processo) =>
            processo.produtor.toLowerCase().includes(term) ||
            (digits.length > 0 && processo.cpf.replace(/\D/g, "").includes(digits)),
        );

      return matchesStatus && matchesSearch;
    });
  }, [activeStatus, memorandos, searchTerm]);

  const filteredProdutores = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const digits = searchTerm.replace(/\D/g, "");

    return memorandos.flatMap((memorando) =>
      memorando.processos
        .map((processo) => ({ memorando, processo }))
        .filter(({ memorando: memo, processo }) => {
          const memoStatus = getDerivedMemoStatus(memo);
          const matchesStatus =
            activeStatus === "finalizado"
              ? processo.decisao === "lancamento" || processo.decisao === "devolucao"
              : !processo.decisao && memoStatus === activeStatus;
          const matchesSearch =
            !term ||
            processo.produtor.toLowerCase().includes(term) ||
            memo.numero.toLowerCase().includes(term) ||
            memo.titulo.toLowerCase().includes(term) ||
            memo.localidade.toLowerCase().includes(term) ||
            (digits.length > 0 && processo.cpf.replace(/\D/g, "").includes(digits));

          return matchesStatus && matchesSearch;
        }),
    );
  }, [activeStatus, memorandos, searchTerm]);

  const counts = useMemo(() => {
    const processos = memorandos.flatMap((memorando) => memorando.processos);
    return {
      memorandos: memorandos.length,
      processos: processos.length,
      semDecisao: processos.filter((processo) => !processo.decisao).length,
      lancamentos: processos.filter((processo) => processo.decisao === "lancamento").length,
      devolucoes: processos.filter((processo) => processo.decisao === "devolucao").length,
    };
  }, [memorandos]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("perfil");
    router.push("/login");
  }

  function markMemorandoOpened(memorando: MemorandoAnalise) {
    const now = new Date().toISOString();
    setMemorandos((current) =>
      current.map((item) => {
        if (item.id !== memorando.id) return item;
        if (getDerivedMemoStatus(item) !== "recebido") return item;

        return {
          ...item,
          status: "em_analise",
          abertoPor: username,
          abertoEm: now,
          timeline: [...(item.timeline || []), timelineEvent(username, "Memorando aberto", "Analise iniciada automaticamente.")],
        };
      }),
    );
  }

  function openMemorando(memorando: MemorandoAnalise) {
    markMemorandoOpened(memorando);
    setSelectedMemorandoId(memorando.id);
    setSelectedProcessId(memorando.processos[0]?.id || null);
    setModalScope("memorando");
    setActiveTab("resumo");
    setViewerKind("processo");
    setFlowNotice("");
  }

  function openProcesso(memorando: MemorandoAnalise, processo: ProcessoProdutor, tab: ModalTab = "processos") {
    markMemorandoOpened(memorando);
    setSelectedMemorandoId(memorando.id);
    setSelectedProcessId(processo.id);
    setModalScope("produtor");
    setActiveTab(tab);
    setViewerKind("processo");
    setFlowNotice("");
  }

  function updateSelectedMemorando(updater: (memorando: MemorandoAnalise) => MemorandoAnalise) {
    if (!selectedMemorando) return;
    setMemorandos((current) => current.map((memorando) => (memorando.id === selectedMemorando.id ? updater(memorando) : memorando)));
  }

  function updateProcesso(updater: (processo: ProcessoProdutor) => ProcessoProdutor) {
    if (!selectedMemorando || !selectedProcesso) return;
    if (selectedProcessoLocked) return;

    updateSelectedMemorando((memorando) => ({
      ...memorando,
      processos: memorando.processos.map((processo) =>
        processo.id === selectedProcesso.id ? updater(processo) : processo,
      ),
    }));
  }

  function setMemorandoDecision(decision: "correto" | "incorreto") {
    if (!selectedMemorando || selectedMemorandoReadOnly) return;
    updateSelectedMemorando((memorando) => ({
      ...memorando,
      memorandoDecisao: decision,
      flags: { ...mergeFlags(memorando.flags), memorandoInvalido: decision === "incorreto" },
      timeline: [...(memorando.timeline || []), timelineEvent(username, `Memorando marcado como ${decision}`)],
    }));
    setFlowNotice(decision === "correto" ? "Memorando liberado para analise individual." : "Memorando incorreto: informe motivo e envie tudo para devolucao.");
  }

  function returnWholeMemorando(motivo: MotivoMemorandoDevolucao, observacao: string) {
    if (!selectedMemorando || selectedMemorandoReadOnly) return;
    if (!observacao.trim()) {
      setFlowNotice("Escreva a observacao da devolucao antes de finalizar o memorando.");
      return;
    }
    const now = new Date().toISOString();
    const processos = selectedMemorando.processos.map((processo) => ({
      ...processo,
      decisao: "devolucao" as const,
      motivoDevolucao: motivo as unknown as MotivoProcessoDevolucao,
      observacao: observacao || processo.observacao,
      decisaoResponsavel: username,
      decisaoEm: now,
      encaminhadoPara: "devolucao" as const,
      encaminhadoEm: now,
    }));
    const updatedMemo: MemorandoAnalise = {
      ...selectedMemorando,
      status: "finalizado",
      memorandoDecisao: "incorreto",
      motivoDevolucaoMemorando: motivo,
      observacaoMemorando: observacao,
      memorandoResponsavel: username,
      memorandoAnalisadoEm: now,
      flags: { ...mergeFlags(selectedMemorando.flags), memorandoInvalido: true },
      processos,
      timeline: [
        ...(selectedMemorando.timeline || []),
        timelineEvent(username, "Memorando devolvido integralmente", `${motivo}${observacao ? ` - ${observacao}` : ""}`),
      ],
    };

    appendEncaminhamentos("devolucao", processos.map((processo) => buildEncaminhamento(updatedMemo, processo, "devolucao", now)));
    setMemorandos((current) => current.map((memorando) => (memorando.id === selectedMemorando.id ? updatedMemo : memorando)));
    setActiveStatus("finalizado");
    setFlowNotice("Memorando finalizado e todos os produtores enviados para Devolucao.");
  }

  function updateProcessoField<K extends keyof ProcessoProdutor>(field: K, value: ProcessoProdutor[K]) {
    updateProcesso((processo) => ({
      ...processo,
      [field]: value,
      flags: getProcessoFlags({ ...processo, [field]: value }),
    }));
  }

  function updateObservation(value: string) {
    updateProcesso((processo) => ({
      ...processo,
      observacao: value.slice(0, 500),
      observacaoAtualizadaEm: value.trim() ? new Date().toISOString() : undefined,
    }));
    if (value.trim()) {
      updateSelectedMemorando((memorando) => ({
        ...memorando,
        timeline: [...(memorando.timeline || []), timelineEvent(username, "Observacao adicionada", selectedProcesso?.produtor, selectedProcesso?.id)],
      }));
    }
  }

  function decideProcesso(target: DispatchTarget, motivo?: MotivoProcessoDevolucao, observacao?: string) {
    if (!selectedMemorando || !selectedProcesso || selectedProcessoLocked) return;
    if (selectedMemorando.memorandoDecisao === "incorreto" && !isAdmin) return;
    if (target === "devolucao" && !observacao?.trim()) {
      setFlowNotice("Escreva o motivo detalhado da devolucao antes de confirmar.");
      return;
    }
    const now = new Date().toISOString();
    const nextProcesso = {
      ...selectedProcesso,
      decisao: target,
      motivoDevolucao: target === "devolucao" ? motivo : undefined,
      observacao: observacao ?? selectedProcesso.observacao,
      decisaoResponsavel: username,
      decisaoEm: now,
      encaminhadoPara: target,
      encaminhadoEm: now,
    };

    const processos = selectedMemorando.processos.map((processo) => (processo.id === selectedProcesso.id ? nextProcesso : processo));
    const nextStatus = getNextMemoStatusAfterDecision(processos);
    const updatedMemo: MemorandoAnalise = {
      ...selectedMemorando,
      status: nextStatus,
      processos,
      timeline: [
        ...(selectedMemorando.timeline || []),
        timelineEvent(
          username,
          target === "lancamento" ? "Lancamento realizado" : "Devolucao realizada",
          target === "lancamento" ? selectedProcesso.produtor : `${selectedProcesso.produtor} - ${motivo || "Sem motivo"}`,
          selectedProcesso.id,
        ),
      ],
    };

    appendEncaminhamentos(target, [buildEncaminhamento(updatedMemo, nextProcesso, target, now)]);
    setMemorandos((current) => current.map((memorando) => (memorando.id === selectedMemorando.id ? updatedMemo : memorando)));
    setActiveStatus("finalizado");
    setFlowNotice(target === "lancamento" ? "Produtor encaminhado automaticamente para Lancamentos." : "Produtor encaminhado automaticamente para Devolucao.");
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
      <TopBar onLogout={handleLogout} username={username} />

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: COLORS.primary }}>Analises</h1>
              <p className="text-sm" style={{ color: COLORS.textLight }}>
                Conferencia rapida, decisao direta e encaminhamento automatico.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative sm:w-96">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textLight }} />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar por memorando, produtor, CPF ou localidade..."
                  className="w-full rounded-md py-2 pl-9 pr-3 text-sm outline-none"
                  style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                />
              </div>

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-white ${HOVER_SOFT}`}
                  style={{ border: `1px solid ${COLORS.border}`, color: COLORS.primary }}
                >
                  <X size={16} />
                  Limpar
                </button>
              )}
            </div>
          </div>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { label: "Memorandos", value: counts.memorandos, icon: Mail, color: COLORS.primary },
              { label: "Processos", value: counts.processos, icon: FileText, color: COLORS.info },
              { label: "Sem decisao", value: counts.semDecisao, icon: AlertTriangle, color: COLORS.warning },
              { label: "Lancamentos", value: counts.lancamentos, icon: CheckCircle2, color: COLORS.accent },
              { label: "Devolucoes", value: counts.devolucoes, icon: RotateCcw, color: COLORS.danger },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className={`rounded-lg border p-4 shadow-sm ${HOVER_LIFT}`} style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
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

          <section className="rounded-lg border shadow-sm" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
            <div className="border-b" style={{ borderBottomColor: COLORS.border }}>
              <div className="flex flex-wrap gap-2 px-4 pt-3">
                {[
                  { value: "memorandos" as AnalysisViewMode, label: "Memorandos", icon: Mail },
                  { value: "produtores" as AnalysisViewMode, label: "Produtores", icon: FileText },
                ].map((view) => {
                  const Icon = view.icon;
                  const isActive = analysisView === view.value;
                  return (
                    <button
                      key={view.value}
                      type="button"
                      onClick={() => setAnalysisView(view.value)}
                      className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${HOVER_LIFT}`}
                      style={{
                        backgroundColor: isActive ? COLORS.primary : COLORS.background,
                        border: `1px solid ${isActive ? COLORS.primary : COLORS.border}`,
                        color: isActive ? "#FFFFFF" : COLORS.text,
                      }}
                    >
                      <Icon size={16} />
                      {view.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-2 px-4 pb-5 pt-3">
                {STATUS_FILTERS.map((status) => {
                  const isActive = activeStatus === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setActiveStatus(status)}
                      className={`rounded-md px-3 py-2 text-sm font-medium ${HOVER_LIFT}`}
                      style={{
                        backgroundColor: isActive ? COLORS.accent : COLORS.background,
                        border: `1px solid ${isActive ? COLORS.accent : COLORS.border}`,
                        color: isActive ? "#FFFFFF" : COLORS.text,
                      }}
                    >
                      {STATUS_LABELS[status]}
                    </button>
                  );
                })}
              </div>

              <div className="px-4 pb-4">
                <h2 className="text-base font-semibold" style={{ color: COLORS.text }}>
                  {analysisView === "memorandos" ? STATUS_LABELS[activeStatus] : `Produtores em ${STATUS_LABELS[activeStatus].toLowerCase()}`}
                </h2>
                <p className="text-xs" style={{ color: COLORS.textLight }}>
                  {analysisView === "memorandos"
                    ? STATUS_DESCRIPTIONS[activeStatus]
                    : "Pesquisa individual por produtor, CPF ou memorando mantendo o vinculo com o lote."}
                </p>
              </div>
            </div>

            {analysisView === "memorandos" ? (
              filteredMemorandos.length === 0 ? (
                <EmptyState message="Nenhum memorando encontrado nesta lista." />
              ) : (
                <div className="flex max-w-full gap-4 overflow-x-auto overscroll-x-contain p-4 pb-5">
                  {filteredMemorandos.map((memorando) => (
                    <MemorandoCard key={memorando.id} memorando={memorando} onOpen={openMemorando} />
                  ))}
                </div>
              )
            ) : filteredProdutores.length === 0 ? (
              <EmptyState message="Nenhum produtor encontrado nesta lista." />
            ) : (
              <div className="flex max-w-full gap-3 overflow-x-auto overscroll-x-contain p-4 pb-5">
                {filteredProdutores.map(({ memorando, processo }) => (
                  <ProdutorCard
                    key={`${memorando.id}-${processo.id}`}
                    memorando={memorando}
                    processo={processo}
                    onOpen={openProcesso}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {selectedMemorando && (
        <AnaliseModal
          selectedMemorando={selectedMemorando}
          selectedProcesso={selectedProcesso}
          modalScope={modalScope}
          activeTab={activeTab}
          viewerKind={viewerKind}
          flowNotice={flowNotice}
          isAdmin={isAdmin}
          selectedMemorandoReadOnly={selectedMemorandoReadOnly}
          selectedProcessoLocked={selectedProcessoLocked}
          onClose={() => setSelectedMemorandoId(null)}
          onTabChange={setActiveTab}
          onSelectProcesso={setSelectedProcessId}
          onViewerKindChange={setViewerKind}
          onSetMemorandoDecision={setMemorandoDecision}
          onReturnMemorando={returnWholeMemorando}
          onUpdateDeclarationDate={(value) => updateProcessoField("dataDeclaracao", value)}
          onUpdateObservation={updateObservation}
          onDecideProcesso={decideProcesso}
        />
      )}
    </div>
  );
}
