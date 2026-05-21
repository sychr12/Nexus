"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronDown, Eye, FileText, Paperclip, Search, Send, X } from "lucide-react";
import { isAdminUser, resolveStoredAuthUser } from "../lib/auth";
import TopBar from "../sidebar/page";

const COLORS = {
  primary: "#2D452F",
  accent: "#6B9D4A",
  background: "#F5F7F5",
  card: "#FFFFFF",
  text: "#1A2E1B",
  textLight: "#6B7C6A",
  border: "#E2E8E0",
  info: "#175CD3",
};

const STORAGE_KEY = "sicpr-analises-lancamentos";

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
  usuarioEncarregado?: string;
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

const formatarNomeAbreviado = (nome: string) => {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length <= 2) return nome;

  const [primeiro, ...restante] = partes;
  const ultimo = restante.pop();
  const iniciais = restante.map((parte) => `${parte.charAt(0).toUpperCase()}.`);

  return [primeiro, ...iniciais, ultimo].filter(Boolean).join(" ");
};

const formatarMemorando = (memorando: string) => {
  const match = memorando.match(/(\d+)\/(\d{4})$/);
  if (!match) return memorando;
  return `Memo ${match[1]}/${match[2]}`;
};

const mesesAbreviados = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const formatarDataCurta = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const dia = String(date.getDate()).padStart(2, "0");
  const mes = mesesAbreviados[date.getMonth()];
  const hora = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${dia} ${mes} • ${hora}`;
};

const normalizarSituacao = (consulta: string) => {
  const texto = consulta.trim();
  const lower = texto.toLowerCase();

  if (lower.includes("sem cadastro")) {
    return { label: "Sem cadastro", className: "bg-red-50 text-red-700 ring-red-100" };
  }

  if (lower.includes("cadastro encontrado")) {
    return { label: "Encontrado", className: "bg-emerald-50 text-emerald-700 ring-emerald-100" };
  }

  return { label: texto || "Não informado", className: "bg-slate-50 text-slate-700 ring-slate-200" };
};

const getArquivos = (item: EncaminhamentoAnalise) => [
  { kind: "processo" as ViewerKind, label: "Processo", file: item.processoPdf },
  { kind: "declaracao" as ViewerKind, label: "Declaração", file: item.declaracaoPdf },
  { kind: "memorando" as ViewerKind, label: "Memorando", file: item.memorandoPdf },
];

const contarArquivos = (item: EncaminhamentoAnalise) => getArquivos(item).filter((arquivo) => arquivo.file).length;

const getDetalhesProcesso = (item: EncaminhamentoAnalise) =>
  [
    ["Produtor", item.produtor],
    ["CPF", item.cpf],
    ["Memorando", item.memorandoNumero],
    ["Título do memorando", item.memorandoTitulo],
    ["Localidade", item.localidade],
    ["Tipo", item.tipoIdentificado],
    ["Consulta", item.resultadoConsulta],
    ["Analista", item.usuarioEncarregado || "Não informado"],
    ["Data da declaração", formatDate(item.dataDeclaracao)],
    ["Recebido", `${formatDate(item.recebidoEm)} às ${formatTime(item.recebidoEm)}`],
    ["Encaminhado", `${formatDate(item.encaminhadoEm)} às ${formatTime(item.encaminhadoEm)}`],
    ["Observação", item.observacao],
  ].filter(([, value]) => Boolean(value));

export default function LancamentosPage() {
  const router = useRouter();
  const [username, setUsername] = useState("Usuário");
  const [userRole, setUserRole] = useState("USUARIO");
  const [items, setItems] = useState<EncaminhamentoAnalise[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<EncaminhamentoAnalise | null>(null);
  const [viewerKind, setViewerKind] = useState<ViewerKind>("processo");
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const timer = window.setTimeout(async () => {
      const authUser = await resolveStoredAuthUser("Usuário");
      setUsername(authUser.username);
      setUserRole(authUser.role);
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

  const isAdmin = isAdminUser(username, userRole);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("perfil");
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
              <h1 className="text-2xl font-bold" style={{ color: COLORS.primary }}>Lançamentos</h1>
              <p className="text-sm" style={{ color: COLORS.textLight }}>
                Processos aptos encaminhados pela análise para lançamento no sistema.
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
              { label: "Para lançamento", value: items.length, icon: Send, color: COLORS.info },
              { label: "Memorandos", value: new Set(items.map((item) => item.memorandoNumero)).size, icon: FileText, color: COLORS.primary },
              { label: "Filtrados", value: filteredItems.length, icon: CheckCircle2, color: COLORS.accent },
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
              <p className="text-xs" style={{ color: COLORS.textLight }}>Cada processo mantém vínculo com o memorando usado no encaminhamento.</p>
            </div>

            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
                <Send size={34} style={{ color: COLORS.textLight }} />
                <p className="mt-3 text-sm" style={{ color: COLORS.textLight }}>Nenhum processo encaminhado para lançamento.</p>
              </div>
            ) : (
              <>
              <div className="space-y-3 p-3 md:hidden">
                {filteredItems.map((item) => {
                  const arquivos = getArquivos(item);
                  const situacao = normalizarSituacao(item.resultadoConsulta);
                  const isExpanded = expandedItemId === item.id;

                  return (
                    <div key={item.id} className="rounded-md border p-3" style={{ borderColor: COLORS.border, backgroundColor: COLORS.card }}>
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                          className="min-w-0 text-left"
                          title={item.produtor}
                        >
                          <span className="block truncate font-semibold" style={{ color: COLORS.text }}>
                            {formatarNomeAbreviado(item.produtor)}
                          </span>
                          <span className="mt-0.5 block text-xs tabular-nums" style={{ color: COLORS.textLight }}>{item.cpf}</span>
                        </button>
                        <span
                          className={`inline-flex max-w-[140px] shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${situacao.className}`}
                          title={item.resultadoConsulta}
                        >
                          <span className="truncate">{situacao.label}</span>
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-[1fr_auto] items-end gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold" style={{ color: COLORS.text }}>{formatarMemorando(item.memorandoNumero)}</p>
                          <p className="text-xs" style={{ color: COLORS.textLight }}>{item.localidade} • {item.tipoIdentificado}</p>
                          <p className="text-xs tabular-nums" style={{ color: COLORS.textLight }}>{formatarDataCurta(item.encaminhadoEm)}</p>
                        </div>
                        <button
                          type="button"
                          disabled={!isAdmin}
                          title={isAdmin ? "Lançar processo" : "Apenas administrador pode alterar esta etapa"}
                          className="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                          style={{ backgroundColor: isAdmin ? COLORS.primary : COLORS.textLight }}
                        >
                          <Send size={14} />
                          {isAdmin ? "Lançar" : "Bloqueado"}
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                          className="inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-[#ECFDF3]"
                          style={{ border: `1px solid ${COLORS.border}`, color: COLORS.primary }}
                        >
                          <Paperclip size={14} />
                          {contarArquivos(item)} arquivos
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-[#ECFDF3]"
                          style={{ color: COLORS.textLight }}
                        >
                          Detalhes
                          <ChevronDown size={14} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 space-y-3 border-t pt-3" style={{ borderTopColor: COLORS.border }}>
                          <div className="grid gap-2">
                            {getDetalhesProcesso(item).map(([label, value]) => (
                              <div key={label}>
                                <p className="text-[11px] font-semibold uppercase" style={{ color: COLORS.textLight }}>{label}</p>
                                <p className="break-words text-sm font-medium" style={{ color: COLORS.text }}>{value}</p>
                              </div>
                            ))}
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase" style={{ color: COLORS.textLight }}>Arquivos</p>
                            <div className="mt-1 space-y-1">
                              {arquivos.map((arquivo) => (
                                <button
                                  key={arquivo.kind}
                                  type="button"
                                  onClick={() => openViewer(item, arquivo.kind)}
                                  title={`Visualizar ${arquivo.file}`}
                                  className="flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-[#ECFDF3]"
                                  style={{ color: COLORS.textLight }}
                                >
                                  <Eye size={14} className="shrink-0" style={{ color: COLORS.primary }} />
                                  <span className="font-semibold" style={{ color: COLORS.text }}>{arquivo.label}:</span>
                                  <span className="truncate">{arquivo.file}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-[860px] w-full text-left text-sm">
                  <thead style={{ backgroundColor: COLORS.background, color: COLORS.textLight }}>
                    <tr>
                      {["Produtor", "Processo", "Situação", "Arquivos", "Ação"].map((header) => (
                        <th key={header} className={`px-4 py-3 text-xs font-semibold uppercase ${header === "Ação" ? "text-center" : ""}`}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => {
                      const arquivos = getArquivos(item);
                      const situacao = normalizarSituacao(item.resultadoConsulta);
                      const isExpanded = expandedItemId === item.id;

                      return (
                        <Fragment key={item.id}>
                          <tr className="border-t align-middle transition-colors hover:bg-[#F8FAF7]" style={{ borderTopColor: COLORS.border }}>
                            <td className="w-[26%] px-4 py-3">
                              <button
                                type="button"
                                onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                                className="flex min-w-0 items-center gap-2 text-left"
                                title="Ver detalhes"
                              >
                                <ChevronDown
                                  size={16}
                                  className={`shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                  style={{ color: COLORS.textLight }}
                                />
                                <span className="min-w-0">
                                  <span className="block max-w-[240px] truncate font-semibold" style={{ color: COLORS.text }} title={item.produtor}>
                                    {formatarNomeAbreviado(item.produtor)}
                                  </span>
                                  <span className="mt-0.5 block text-xs tabular-nums" style={{ color: COLORS.textLight }}>
                                    {item.cpf}
                                  </span>
                                </span>
                              </button>
                            </td>
                            <td className="w-[30%] px-4 py-3">
                              <div className="space-y-0.5">
                                <p className="font-semibold" style={{ color: COLORS.text }}>{formatarMemorando(item.memorandoNumero)}</p>
                                <p className="text-xs" style={{ color: COLORS.textLight }}>{item.localidade} • {item.tipoIdentificado}</p>
                                <p className="text-xs tabular-nums" style={{ color: COLORS.textLight }}>{formatarDataCurta(item.encaminhadoEm)}</p>
                              </div>
                            </td>
                            <td className="w-[16%] px-4 py-3">
                              <span
                                className={`inline-flex max-w-[180px] items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${situacao.className}`}
                                title={item.resultadoConsulta}
                              >
                                <span className="truncate">{situacao.label}</span>
                              </span>
                            </td>
                            <td className="w-[14%] px-4 py-3">
                              <button
                                type="button"
                                onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                                className="inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-[#ECFDF3]"
                                style={{ border: `1px solid ${COLORS.border}`, color: COLORS.primary }}
                                title="Ver arquivos"
                              >
                                <Paperclip size={14} />
                                {contarArquivos(item)} arquivos
                              </button>
                            </td>
                            <td className="w-[14%] px-4 py-3 text-center">
                              <button
                                type="button"
                                disabled={!isAdmin}
                                title={isAdmin ? "Lançar processo" : "Apenas administrador pode alterar esta etapa"}
                                className="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
                                style={{ backgroundColor: isAdmin ? COLORS.primary : COLORS.textLight }}
                              >
                                <Send size={14} />
                                {isAdmin ? "Lançar" : "Bloqueado"}
                              </button>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="border-t" style={{ borderTopColor: COLORS.border, backgroundColor: COLORS.background }}>
                              <td colSpan={5} className="px-4 py-4">
                                <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
                                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {getDetalhesProcesso(item).map(([label, value]) => (
                                      <div key={label} className="rounded-md border px-3 py-2" style={{ borderColor: COLORS.border, backgroundColor: COLORS.card }}>
                                        <p className="text-[11px] font-semibold uppercase" style={{ color: COLORS.textLight }}>{label}</p>
                                        <p className="mt-1 break-words text-sm font-medium" style={{ color: COLORS.text }}>{value}</p>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="rounded-md border px-3 py-2" style={{ borderColor: COLORS.border, backgroundColor: COLORS.card }}>
                                    <p className="text-[11px] font-semibold uppercase" style={{ color: COLORS.textLight }}>Arquivos</p>
                                    <div className="mt-2 space-y-1">
                                      {arquivos.map((arquivo) => (
                                        <button
                                          key={arquivo.kind}
                                          type="button"
                                          onClick={() => openViewer(item, arquivo.kind)}
                                          title={`Visualizar ${arquivo.file}`}
                                          className="group flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-all duration-200 hover:bg-[#ECFDF3]"
                                          style={{ color: COLORS.textLight }}
                                        >
                                          <Eye size={14} className="shrink-0" style={{ color: COLORS.primary }} />
                                          <span className="font-semibold" style={{ color: COLORS.text }}>{arquivo.label}:</span>
                                          <span className="truncate transition-colors group-hover:text-[#2D452F]">{arquivo.file}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </section>
        </div>
      </main>

      {selectedItem && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-3 py-4 sm:px-5">
          <div className="absolute inset-0 bg-black/45" onClick={() => setSelectedItem(null)} />
          <section className="relative flex h-[calc(100vh-2rem)] w-full max-w-7xl flex-col overflow-hidden rounded-lg border shadow-2xl sm:h-[calc(100vh-3rem)]" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
            <div className="shrink-0 flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              <div>
                <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Visualização de PDFs</p>
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

            <div className="shrink-0 flex flex-wrap items-center gap-2 px-5 py-3" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              <span className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold" style={{ backgroundColor: COLORS.background, border: `1px solid ${COLORS.border}`, color: COLORS.primary }}>
                <FileText size={15} />
                {selectedFileLabel}
              </span>
              <span className="min-w-0 truncate text-sm" style={{ color: COLORS.textLight }}>
                {selectedFile}
              </span>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden p-5 lg:grid-cols-[minmax(0,1fr)_390px]">
              <div className="flex min-h-[360px] flex-col items-center justify-center overflow-hidden rounded-md border border-dashed text-center lg:min-h-0" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
                <FileText size={56} style={{ color: COLORS.primary }} />
                <p className="mt-3 text-sm font-semibold" style={{ color: COLORS.text }}>{selectedFile}</p>
                <p className="mt-2 max-w-md text-sm leading-6" style={{ color: COLORS.textLight }}>
                  Prévia do PDF de {selectedFileLabel.toLowerCase()} encaminhado pela análise para a etapa de lançamento.
                </p>
              </div>

              <aside className="min-h-0 space-y-3 overflow-y-auto pr-1">
                <div className="rounded-md border px-3 py-3" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
                  <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Arquivos do processo</p>
                  <div className="mt-2 space-y-1">
                    {getArquivos(selectedItem).map((arquivo) => (
                      <button
                        key={arquivo.kind}
                        type="button"
                        onClick={() => setViewerKind(arquivo.kind)}
                        title={`Visualizar ${arquivo.file}`}
                        className={`flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-2 text-left text-xs transition-colors hover:bg-white ${viewerKind === arquivo.kind ? "bg-white shadow-sm" : ""}`}
                        style={{ color: COLORS.textLight, border: viewerKind === arquivo.kind ? `1px solid ${COLORS.border}` : "1px solid transparent" }}
                      >
                        <Eye size={14} className="shrink-0" style={{ color: COLORS.primary }} />
                        <span className="font-semibold" style={{ color: COLORS.text }}>{arquivo.label}:</span>
                        <span className="truncate">{arquivo.file}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  {getDetalhesProcesso(selectedItem).map(([label, value]) => (
                    <div key={label} className="rounded-md border px-3 py-2" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
                      <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>{label}</p>
                      <p className="mt-1 break-words text-sm font-medium leading-5" style={{ color: COLORS.text }}>{value}</p>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
