"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Eye, FileText, History, Link2, Paperclip, Search, X } from "lucide-react";
import Sidebar from "@/app/_components/layout/Sidebar";
import { useClientMounted } from "@/app/_hooks/useClientMounted";
import { useAuthSession } from "@/app/_hooks/useAuthSession";
import {
  SITUACAO_LABELS,
  STATUS_COLORS,
  formatDateTime,
} from "@/app/_features/fluxo/storage";
import type { ProcessoSicpr } from "@/app/_features/fluxo/types";
import {
  COLORS,
  PAGE_SIZE,
  STATUS_FILTERS,
  STATUS_META,
  getAuditDotClass,
  getDevolucaoMotivo,
  getDevolucoes,
  getDocumentsByProducer,
  getHistoricoGeral,
} from "./memorandos-data";
import type { MemorandoCentralPage, MemorandoCentralStatus, MemorandoResumo } from "./memorandos-data";
import { centralMemorandosService } from "./services/central-memorandos.service";

export default function MemorandosAssinadosPage() {
  const { username, role, logout, ready } = useAuthSession({
    defaultUsername: "Administrador",
    allowedRoles: ["ADMIN", "GERENTE"],
  });
  const mounted = useClientMounted();
  const [data, setData] = useState<MemorandoCentralPage | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<MemorandoCentralStatus>("todos");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<MemorandoResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!ready || !mounted) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      void centralMemorandosService
        .listar({ search, status: statusFilter, page, size: PAGE_SIZE })
        .then((response) => {
          if (!active) return;
          setData(response);
        })
        .catch((err) => {
          if (!active) return;
          setError(err instanceof Error ? err.message : "Não foi possível carregar a Central de Memorandos.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [ready, mounted, page, search, statusFilter]);

  const statusCounts = data?.statusCounts || {};
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.page || page;
  const paged = data?.items || [];
  const total = data?.total || 0;

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
        username={username || "Gerente de Unidade Local"}
        role={role}
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
                  <span className="mt-1 block text-xl font-bold">{statusCounts[filter.key] || 0}</span>
                </button>
              ))}
            </div>

            {error && (
              <div className="rounded-lg border px-4 py-3 text-sm font-semibold" style={{ borderColor: "#FCA5A5", backgroundColor: "#FEF2F2", color: COLORS.danger }}>
                {error}
              </div>
            )}

            <section className="rounded-lg border shadow-sm" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
              <div className="overflow-x-auto p-4">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase" style={{ borderBottomColor: COLORS.border, color: COLORS.textLight }}>
                      <th className="px-3 py-2">Memorando</th>
                      <th className="px-3 py-2">Data</th>
                      <th className="px-3 py-2">Unidade Local</th>
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
                {loading && (
                  <div className="py-8 text-center text-sm" style={{ color: COLORS.textLight }}>
                    Carregando memorandos...
                  </div>
                )}
                {!loading && paged.length === 0 && (
                  <div className="py-8 text-center text-sm" style={{ color: COLORS.textLight }}>
                    Nenhum memorando encontrado.
                  </div>
                )}
              </div>
              {total > PAGE_SIZE && (
                <div className="flex items-center justify-between border-t px-4 py-3 text-sm" style={{ borderTopColor: COLORS.border, color: COLORS.text }}>
                  <span>Página {currentPage} de {totalPages} | {total} memorando(s)</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setPage(Math.max(1, currentPage - 1))}
                      className="rounded-md px-3 py-1.5 font-semibold disabled:opacity-50 transition-colors hover:bg-gray-100"
                      style={{ border: `1px solid ${COLORS.border}` }}
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
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
              Unidade Local: {memorando.unidadeLocal} | Gerente: {memorando.gerenteResponsavel || "-"} | Data: {formatDateTime(memorando.criadoEm)}
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
              <InfoCard label="Unidade Local" value={memorando.unidadeLocal} />
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
