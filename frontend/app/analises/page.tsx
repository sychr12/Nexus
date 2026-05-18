"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowDownToLine, ClipboardList, FileText, Mail, Search, X } from "lucide-react";
import TopBar from "../sidebar/page";
import { EmptyState, MemorandoCard, ProdutorCard } from "./AnaliseCards";
import AnaliseModal from "./AnaliseModal";
import {
  COLORS,
  HOVER_LIFT,
  HOVER_SOFT,
  INITIAL_MEMORANDOS,
  STATUS_DESCRIPTIONS,
  STATUS_LABELS,
} from "./data";
import {
  getMemorandoChecklist,
  getMemorandoSummary,
  getNextMemoStatusAfterCompletion,
  getProcessoStatus,
  hasMemorandoIssue,
  isMemorandoConcluido,
} from "./rules";
import { ANALISES_STORAGE_KEY, appendEncaminhamentos, buildEncaminhamento } from "./storage";
import type {
  AnalysisViewMode,
  ChecklistStatus,
  DispatchTarget,
  MemorandoAnalise,
  MemoStatus,
  ModalScope,
  ModalTab,
  PendingFlowAction,
  ProcessoProdutor,
  ProducerStatus,
  ViewerKind,
} from "./types";

const STATUS_FILTERS: MemoStatus[] = ["recebido", "em_analise", "lancamento", "devolucao", "concluido"];

const migrateMemorando = (memorando: MemorandoAnalise): MemorandoAnalise => ({
  ...memorando,
  status: (memorando.status as string) === "pendencia" ? "em_analise" : memorando.status,
  processos: memorando.processos.map((processo) => ({
    ...processo,
    status: (processo.status as string) === "pendencia" ? "pendente" : processo.status,
  })),
});

export default function AnalisesPage() {
  const router = useRouter();
  const [memorandos, setMemorandos] = useState<MemorandoAnalise[]>(INITIAL_MEMORANDOS);
  const [analysisView, setAnalysisView] = useState<AnalysisViewMode>("memorandos");
  const [activeStatus, setActiveStatus] = useState<MemoStatus>("recebido");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMemorandoId, setSelectedMemorandoId] = useState<number | null>(null);
  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null);
  const [modalScope, setModalScope] = useState<ModalScope>("memorando");
  const [activeTab, setActiveTab] = useState<ModalTab>("resumo");
  const [viewerKind, setViewerKind] = useState<ViewerKind>("processo");
  const [flowNotice, setFlowNotice] = useState("");
  const [pendingFlowAction, setPendingFlowAction] = useState<PendingFlowAction | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [username, setUsername] = useState("Usuario");
  const [userRole, setUserRole] = useState("USUARIO");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const timer = window.setTimeout(() => {
      const savedMemorandos = localStorage.getItem(ANALISES_STORAGE_KEY);
      if (savedMemorandos) {
        try {
          const parsedMemorandos = (JSON.parse(savedMemorandos) as MemorandoAnalise[]).map(migrateMemorando);
          const memorandosNovos = INITIAL_MEMORANDOS.filter(
            (memorando) => !parsedMemorandos.some((saved) => saved.id === memorando.id),
          );
          setMemorandos([...parsedMemorandos, ...memorandosNovos]);
        } catch {
          localStorage.removeItem(ANALISES_STORAGE_KEY);
        }
      }

      const savedUsername = localStorage.getItem("username") || "Usuario";
      const savedRole =
        localStorage.getItem("role") ||
        localStorage.getItem("perfil") ||
        (savedUsername.toLowerCase() === "admin" ? "ADMIN" : "USUARIO");

      setStorageReady(true);
      setUsername(savedUsername);
      setUserRole(savedRole);
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

  const isAdmin = username.toLowerCase() === "admin" || userRole.toUpperCase() === "ADMIN";
  const selectedMemorandoLocked = selectedMemorando ? isMemorandoConcluido(selectedMemorando) : false;
  const selectedMemorandoReadOnly = selectedMemorandoLocked && !isAdmin;
  const selectedProcessoLockedByConclusion = selectedProcesso ? getProcessoStatus(selectedProcesso) === "concluido" : false;
  const selectedProcessoLocked = selectedProcessoLockedByConclusion && !isAdmin;

  const filteredMemorandos = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const digits = searchTerm.replace(/\D/g, "");

    return memorandos.filter((memorando) => {
      const summary = getMemorandoSummary(memorando);
      const isConcludedMemo = isMemorandoConcluido(memorando);
      const matchesStatus =
        isConcludedMemo
          ? activeStatus === "concluido"
          : activeStatus === "devolucao"
            ? summary.devolucoes > 0 || memorando.status === "devolucao"
            : activeStatus === "lancamento"
              ? memorando.status === "lancamento"
              : activeStatus === "concluido"
                ? false
                : memorando.status === activeStatus;

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

    return memorandos.flatMap((memorando) => {
      const isConcludedMemo = isMemorandoConcluido(memorando);

      return memorando.processos
        .map((processo) => {
          const producerStatus = getProcessoStatus(processo);
          return { memorando, processo, producerStatus, isConcludedMemo };
        })
        .filter(({ memorando: memo, processo, producerStatus, isConcludedMemo: concluded }) => {
          const matchesStatus =
            concluded
              ? activeStatus === "concluido"
              : activeStatus === "concluido"
                ? producerStatus === "concluido"
                : activeStatus === "lancamento"
                  ? producerStatus === "apto" || memo.status === "lancamento"
                  : activeStatus === "devolucao"
                    ? producerStatus === "devolucao" || memo.status === "devolucao"
                    : memo.status === activeStatus;

          const matchesSearch =
            !term ||
            processo.produtor.toLowerCase().includes(term) ||
            memo.numero.toLowerCase().includes(term) ||
            memo.titulo.toLowerCase().includes(term) ||
            memo.localidade.toLowerCase().includes(term) ||
            (digits.length > 0 && processo.cpf.replace(/\D/g, "").includes(digits));

          return matchesStatus && matchesSearch;
        });
    });
  }, [activeStatus, memorandos, searchTerm]);

  const counts = useMemo(() => {
    const processos = memorandos.flatMap((memorando) => memorando.processos);
    return {
      memorandos: memorandos.length,
      processos: processos.length,
      aConferir: processos.filter((processo) => getProcessoStatus(processo) === "pendente").length,
      devolucoes: processos.filter((processo) => getProcessoStatus(processo) === "devolucao").length,
      observacoes: processos.filter((processo) => processo.observacao.trim()).length,
    };
  }, [memorandos]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("perfil");
    router.push("/login");
  }

  function openMemorando(memorando: MemorandoAnalise) {
    setSelectedMemorandoId(memorando.id);
    setSelectedProcessId(memorando.processos[0]?.id || null);
    setModalScope("memorando");
    setActiveTab("resumo");
    setViewerKind("processo");
    setFlowNotice("");
    setPendingFlowAction(null);
  }

  function openProcesso(memorando: MemorandoAnalise, processo: ProcessoProdutor, tab: ModalTab = "processos") {
    setSelectedMemorandoId(memorando.id);
    setSelectedProcessId(processo.id);
    setModalScope("produtor");
    setActiveTab(tab);
    setViewerKind("processo");
    setFlowNotice("");
    setPendingFlowAction(null);
  }

  function applyMemorandoStatus(status: MemoStatus, notice?: string) {
    if (!selectedMemorando) return;

    setMemorandos((current) =>
      current.map((memorando) =>
        memorando.id === selectedMemorando.id ? { ...memorando, status } : memorando,
      ),
    );
    setActiveStatus(status);
    setFlowNotice(notice || `Memorando movido para ${STATUS_LABELS[status].toLowerCase()}.`);
    setPendingFlowAction(null);
  }

  function completeProcessos(target: DispatchTarget) {
    if (!selectedMemorando) return;

    const targetStatus: ProducerStatus = target === "lancamento" ? "apto" : "devolucao";
    const now = new Date().toISOString();
    const encaminhamentos = selectedMemorando.processos
      .filter((processo) => getProcessoStatus(processo) === targetStatus)
      .map((processo) => buildEncaminhamento(selectedMemorando, processo, target, now));
    const processos = selectedMemorando.processos.map((processo) =>
      getProcessoStatus(processo) === targetStatus
        ? {
            ...processo,
            status: "concluido" as ProducerStatus,
            encaminhadoPara: target,
            encaminhadoEm: now,
          }
        : processo,
    );
    const completedCount = processos.filter((processo) => processo.encaminhadoEm === now).length;
    const nextStatus = getNextMemoStatusAfterCompletion(processos);

    setMemorandos((current) =>
      current.map((memorando) =>
        memorando.id === selectedMemorando.id ? { ...memorando, status: nextStatus, processos } : memorando,
      ),
    );

    appendEncaminhamentos(target, encaminhamentos);
    setActiveStatus(completedCount > 0 ? "concluido" : nextStatus);
    setActiveTab("fluxo");
    setFlowNotice(
      target === "lancamento"
        ? `${completedCount} produtor(es) enviado(s) para a aba Lançamentos do sistema e concluído(s) na análise.`
        : `${completedCount} produtor(es) enviado(s) para a aba Devolução do sistema e concluído(s) na análise.`,
    );
    setPendingFlowAction(null);
  }

  function completeSelectedProcesso(target: DispatchTarget) {
    if (!selectedMemorando || !selectedProcesso) return;
    if (selectedProcessoLocked) {
      setFlowNotice(`${selectedProcesso.produtor} já está concluído(a) e não pode ser alterado(a).`);
      setPendingFlowAction(null);
      return;
    }

    const now = new Date().toISOString();
    const encaminhamento = buildEncaminhamento(selectedMemorando, selectedProcesso, target, now);
    const processos = selectedMemorando.processos.map((processo) =>
      processo.id === selectedProcesso.id
        ? {
            ...processo,
            status: "concluido" as ProducerStatus,
            encaminhadoPara: target,
            encaminhadoEm: now,
          }
        : processo,
    );
    const nextStatus = getNextMemoStatusAfterCompletion(processos);

    setMemorandos((current) =>
      current.map((memorando) =>
        memorando.id === selectedMemorando.id ? { ...memorando, status: nextStatus, processos } : memorando,
      ),
    );

    appendEncaminhamentos(target, [encaminhamento]);
    setActiveStatus("concluido");
    setActiveTab("fluxo");
    setFlowNotice(
      target === "lancamento"
        ? `${selectedProcesso.produtor} foi enviado(a) para a aba Lançamentos e concluído(a) na análise.`
        : `${selectedProcesso.produtor} foi enviado(a) para a aba Devolução e concluído(a) na análise.`,
    );
    setPendingFlowAction(null);
  }

  function requestProcessoStatus(status: MemoStatus) {
    if (!selectedProcesso) return;

    setFlowNotice("");
    if (selectedProcessoLocked) {
      setFlowNotice(`${selectedProcesso.produtor} já está concluído(a) e não pode ser alterado(a).`);
      setPendingFlowAction(null);
      return;
    }

    const producerStatus = getProcessoStatus(selectedProcesso);

    if (status === "em_analise") {
      setFlowNotice(`${selectedProcesso.produtor} permanece em análise.`);
      setPendingFlowAction(null);
      return;
    }

    if (status === "lancamento") {
      if (producerStatus !== "apto") {
        setPendingFlowAction({
          title: "Lançamento bloqueado",
          message: `${selectedProcesso.produtor} ainda não está apto para lançamento. Revise documentos, declaração e conferência no sistema de consulta antes de encaminhar este produtor.`,
          confirmLabel: "Entendi",
          tone: "warning",
        });
        return;
      }

      setPendingFlowAction({
        title: "Enviar produtor para lançamento?",
        message: `${selectedProcesso.produtor} está apto. Ao confirmar, somente este produtor será enviado para a aba Lançamentos e concluído na análise.`,
        confirmLabel: "Enviar produtor",
        completionAction: "lancamento_produtor",
        tone: "info",
      });
      return;
    }

    if (status === "devolucao") {
      if (producerStatus !== "devolucao") {
        setPendingFlowAction({
          title: "Devolução não se aplica",
          message: `${selectedProcesso.produtor} não está classificado para devolução. Só envie para devolução quando a análise indicar documento faltando ou inválido, data inconsistente, declaração vencida na chegada ou divergência que precise retornar à unidade local.`,
          confirmLabel: "Entendi",
          tone: "warning",
        });
        return;
      }

      setPendingFlowAction({
        title: "Enviar produtor para devolução?",
        message: `${selectedProcesso.produtor} será enviado para a aba Devolução com o memorando vinculado. Os demais produtores do lote não serão alterados.`,
        confirmLabel: "Enviar para devolução",
        completionAction: "devolucao_produtor",
        tone: "danger",
      });
    }
  }

  function requestMemorandoStatus(status: MemoStatus) {
    if (!selectedMemorando) return;

    if (modalScope === "produtor") {
      requestProcessoStatus(status);
      return;
    }

    if (selectedMemorandoLocked) {
      setFlowNotice("Este lote já foi concluído e não pode ser alterado.");
      setPendingFlowAction(null);
      return;
    }

    setFlowNotice("");
    const summary = getMemorandoSummary(selectedMemorando);
    const divergencia = selectedMemorando.processos.length !== selectedMemorando.produtoresInformados;
    const memorandoComItemFaltando = hasMemorandoIssue(selectedMemorando);
    const bloqueiosProcessos = summary.pendentes + summary.devolucoes;
    const bloqueios = bloqueiosProcessos + (memorandoComItemFaltando ? 1 : 0);
    const resumoFluxo = `${summary.aptos} apto(s), ${summary.pendentes} a conferir e ${summary.devolucoes} para devolução`;

    if (status === "lancamento" && memorandoComItemFaltando && bloqueiosProcessos === 0 && !divergencia) {
      setPendingFlowAction({
        title: "Memorando com item faltando",
        message: `Os ${summary.aptos} processo(s) estão aptos, mas o memorando ainda tem item pendente no checklist. Revise assinatura, carimbo ou cópia vinculada antes de encaminhar para lançamentos.`,
        confirmLabel: "Entendi",
        tone: "warning",
      });
      return;
    }

    if (status === "lancamento" && (divergencia || bloqueios > 0)) {
      setPendingFlowAction({
        title: summary.aptos > 0 ? "Enviar somente os aptos?" : "Lançamento bloqueado",
        message:
          summary.aptos > 0
            ? `Este lote não pode ir inteiro para lançamento. Existem ${summary.aptos} produtor(es) apto(s) e ${bloqueiosProcessos} que ainda não podem seguir. Ao confirmar, apenas os aptos serão separados para lançamento e o memorando continuará em análise para concluir os demais.`
            : "Nenhum produtor está apto para lançamento. Conclua as análises a conferir ou separe as devoluções antes de seguir.",
        confirmLabel: summary.aptos > 0 ? "Separar aptos e manter em análise" : "Manter em análise",
        completionAction: "lancamento_aptos",
        notice:
          summary.aptos > 0
            ? `${summary.aptos} produtor(es) apto(s) separado(s) para lançamento. ${bloqueiosProcessos} produtor(es) continuam em análise neste memorando.`
            : "Memorando mantido em análise porque ainda não há produtor apto para lançamento.",
        tone: "warning",
      });
      return;
    }

    if (status === "devolucao" && summary.devolucoes === 0) {
      setPendingFlowAction({
        title: "Ação não válida",
        message: `Existem 0 produtores para devolução. Este memorando possui ${resumoFluxo}. A devolução não se aplica porque nenhum processo foi classificado para devolução.`,
        confirmLabel: "Entendi",
        tone: "warning",
      });
      return;
    }

    if (status === "devolucao" && summary.devolucoes < summary.total) {
      setPendingFlowAction({
        title: "Separar devoluções?",
        message: `Existe(m) ${summary.devolucoes} produtor(es) para devolução. Os demais não devem ir junto: ${summary.aptos} apto(s) e ${summary.pendentes} a conferir. A ação separa apenas as devoluções e mantém o memorando em análise para acompanhar o restante.`,
        confirmLabel: "Separar devoluções",
        completionAction: "devolucao_processos",
        notice: `${summary.devolucoes} processo(s) separado(s) para devolução. Os demais processos continuam no acompanhamento do memorando.`,
        tone: "danger",
      });
      return;
    }

    if (status === "lancamento") {
      completeProcessos("lancamento");
      return;
    }

    if (status === "devolucao") {
      completeProcessos("devolucao");
      return;
    }

    applyMemorandoStatus(status);
  }

  function updateProcesso(updater: (processo: ProcessoProdutor) => ProcessoProdutor) {
    if (!selectedMemorando || !selectedProcesso) return;
    if (selectedProcessoLocked) return;

    setMemorandos((current) =>
      current.map((memorando) =>
        memorando.id === selectedMemorando.id
          ? {
              ...memorando,
              processos: memorando.processos.map((processo) =>
                processo.id === selectedProcesso.id ? updater(processo) : processo,
              ),
            }
          : memorando,
      ),
    );
  }

  function updateChecklist(itemName: string, status: ChecklistStatus) {
    updateProcesso((processo) => ({
      ...processo,
      checklist: processo.checklist.map((item) => (item.nome === itemName ? { ...item, status } : item)),
    }));
  }

  function updateMemorandoChecklist(itemName: string, status: ChecklistStatus) {
    if (!selectedMemorando) return;
    if (selectedMemorandoReadOnly) return;

    setMemorandos((current) =>
      current.map((memorando) =>
        memorando.id === selectedMemorando.id
          ? {
              ...memorando,
              memorandoChecklist: getMemorandoChecklist(memorando).map((item) =>
                item.nome === itemName ? { ...item, status } : item,
              ),
            }
          : memorando,
      ),
    );
  }

  function updateProcessoField<K extends keyof ProcessoProdutor>(field: K, value: ProcessoProdutor[K]) {
    updateProcesso((processo) => ({
      ...processo,
      [field]: value,
    }));
  }

  function updateObservation(value: string) {
    updateProcesso((processo) => ({
      ...processo,
      observacao: value.slice(0, 500),
      observacaoAtualizadaEm: value.trim() ? new Date().toISOString() : undefined,
    }));
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
      <TopBar onLogout={handleLogout} username={username} />

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: COLORS.primary }}>Análises</h1>
              <p className="text-sm" style={{ color: COLORS.textLight }}>
                Analise memorandos recebidos por e-mail e os processos vinculados a cada produtor.
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
              { label: "A conferir", value: counts.aConferir, icon: AlertTriangle, color: COLORS.warning },
              { label: "Devoluções", value: counts.devolucoes, icon: ArrowDownToLine, color: COLORS.danger },
              { label: "Observações", value: counts.observacoes, icon: ClipboardList, color: COLORS.accent },
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
                    : "Pesquisa individual por produtor, CPF ou memorando mantendo o vínculo com o lote recebido por e-mail."}
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
                {filteredProdutores.map(({ memorando, processo, producerStatus }) => (
                  <ProdutorCard
                    key={`${memorando.id}-${processo.id}`}
                    memorando={memorando}
                    processo={processo}
                    producerStatus={producerStatus}
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
          pendingFlowAction={pendingFlowAction}
          flowNotice={flowNotice}
          isAdmin={isAdmin}
          selectedMemorandoReadOnly={selectedMemorandoReadOnly}
          selectedProcessoLocked={selectedProcessoLocked}
          onClose={() => setSelectedMemorandoId(null)}
          onTabChange={setActiveTab}
          onSelectProcesso={setSelectedProcessId}
          onViewerKindChange={setViewerKind}
          onUpdateMemorandoChecklist={updateMemorandoChecklist}
          onUpdateChecklist={updateChecklist}
          onUpdateProcessoField={updateProcessoField}
          onUpdateDeclarationDate={(value) => updateProcesso((processo) => ({ ...processo, dataDeclaracao: value }))}
          onUpdateObservation={updateObservation}
          onRequestStatus={requestMemorandoStatus}
          onApplyMemorandoStatus={applyMemorandoStatus}
          onCompleteProcessos={completeProcessos}
          onCompleteSelectedProcesso={completeSelectedProcesso}
          onCancelPendingFlow={() => setPendingFlowAction(null)}
        />
      )}
    </div>
  );
}
