"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Eye, FileText, RotateCcw, Search, X } from "lucide-react";
import TopBar from "../sidebar/page";

const COLORS = {
  primary: "#2D452F",
  background: "#F5F7F5",
  card: "#FFFFFF",
  text: "#1A2E1B",
  textLight: "#6B7C6A",
  border: "#E2E8E0",
  danger: "#B42318",
  warning: "#B54708",
};

const STORAGE_KEY = "sicpr-analises-devolucoes";

interface EncaminhamentoAnalise {
  id: string;
  memorandoNumero: string;
  memorandoTitulo: string;
  memorandoPdf: string;
  produtor: string;
  cpf: string;
  localidade: string;
  processoPdf: string;
  declaracaoPdf: string;
  tipoIdentificado: string;
  resultadoConsulta: string;
  dataDeclaracao: string;
  recebidoEm: string;
  encaminhadoEm: string;
  observacao: string;
}

type ViewerKind = "processo" | "declaracao" | "memorando";

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR");
};

const formatTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

export default function DevolucaoPage() {
  const router = useRouter();
  const [username, setUsername] = useState("Usuário");
  const [items, setItems] = useState<EncaminhamentoAnalise[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<EncaminhamentoAnalise | null>(null);
  const [viewerKind, setViewerKind] = useState<ViewerKind>("processo");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const timer = window.setTimeout(() => {
      setUsername(localStorage.getItem("username") || "Usuário");
      try {
        setItems(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as EncaminhamentoAnalise[]);
      } catch {
        setItems([]);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [router]);

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const digits = searchTerm.replace(/\D/g, "");
    if (!term && !digits) return items;

    return items.filter(
      (item) =>
        item.produtor.toLowerCase().includes(term) ||
        item.memorandoNumero.toLowerCase().includes(term) ||
        item.localidade.toLowerCase().includes(term) ||
        (digits.length > 0 && item.cpf.replace(/\D/g, "").includes(digits)),
    );
  }, [items, searchTerm]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    router.push("/login");
  }

  function openViewer(item: EncaminhamentoAnalise, kind: ViewerKind) {
    setSelectedItem(item);
    setViewerKind(kind);
  }

  const selectedFile =
    selectedItem && viewerKind === "processo"
      ? selectedItem.processoPdf
      : selectedItem && viewerKind === "declaracao"
        ? selectedItem.declaracaoPdf
        : selectedItem?.memorandoPdf;

  const selectedFileLabel =
    viewerKind === "processo" ? "Processo" : viewerKind === "declaracao" ? "Declaração" : "Memorando";

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
      <TopBar onLogout={handleLogout} username={username} />

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: COLORS.primary }}>Devolução</h1>
              <p className="text-sm" style={{ color: COLORS.textLight }}>
                Processos com erro, documento faltando, data inconsistente ou divergência encaminhados pela análise.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative sm:w-96">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textLight }} />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar por produtor, CPF, memorando ou localidade..."
                  className="w-full rounded-md py-2 pl-9 pr-3 text-sm outline-none"
                  style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                />
              </div>

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-white"
                  style={{ border: `1px solid ${COLORS.border}`, color: COLORS.primary }}
                >
                  <X size={16} />
                  Limpar
                </button>
              )}
            </div>
          </div>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "Para devolução", value: items.length, icon: RotateCcw, color: COLORS.danger },
              { label: "Memorandos", value: new Set(items.map((item) => item.memorandoNumero)).size, icon: FileText, color: COLORS.primary },
              { label: "Filtrados", value: filteredItems.length, icon: AlertTriangle, color: COLORS.warning },
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

          <section className="rounded-lg border shadow-sm" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
            <div className="border-b px-4 py-3" style={{ borderBottomColor: COLORS.border }}>
              <h2 className="text-base font-semibold" style={{ color: COLORS.text }}>Processos encaminhados</h2>
              <p className="text-xs" style={{ color: COLORS.textLight }}>Cada devolução mantém processo, declaração e memorando vinculados.</p>
            </div>

            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
                <RotateCcw size={34} style={{ color: COLORS.textLight }} />
                <p className="mt-3 text-sm" style={{ color: COLORS.textLight }}>Nenhum processo encaminhado para devolução.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[1150px] w-full text-left text-sm">
                  <thead style={{ backgroundColor: COLORS.background, color: COLORS.textLight }}>
                    <tr>
                      {["Produtor", "CPF", "Memorando", "Localidade", "Motivo técnico", "Observação", "Encaminhado", "Arquivos"].map((header) => (
                        <th key={header} className="px-4 py-3 text-xs font-semibold uppercase">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="border-t align-top" style={{ borderTopColor: COLORS.border }}>
                        <td className="px-4 py-4 font-semibold" style={{ color: COLORS.text }}>{item.produtor}</td>
                        <td className="px-4 py-4" style={{ color: COLORS.textLight }}>{item.cpf}</td>
                        <td className="px-4 py-4" style={{ color: COLORS.text }}>{item.memorandoNumero}</td>
                        <td className="px-4 py-4" style={{ color: COLORS.textLight }}>{item.localidade}</td>
                        <td className="px-4 py-4" style={{ color: COLORS.danger }}>{item.resultadoConsulta}</td>
                        <td className="max-w-[260px] px-4 py-4" style={{ color: COLORS.textLight }}>
                          {item.observacao || "Sem observação registrada na análise."}
                        </td>
                        <td className="px-4 py-4" style={{ color: COLORS.textLight }}>
                          {formatDate(item.encaminhadoEm)} às {formatTime(item.encaminhadoEm)}
                        </td>
                        <td className="px-4 py-4" style={{ color: COLORS.textLight }}>
                          <div className="space-y-1 text-xs">
                            {[
                              { kind: "processo" as ViewerKind, file: item.processoPdf },
                              { kind: "declaracao" as ViewerKind, file: item.declaracaoPdf },
                              { kind: "memorando" as ViewerKind, file: item.memorandoPdf },
                            ].map((arquivo) => (
                              <button
                                key={arquivo.kind}
                                type="button"
                                onClick={() => openViewer(item, arquivo.kind)}
                                title={`Visualizar ${arquivo.file}`}
                                className="group flex w-full max-w-[280px] items-center gap-2 rounded-md px-2 py-1.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#ECFDF3] hover:shadow-sm"
                                style={{ color: COLORS.textLight }}
                              >
                                <Eye size={14} className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: COLORS.primary }} />
                                <span className="truncate transition-colors group-hover:text-[#2D452F]">{arquivo.file}</span>
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>

      {selectedItem && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-6">
          <div className="absolute inset-0 bg-black/45" onClick={() => setSelectedItem(null)} />
          <section className="relative flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border shadow-2xl" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
            <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              <div>
                <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Visualização de PDF</p>
                <h2 className="mt-1 text-lg font-semibold" style={{ color: COLORS.primary }}>{selectedItem.produtor}</h2>
                <p className="mt-1 text-sm" style={{ color: COLORS.textLight }}>{selectedItem.memorandoNumero} · {selectedItem.localidade}</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                title="Fechar"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-gray-100"
                style={{ color: COLORS.textLight }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 px-5 py-3" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              <span className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold" style={{ backgroundColor: COLORS.background, border: `1px solid ${COLORS.border}`, color: COLORS.primary }}>
                <FileText size={15} />
                {selectedFileLabel}
              </span>
              <span className="min-w-0 truncate text-sm" style={{ color: COLORS.textLight }}>
                {selectedFile}
              </span>
            </div>

            <div className="grid min-h-[520px] grid-cols-1 gap-4 overflow-y-auto p-5 lg:grid-cols-[1fr_280px]">
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-md border border-dashed text-center" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
                <FileText size={56} style={{ color: COLORS.primary }} />
                <p className="mt-3 text-sm font-semibold" style={{ color: COLORS.text }}>{selectedFile}</p>
                <p className="mt-2 max-w-md text-sm leading-6" style={{ color: COLORS.textLight }}>
                  Prévia do PDF de {selectedFileLabel.toLowerCase()} encaminhado pela análise para devolução.
                </p>
              </div>

              <aside className="space-y-3">
                {[
                  ["Produtor", selectedItem.produtor],
                  ["CPF", selectedItem.cpf],
                  ["Memorando", selectedItem.memorandoNumero],
                  ["Motivo técnico", selectedItem.resultadoConsulta],
                  ["Encaminhado", `${formatDate(selectedItem.encaminhadoEm)} às ${formatTime(selectedItem.encaminhadoEm)}`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md border px-3 py-2" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
                    <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>{label}</p>
                    <p className="mt-1 text-sm font-medium" style={{ color: COLORS.text }}>{value}</p>
                  </div>
                ))}

                <div className="rounded-md border px-3 py-2" style={{ borderColor: COLORS.border }}>
                  <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Observação da análise</p>
                  <p className="mt-1 text-sm leading-6" style={{ color: COLORS.text }}>
                    {selectedItem.observacao || "Sem observação registrada na análise."}
                  </p>
                </div>
              </aside>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
