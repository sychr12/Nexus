"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Search, X } from "lucide-react";
import TopBar from "../sidebar/page";
import { formatDateTime, loadProcessos } from "../fluxo/storage";
import type { MemorandoProcessoRegistro, ProcessoSicpr } from "../fluxo/types";

const COLORS = {
  primary: "#2D452F",
  accent: "#6B9D4A",
  background: "#F5F7F5",
  card: "#FFFFFF",
  text: "#1A2E1B",
  textLight: "#6B7C6A",
  border: "#E2E8E0",
};

const PAGE_SIZE = 50;

type MemorandoResumo = MemorandoProcessoRegistro & {
  processos: ProcessoSicpr[];
  situacao: string;
};

export default function MemorandosAssinadosPage() {
  const router = useRouter();
  const [username, setUsername] = useState("Gerente UNLOC");
  const [processos, setProcessos] = useState<ProcessoSicpr[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<MemorandoResumo | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    const timer = window.setTimeout(() => {
      setUsername(localStorage.getItem("username") || "Gerente UNLOC");
      setProcessos(loadProcessos());
    }, 0);
    return () => window.clearTimeout(timer);
  }, [router]);

  const memorandos = useMemo(() => {
    const grupos = new Map<string, MemorandoResumo>();

    processos.forEach((processo) => {
      processo.memorandos?.forEach((memorando) => {
        const current = grupos.get(memorando.loteId);
        if (current) {
          current.processos.push(processo);
          return;
        }

        grupos.set(memorando.loteId, {
          ...memorando,
          processos: [processo],
          situacao: "Assinado",
        });
      });
    });

    return Array.from(grupos.values()).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }, [processos]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return memorandos.filter((memorando) =>
      !term ||
      memorando.numero.toLowerCase().includes(term) ||
      memorando.unidadeLocal.toLowerCase().includes(term) ||
      memorando.gerenteResponsavel.toLowerCase().includes(term) ||
      memorando.produtores.some((produtor) =>
        produtor.produtor.toLowerCase().includes(term) ||
        produtor.cpf.includes(term),
      ),
    );
  }, [memorandos, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    router.push("/login");
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
      <TopBar onLogout={handleLogout} username={username} />
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: COLORS.primary }}>Memorandos Assinados</h1>
              <p className="text-sm" style={{ color: COLORS.textLight }}>Consulta historica dos memorandos gerados por lote.</p>
            </div>
            <div className="relative lg:w-96">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textLight }} />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Buscar memorando, produtor, CPF, UNLOC ou gerente..."
                className="w-full rounded-md border py-2 pl-9 pr-3 text-sm outline-none"
                style={{ borderColor: COLORS.border }}
              />
            </div>
          </div>

          <section className="rounded-lg border shadow-sm" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
            <div className="overflow-x-auto p-4">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase" style={{ borderBottomColor: COLORS.border, color: COLORS.textLight }}>
                    <th className="px-3 py-2">Memorando</th>
                    <th className="px-3 py-2">Data</th>
                    <th className="px-3 py-2">Quantidade</th>
                    <th className="px-3 py-2">UNLOC</th>
                    <th className="px-3 py-2">Gerente</th>
                    <th className="px-3 py-2">Situacao</th>
                    <th className="px-3 py-2 text-right">Abrir</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((memorando) => (
                    <tr key={memorando.loteId} className="border-b" style={{ borderBottomColor: COLORS.border }}>
                      <td className="px-3 py-3 font-semibold" style={{ color: COLORS.primary }}>{memorando.numero}</td>
                      <td className="px-3 py-3" style={{ color: COLORS.textLight }}>{formatDateTime(memorando.criadoEm)}</td>
                      <td className="px-3 py-3" style={{ color: COLORS.text }}>{memorando.quantidade}</td>
                      <td className="px-3 py-3" style={{ color: COLORS.text }}>{memorando.unidadeLocal}</td>
                      <td className="px-3 py-3" style={{ color: COLORS.text }}>{memorando.gerenteResponsavel}</td>
                      <td className="px-3 py-3" style={{ color: COLORS.text }}>{memorando.situacao}</td>
                      <td className="px-3 py-3 text-right">
                        <button type="button" onClick={() => setSelected(memorando)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold transition-colors hover:bg-[#F5F7F5]" style={{ color: COLORS.primary }}>
                          <Eye size={14} />
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {paged.length === 0 && <div className="py-8 text-center text-sm" style={{ color: COLORS.textLight }}>Nenhum memorando assinado encontrado.</div>}
            </div>
            {filtered.length > PAGE_SIZE && (
              <div className="flex items-center justify-between border-t px-4 py-3 text-sm" style={{ borderTopColor: COLORS.border, color: COLORS.text }}>
                <span>Pagina {page} de {totalPages} | {filtered.length} memorando(s)</span>
                <div className="flex gap-2">
                  <button type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-md px-3 py-1.5 font-semibold disabled:opacity-50" style={{ border: `1px solid ${COLORS.border}` }}>Anterior</button>
                  <button type="button" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="rounded-md px-3 py-1.5 font-semibold disabled:opacity-50" style={{ border: `1px solid ${COLORS.border}` }}>Proxima</button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {selected && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-5">
          <div className="absolute inset-0 bg-black/45" onClick={() => setSelected(null)} />
          <section className="relative flex h-[calc(100vh-2.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-lg border shadow-2xl" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
            <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderBottomColor: COLORS.border }}>
              <div>
                <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Memorando assinado</p>
                <h2 className="mt-1 text-lg font-semibold" style={{ color: COLORS.primary }}>Memorando {selected.numero}</h2>
                <p className="text-sm" style={{ color: COLORS.textLight }}>{selected.quantidade} processo(s) | {selected.unidadeLocal} | {formatDateTime(selected.criadoEm)}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-gray-100" style={{ color: COLORS.textLight }}>
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-5">
              <div className="overflow-hidden rounded-md border" style={{ borderColor: COLORS.border }}>
                <div className="grid grid-cols-[1.4fr_.8fr_.8fr] gap-3 border-b px-3 py-2 text-xs font-semibold uppercase" style={{ borderBottomColor: COLORS.border, color: COLORS.textLight }}>
                  <span>Produtor</span>
                  <span>Tipo</span>
                  <span>Status atual</span>
                </div>
                {selected.produtores.map((produtor) => {
                  const processo = selected.processos.find((item) => item.id === produtor.id);
                  return (
                    <div key={produtor.id} className="grid grid-cols-[1.4fr_.8fr_.8fr] gap-3 border-b px-3 py-2 text-sm last:border-b-0" style={{ borderBottomColor: COLORS.border }}>
                      <span>
                        <span className="block font-semibold" style={{ color: COLORS.text }}>{produtor.produtor}</span>
                        <span className="text-xs" style={{ color: COLORS.textLight }}>{produtor.cpf}</span>
                      </span>
                      <span style={{ color: COLORS.text }}>{produtor.tipoProcesso}</span>
                      <span style={{ color: COLORS.text }}>{processo?.situacao || "-"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
