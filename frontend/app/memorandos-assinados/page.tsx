"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Eye, FileText, History, Link2, Paperclip, Search, X } from "lucide-react";
import Sidebar from "../sidebar/page";
import { useAuthSession } from "../hooks/useAuthSession";
import {
  SITUACAO_LABELS,
  STATUS_COLORS,
  formatDateTime,
  getDocumentosGerados,
  getFacAssinada,
  getOutrosDocumentos,
  loadProcessos,
} from "../fluxo/storage";
import type { MemorandoProcessoRegistro, ProcessoSicpr } from "../fluxo/types";

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

const PAGE_SIZE = 50;

type MemorandoCentralStatus =
  | "todos"
  | "em_elaboracao"
  | "assinado"
  | "em_analise"
  | "devolvido"
  | "reencaminhado"
  | "aprovado"
  | "lancado"
  | "cancelado";

const STATUS_FILTERS: Array<{ key: MemorandoCentralStatus; label: string }> = [
  { key: "todos", label: "Todos" },
  { key: "em_elaboracao", label: "Em elaboração" },
  { key: "assinado", label: "Assinado" },
  { key: "em_analise", label: "Em análise" },
  { key: "devolvido", label: "Devolvido" },
  { key: "reencaminhado", label: "Reencaminhado" },
  { key: "aprovado", label: "Aprovado" },
  { key: "lancado", label: "Lançado" },
  { key: "cancelado", label: "Cancelado" },
];

const STATUS_META: Record<Exclude<MemorandoCentralStatus, "todos">, { label: string; className: string }> = {
  em_elaboracao: { label: "Em elaboração", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  assinado: { label: "Assinado", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  em_analise: { label: "Em análise", className: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
  devolvido: { label: "Devolvido", className: "bg-red-50 text-red-700 ring-red-200" },
  reencaminhado: { label: "Reencaminhado", className: "bg-orange-50 text-orange-700 ring-orange-200" },
  aprovado: { label: "Aprovado", className: "bg-purple-50 text-purple-700 ring-purple-200" },
  lancado: { label: "Lançado", className: "bg-slate-50 text-slate-700 ring-slate-200" },
  cancelado: { label: "Cancelado", className: "bg-zinc-100 text-zinc-700 ring-zinc-200" },
};

type MemorandoResumo = MemorandoProcessoRegistro & {
  processos: ProcessoSicpr[];
  status: Exclude<MemorandoCentralStatus, "todos">;
  ultimaMovimentacao: string;
  tecnicos: string[];
  relacionadoAnterior?: string;
  sucessor?: string;
  cadeiaSucessao: string[];
};

export default function MemorandosAssinadosPage() {
  const { username, logout, ready } = useAuthSession({ defaultUsername: "Gerente UNLOC" });
  const [processos, setProcessos] = useState<ProcessoSicpr[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<MemorandoCentralStatus>("todos");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<MemorandoResumo | null>(null);
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

  const memorandos = useMemo(() => buildMemorandos(processos), [processos]);
  const statusCounts = useMemo(() => {
    const counts = new Map<MemorandoCentralStatus, number>();
    STATUS_FILTERS.forEach((filter) => counts.set(filter.key, 0));
    counts.set("todos", memorandos.length);
    memorandos.forEach((memorando) => counts.set(memorando.status, (counts.get(memorando.status) || 0) + 1));
    return counts;
  }, [memorandos]);

  const filtered = useMemo(() => {
    const term = normalize(search);
    return memorandos.filter((memorando) => {
      if (statusFilter !== "todos" && memorando.status !== statusFilter) return false;
      if (!term) return true;

      const searchable = [
        memorando.numero,
        memorando.unidadeLocal,
        memorando.gerenteResponsavel,
        memorando.tecnicos.join(" "),
        memorando.relacionadoAnterior || "",
        memorando.sucessor || "",
        ...memorando.produtores.flatMap((produtor) => [produtor.produtor, produtor.cpf, produtor.tipoProcesso]),
        ...memorando.processos.flatMap((processo) => [
          processo.produtor,
          processo.cpf,
          processo.unidadeLocal,
          processo.tecnicoResponsavel,
          processo.gerenteResponsavel || "",
          processo.documentosGerados?.fac?.municipio || "",
          processo.documentosGerados?.fac?.comunidade || "",
        ]),
      ].join(" ");

      return normalize(searchable).includes(term);
    });
  }, [memorandos, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function applyStatusFilter(nextStatus: MemorandoCentralStatus) {
    setStatusFilter(nextStatus);
    setPage(1);
  }

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
        username={username || "Gerente UNLOC"}
        onCollapsedChange={setSidebarCollapsed}
      />

      <main
        className="transition-all duration-300 min-h-screen"
        style={{ marginLeft: sidebarCollapsed ? '72px' : '260px' }}
      >
        <div className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: COLORS.primary }}>Central de Memorandos</h1>
                <p className="text-sm" style={{ color: COLORS.textLight }}>
                  Repositório oficial de consulta, auditoria e rastreabilidade dos memorandos do SICPR.
                </p>
              </div>
              <div className="relative lg:w-96">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textLight }} />
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Buscar memorando, produtor, CPF, município..."
                  className="w-full rounded-md border py-2 pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-green-500"
                  style={{ borderColor: COLORS.border }}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => applyStatusFilter(filter.key)}
                  className="rounded-lg border px-3 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{
                    backgroundColor: statusFilter === filter.key ? COLORS.primary : COLORS.card,
                    borderColor: statusFilter === filter.key ? COLORS.primary : COLORS.border,
                    color: statusFilter === filter.key ? "#FFFFFF" : COLORS.text,
                  }}
                >
                  <span className="block text-xs font-semibold uppercase opacity-80">{filter.label}</span>
                  <span className="mt-1 block text-xl font-bold">{statusCounts.get(filter.key) || 0}</span>
                </button>
              ))}
            </div>

            <section className="rounded-lg border shadow-sm" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
              <div className="overflow-x-auto p-4">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase" style={{ borderBottomColor: COLORS.border, color: COLORS.textLight }}>
                      <th className="px-3 py-2">Memorando</th>
                      <th className="px-3 py-2">Data</th>
                      <th className="px-3 py-2">UNLOC</th>
                      <th className="px-3 py-2">Gerente</th>
                      <th className="px-3 py-2">Processos</th>
                      <th className="px-3 py-2">Produtores</th>
                      <th className="px-3 py-2">Situação</th>
                      <th className="px-3 py-2">Última movimentação</th>
                      <th className="px-3 py-2 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((memorando) => (
                      <tr key={memorando.loteId} className="border-b align-top" style={{ borderBottomColor: COLORS.border }}>
                        <td className="px-3 py-3 font-semibold" style={{ color: COLORS.primary }}>{memorando.numero}</td>
                        <td className="px-3 py-3" style={{ color: COLORS.textLight }}>{formatDateTime(memorando.criadoEm)}</td>
                        <td className="px-3 py-3" style={{ color: COLORS.text }}>{memorando.unidadeLocal}</td>
                        <td className="px-3 py-3" style={{ color: COLORS.text }}>{memorando.gerenteResponsavel || "-"}</td>
                        <td className="px-3 py-3" style={{ color: COLORS.text }}>{memorando.processos.length}</td>
                        <td className="px-3 py-3" style={{ color: COLORS.text }}>{memorando.produtores.length}</td>
                        <td className="px-3 py-3">
                          <StatusBadge status={memorando.status} />
                        </td>
                        <td className="px-3 py-3" style={{ color: COLORS.textLight }}>{formatDateTime(memorando.ultimaMovimentacao)}</td>
                        <td className="px-3 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelected(memorando)}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold transition-colors hover:bg-[#F5F7F5]"
                            style={{ color: COLORS.primary }}
                          >
                            <Eye size={14} />
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {paged.length === 0 && (
                  <div className="py-8 text-center text-sm" style={{ color: COLORS.textLight }}>
                    Nenhum memorando encontrado.
                  </div>
                )}
              </div>
              {filtered.length > PAGE_SIZE && (
                <div className="flex items-center justify-between border-t px-4 py-3 text-sm" style={{ borderTopColor: COLORS.border, color: COLORS.text }}>
                  <span>Página {page} de {totalPages} | {filtered.length} memorando(s)</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={page === 1}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      className="rounded-md px-3 py-1.5 font-semibold disabled:opacity-50 transition-colors hover:bg-gray-100"
                      style={{ border: `1px solid ${COLORS.border}` }}
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      disabled={page === totalPages}
                      onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                      className="rounded-md px-3 py-1.5 font-semibold disabled:opacity-50 transition-colors hover:bg-gray-100"
                      style={{ border: `1px solid ${COLORS.border}` }}
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {selected && <MemorandoDetailModal memorando={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// Componente Modal de Detalhe (mantido igual, mas com seção -> div)
function MemorandoDetailModal({ memorando, onClose }: { memorando: MemorandoResumo; onClose: () => void }) {
  const devolucoes = getDevolucoes(memorando);
  const historicoGeral = getHistoricoGeral(memorando);
  const documentosPorProdutor = getDocumentsByProducer(memorando);
  const reenvios = Math.max(0, memorando.cadeiaSucessao.length - 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-5">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative flex h-[calc(100vh-2.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-lg border shadow-2xl" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderBottomColor: COLORS.border }}>
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Central de Memorandos</p>
            <h2 className="mt-1 text-lg font-semibold" style={{ color: COLORS.primary }}>Memorando {memorando.numero}</h2>
            <p className="text-sm" style={{ color: COLORS.textLight }}>
              UNLOC: {memorando.unidadeLocal} | Gerente: {memorando.gerenteResponsavel || "-"} | Data: {formatDateTime(memorando.criadoEm)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-gray-100" style={{ color: COLORS.textLight }}>
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-5">
          {/* Conteúdo do modal permanece o mesmo, apenas substituindo section por div */}
          <div className="rounded-lg border p-4" style={{ borderColor: COLORS.border }}>
            <p className="mb-3 text-sm font-semibold uppercase" style={{ color: COLORS.primary }}>Resumo do memorando</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <InfoCard label="Número" value={memorando.numero} />
              <InfoCard label="UNLOC" value={memorando.unidadeLocal} />
              <InfoCard label="Gerente" value={memorando.gerenteResponsavel || "-"} />
              <InfoCard label="Status atual" value={STATUS_META[memorando.status].label} badge={<StatusBadge status={memorando.status} />} />
              <InfoCard label="Processos" value={String(memorando.processos.length)} />
              <InfoCard label="Produtores" value={String(memorando.produtores.length)} />
              <InfoCard label="Data de criação" value={formatDateTime(memorando.criadoEm)} />
              <InfoCard label="Última movimentação" value={formatDateTime(memorando.ultimaMovimentacao)} />
              <InfoCard label="Devoluções" value={String(devolucoes.length)} />
              <InfoCard label="Reenvios" value={String(reenvios)} />
              <InfoCard label="Código de validação" value={memorando.assinatura?.codigoValidacao || "-"} />
            </div>
          </div>

          {/* Sucessão de memorandos */}
          <div className="mt-5 rounded-lg border p-4" style={{ borderColor: COLORS.border }}>
            <p className="mb-3 inline-flex items-center gap-2 font-semibold" style={{ color: COLORS.text }}>
              <Link2 size={16} /> Sucessão de memorandos
            </p>
            <SuccessionChain memorando={memorando} />
          </div>

          {/* Lista de produtores */}
          <div className="mt-5 rounded-lg border p-4" style={{ borderColor: COLORS.border }}>
            <p className="mb-3 inline-flex items-center gap-2 font-semibold" style={{ color: COLORS.text }}>
              <FileText size={16} /> Lista de produtores
            </p>
            <div className="overflow-hidden rounded-md border" style={{ borderColor: COLORS.border }}>
              <div className="grid grid-cols-[1.4fr_.9fr_.9fr_.9fr_.9fr] gap-3 border-b px-3 py-2 text-xs font-semibold uppercase" style={{ borderBottomColor: COLORS.border, color: COLORS.textLight }}>
                <span>Nome</span>
                <span>CPF</span>
                <span>Município</span>
                <span>Tipo</span>
                <span>Situação individual</span>
              </div>
              {memorando.produtores.map((produtor) => {
                const processo = memorando.processos.find((item) => item.id === produtor.id);
                return (
                  <div key={produtor.id} className="grid grid-cols-[1.4fr_.9fr_.9fr_.9fr_.9fr] gap-3 border-b px-3 py-2 text-sm last:border-b-0" style={{ borderBottomColor: COLORS.border }}>
                    <span className="font-semibold" style={{ color: COLORS.text }}>{produtor.produtor}</span>
                    <span style={{ color: COLORS.textLight }}>{produtor.cpf}</span>
                    <span style={{ color: COLORS.text }}>{processo?.documentosGerados?.fac?.municipio || processo?.unidadeLocal || "-"}</span>
                    <span style={{ color: COLORS.text }}>{produtor.tipoProcesso}</span>
                    <span>{processo ? <span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_COLORS[processo.situacao]}`}>{SITUACAO_LABELS[processo.situacao]}</span> : "-"}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Histórico geral */}
          <div className="mt-5 rounded-lg border p-4" style={{ borderColor: COLORS.border }}>
            <p className="mb-3 inline-flex items-center gap-2 font-semibold" style={{ color: COLORS.text }}>
              <History size={16} /> Histórico geral do memorando
            </p>
            <div className="space-y-3">
              {historicoGeral.map((item, idx) => (
                <div key={`${item.acao}-${item.dataHora}-${idx}`} className="grid grid-cols-[18px_1fr] gap-3 text-sm">
                  <span className={`mt-1 h-3 w-3 rounded-full ring-4 ${getAuditDotClass(item.acao)}`} />
                  <div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-semibold" style={{ color: COLORS.text }}>{item.acao}</span>
                      <span style={{ color: COLORS.textLight }}>{formatDateTime(item.dataHora)}</span>
                    </div>
                    <p className="mt-0.5" style={{ color: COLORS.textLight }}>{item.usuario}{item.observacao ? ` | ${item.observacao}` : ""}</p>
                  </div>
                </div>
              ))}
              {historicoGeral.length === 0 && <p className="text-sm" style={{ color: COLORS.textLight }}>Nenhum evento institucional registrado.</p>}
            </div>
          </div>

          {/* Histórico individual dos produtores */}
          <div className="mt-5 rounded-lg border p-4" style={{ borderColor: COLORS.border }}>
            <p className="mb-3 font-semibold" style={{ color: COLORS.text }}>Histórico individual dos produtores</p>
            <div className="grid gap-3">
              {memorando.processos.map((processo) => (
                <ProducerTimeline key={processo.id} processo={processo} />
              ))}
            </div>
          </div>

          {/* Devoluções */}
          {devolucoes.length > 0 && (
            <div className="mt-5 rounded-lg border p-4" style={{ borderColor: COLORS.border }}>
              <p className="mb-3 font-semibold" style={{ color: COLORS.text }}>Controle de devoluções</p>
              <div className="overflow-x-auto rounded-md border" style={{ borderColor: COLORS.border }}>
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase" style={{ borderBottomColor: COLORS.border, color: COLORS.textLight }}>
                      <th className="px-3 py-2">Produtor</th>
                      <th className="px-3 py-2">Data</th>
                      <th className="px-3 py-2">Responsável</th>
                      <th className="px-3 py-2">Motivo</th>
                      <th className="px-3 py-2">Observação</th>
                      <th className="px-3 py-2">Situação atual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devolucoes.map((devolucao, idx) => (
                      <tr key={`${devolucao.processo.id}-${idx}`} className="border-b last:border-b-0" style={{ borderBottomColor: COLORS.border }}>
                        <td className="px-3 py-2 font-semibold" style={{ color: COLORS.text }}>{devolucao.processo.produtor}</td>
                        <td className="px-3 py-2" style={{ color: COLORS.textLight }}>{formatDateTime(devolucao.evento.dataHora)}</td>
                        <td className="px-3 py-2" style={{ color: COLORS.text }}>{devolucao.evento.usuario}</td>
                        <td className="px-3 py-2" style={{ color: COLORS.text }}>{getDevolucaoMotivo(devolucao.evento.observacao)}</td>
                        <td className="px-3 py-2" style={{ color: COLORS.textLight }}>{devolucao.evento.observacao || "-"}</td>
                        <td className="px-3 py-2"><span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_COLORS[devolucao.processo.situacao]}`}>{SITUACAO_LABELS[devolucao.processo.situacao]}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Documentos */}
          <div className="mt-5 rounded-lg border p-4" style={{ borderColor: COLORS.border }}>
            <p className="mb-3 inline-flex items-center gap-2 font-semibold" style={{ color: COLORS.text }}>
              <Paperclip size={16} /> Documentos
            </p>
            <div className="grid gap-3">
              {documentosPorProdutor.map((grupo) => (
                <details key={grupo.processo.id} className="rounded-md border bg-white" style={{ borderColor: COLORS.border }}>
                  <summary className="cursor-pointer px-4 py-3 font-semibold" style={{ color: COLORS.text }}>
                    {grupo.processo.produtor}
                    <span className="ml-2 text-xs font-normal" style={{ color: COLORS.textLight }}>{grupo.items.length} documento(s)</span>
                  </summary>
                  <div className="grid gap-2 border-t px-4 py-3 sm:grid-cols-2 lg:grid-cols-3" style={{ borderTopColor: COLORS.border }}>
                    {grupo.items.map((item, idx) => (
                      <div key={`${grupo.processo.id}-${item.label}-${idx}`} className="rounded bg-[#F5F7F5] px-3 py-2 text-sm">
                        <p className="font-semibold" style={{ color: COLORS.text }}>{item.label}</p>
                        <p className="truncate text-xs" style={{ color: COLORS.textLight }}>{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Funções auxiliares (permanecem iguais)
function buildMemorandos(processos: ProcessoSicpr[]): MemorandoResumo[] {
  const grupos = new Map<string, MemorandoResumo>();

  processos.forEach((processo) => {
    const memorandos = processo.memorandos?.length ? processo.memorandos : getLegacyMemorando(processo);
    memorandos.forEach((memorando) => {
      const current = grupos.get(memorando.loteId);
      if (current) {
        addProcessoToMemorando(current, processo, memorando);
        return;
      }

      grupos.set(memorando.loteId, {
        ...memorando,
        produtores: [...memorando.produtores],
        processos: [processo],
        status: getCentralStatus([processo], memorando),
        ultimaMovimentacao: getLastMovement([processo], memorando),
        tecnicos: unique([processo.tecnicoResponsavel]),
        cadeiaSucessao: [memorando.numero],
      });
    });
  });

  const memorandos = Array.from(grupos.values())
    .map((memorando) => ({
      ...memorando,
      status: getCentralStatus(memorando.processos, memorando),
      ultimaMovimentacao: getLastMovement(memorando.processos, memorando),
      tecnicos: unique(memorando.processos.map((p) => p.tecnicoResponsavel)),
    }))
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));

  memorandos.forEach((memorando) => {
    memorando.relacionadoAnterior = findRelatedPrevious(memorando, memorandos);
    memorando.sucessor = findSuccessor(memorando, memorandos);
    memorando.cadeiaSucessao = buildSuccessionChain(memorando, memorandos);
  });

  return memorandos;
}

function addProcessoToMemorando(target: MemorandoResumo, processo: ProcessoSicpr, memorando: MemorandoProcessoRegistro) {
  if (!target.processos.some((item) => item.id === processo.id)) {
    target.processos.push(processo);
  }
  memorando.produtores.forEach((produtor) => {
    if (!target.produtores.some((item) => item.id === produtor.id)) {
      target.produtores.push(produtor);
    }
  });
}

function getLegacyMemorando(processo: ProcessoSicpr): MemorandoProcessoRegistro[] {
  if (!processo.memorandoNumero || !processo.memorandoLoteId) return [];

  return [{
    loteId: processo.memorandoLoteId,
    numero: processo.memorandoNumero,
    arquivo: processo.memorandoArquivo || `Memorando ${processo.memorandoNumero}.pdf`,
    criadoEm: processo.memorandoCriadoEm || processo.gerenteAssinadoEm || processo.enviadoAnaliseEm || processo.criadoEm,
    gerenteResponsavel: processo.gerenteResponsavel || "-",
    unidadeLocal: processo.unidadeLocal,
    quantidade: processo.memorandoQuantidade || 1,
    produtores: processo.memorandoProdutores || [{ id: processo.id, produtor: processo.produtor, cpf: processo.cpf, tipoProcesso: processo.tipoProcesso }],
    assinatura: processo.assinaturaEletronica,
  }];
}

function getCentralStatus(processos: ProcessoSicpr[], memorando: MemorandoProcessoRegistro): Exclude<MemorandoCentralStatus, "todos"> {
  const situacoes = processos.map((processo) => processo.situacao);
  if (situacoes.some((situacao) => situacao === "concluido")) return "lancado";
  if (situacoes.some((situacao) => situacao === "aprovado_lancamento")) return "aprovado";
  if (situacoes.some((situacao) => situacao === "devolvido_analise" || situacao === "devolvido_gerente")) return "devolvido";
  if (situacoes.some((situacao) => situacao === "em_analise")) return "em_analise";
  if (memorando.assinatura || processos.some((processo) => processo.assinaturaEletronica)) return "assinado";
  if (situacoes.some((situacao) => situacao === "encaminhado_gerente" || situacao === "aprovado_gerente")) return "em_elaboracao";
  return "em_elaboracao";
}

function getLastMovement(processos: ProcessoSicpr[], memorando: MemorandoProcessoRegistro) {
  const dates = [
    memorando.criadoEm,
    ...processos.flatMap((processo) => [
      processo.encaminhadoGerenteEm,
      processo.gerenteAssinadoEm,
      processo.enviadoAnaliseEm,
      processo.analisadoEm,
      processo.lancadoEm,
      ...processo.historico.map((item) => item.dataHora),
    ]),
  ].filter(Boolean) as string[];

  return dates.sort((a, b) => b.localeCompare(a))[0] || memorando.criadoEm;
}

function findRelatedPrevious(memorando: MemorandoResumo, memorandos: MemorandoResumo[]) {
  const producerIds = new Set(memorando.produtores.map((produtor) => produtor.id));
  return memorandos.find((candidate) =>
    candidate.criadoEm < memorando.criadoEm &&
    candidate.loteId !== memorando.loteId &&
    candidate.produtores.some((produtor) => producerIds.has(produtor.id))
  )?.numero;
}

function findSuccessor(memorando: MemorandoResumo, memorandos: MemorandoResumo[]) {
  const producerIds = new Set(memorando.produtores.map((produtor) => produtor.id));
  return memorandos.find((candidate) =>
    candidate.criadoEm > memorando.criadoEm &&
    candidate.loteId !== memorando.loteId &&
    candidate.produtores.some((produtor) => producerIds.has(produtor.id))
  )?.numero;
}

function buildSuccessionChain(memorando: MemorandoResumo, memorandos: MemorandoResumo[]) {
  const producerIds = new Set(memorando.produtores.map((produtor) => produtor.id));
  return memorandos
    .filter((candidate) =>
      candidate.loteId === memorando.loteId ||
      candidate.produtores.some((produtor) => producerIds.has(produtor.id))
    )
    .sort((a, b) => a.criadoEm.localeCompare(b.criadoEm))
    .map((item) => item.numero);
}

function getAuditoria(memorando: MemorandoResumo) {
  const events = memorando.processos.flatMap((processo) =>
    processo.historico.map((item) => ({
      ...item,
      observacao: [processo.produtor, item.observacao].filter(Boolean).join(" | "),
    }))
  );

  const baseEvents = [
    {
      id: `${memorando.loteId}-memorando`,
      usuario: "Sistema",
      acao: "Memorando gerado",
      dataHora: memorando.criadoEm,
      observacao: `${memorando.numero} | ${memorando.quantidade} processo(s)`,
    },
    ...(memorando.assinatura ? [{
      id: `${memorando.loteId}-assinatura`,
      usuario: memorando.assinatura.gerenteNome,
      acao: "Assinado eletronicamente",
      dataHora: memorando.assinatura.assinadaEm,
      observacao: memorando.assinatura.codigoValidacao,
    }] : []),
  ];

  return [...baseEvents, ...events].sort((a, b) => a.dataHora.localeCompare(b.dataHora));
}

function getHistoricoGeral(memorando: MemorandoResumo) {
  const institutionalActions = [
    "memorando gerado",
    "assinado eletronicamente",
    "encaminhado para analise",
    "recebido pela analise",
    "aprovado",
    "encaminhado para lancamento",
    "lancado",
    "cancelado",
  ];

  return uniqueBy(
    getAuditoria(memorando).filter((item) => {
      const action = normalize(item.acao);
      return institutionalActions.some((institutionalAction) => action.includes(institutionalAction));
    }),
    (item) => `${normalize(item.acao)}-${item.dataHora}`
  );
}

function getDevolucoes(memorando: MemorandoResumo) {
  return memorando.processos.flatMap((processo) =>
    processo.historico
      .filter((item) => normalize(item.acao).includes("devolvido"))
      .map((evento) => ({ processo, evento }))
  );
}

function getDocumentsByProducer(memorando: MemorandoResumo) {
  return memorando.processos.map((processo) => {
    const generated = getDocumentosGerados(processo).map((doc) => ({ label: doc.nome, detail: doc.arquivo }));
    const attachments = [
      ...(getFacAssinada(processo) ? [getFacAssinada(processo)!] : []),
      ...getOutrosDocumentos(processo),
    ].map((doc) => ({ label: doc.nome, detail: doc.arquivo }));

    return {
      processo,
      items: uniqueBy([...generated, ...attachments], (item) => `${item.label}-${item.detail}`),
    };
  });
}

function StatusBadge({ status }: { status: Exclude<MemorandoCentralStatus, "todos"> }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_META[status].className}`}>
      {STATUS_META[status].label}
    </span>
  );
}

function InfoCard({ label, value, badge }: { label: string; value: string; badge?: ReactNode }) {
  return (
    <div className="rounded-md border px-3 py-2" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
      <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>{label}</p>
      <div className="mt-1 text-sm font-semibold" style={{ color: COLORS.text }}>{badge || value}</div>
    </div>
  );
}

function SuccessionChain({ memorando }: { memorando: MemorandoResumo }) {
  if (memorando.cadeiaSucessao.length <= 1) {
    return <p className="text-sm" style={{ color: COLORS.textLight }}>Sem memorandos relacionados registrados.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {memorando.cadeiaSucessao.map((numero, index) => (
        <span key={`${numero}-${index}`} className="inline-flex items-center gap-2">
          <span
            className="rounded-md border px-3 py-2 font-semibold"
            style={{
              borderColor: numero === memorando.numero ? COLORS.accent : COLORS.border,
              backgroundColor: numero === memorando.numero ? `${COLORS.accent}18` : COLORS.background,
              color: COLORS.text,
            }}
          >
            {numero}
          </span>
          {index < memorando.cadeiaSucessao.length - 1 && (
            <span className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>
              {index === 0 ? "Devolução parcial" : "Reencaminhamento"}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

function ProducerTimeline({ processo }: { processo: ProcessoSicpr }) {
  return (
    <details className="rounded-md border bg-white" style={{ borderColor: COLORS.border }}>
      <summary className="cursor-pointer px-4 py-3 font-semibold" style={{ color: COLORS.text }}>
        {processo.produtor}
        <span className="ml-2 text-xs font-normal" style={{ color: COLORS.textLight }}>{processo.historico.length} evento(s)</span>
      </summary>
      <div className="space-y-3 border-t px-4 py-3" style={{ borderTopColor: COLORS.border }}>
        {processo.historico.map((item, idx) => (
          <div key={item.id || idx} className="grid grid-cols-[18px_1fr] gap-3 text-sm">
            <span className={`mt-1 h-3 w-3 rounded-full ring-4 ${getAuditDotClass(item.acao)}`} />
            <div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-semibold" style={{ color: COLORS.text }}>{item.acao}</span>
                <span style={{ color: COLORS.textLight }}>{formatDateTime(item.dataHora)}</span>
              </div>
              {item.observacao && <p className="mt-0.5" style={{ color: COLORS.textLight }}>{item.observacao}</p>}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

function getDevolucaoMotivo(observacao?: string) {
  if (!observacao) return "-";
  return observacao.split("|")[0]?.trim() || observacao;
}

function getAuditDotClass(acao: string) {
  const value = normalize(acao);
  if (value.includes("devolvido")) return "bg-red-500 ring-red-100";
  if (value.includes("assinado") || value.includes("aprovado") || value.includes("lancado")) return "bg-emerald-500 ring-emerald-100";
  if (value.includes("encaminhado")) return "bg-amber-500 ring-amber-100";
  return "bg-slate-400 ring-slate-100";
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function uniqueBy<T>(values: T[], getKey: (value: T) => string) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = getKey(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}