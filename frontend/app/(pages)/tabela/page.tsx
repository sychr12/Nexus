"use client";

import { useEffect, useMemo, useState } from "react";
import { 
  Bell, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  Info,
  Loader2,
  CalendarDays,
  Filter,
  X
} from "lucide-react";
import Sidebar from "@/app/_components/layout/Sidebar";
import ClearFiltersButton from "@/app/_components/ClearFiltersButton";
import StyledSelect from "@/app/_components/StyledSelect";
import { useClientMounted } from "@/app/_hooks/useClientMounted";
import { useAuthSession } from "@/app/_hooks/useAuthSession";
import { apiJson } from "@/app/_lib/http";
import { logger } from "@/app/_lib/logger";

// Paleta de cores
const COLORS = {
  primary: "#2D452F",      // verde escuro
  secondary: "#4C6A4B",    // verde médio
  accent: "#6B9D4A",       // verde claro
  light: "#CFE2CE",        // verde muito claro
  background: "#F5F7F5",   // fundo
  card: "#FFFFFF",
  text: "#1A2E1B",
  textLight: "#6B7C6A",
  border: "#E2E8E0",
  borderFocus: "#6B9D4A",
  inputBg: "#FAFBF9",
  danger: "#B42318",
};

interface Inscricao {
  id: number;
  nome: string;
  cpf: string;
  municipio: string;
  memorando: string;
  tipo: string;
  criadoEm?: string | null;
}

type PeriodFilter = "todos" | "90";

const getInscricaoDate = (item: Inscricao) => {
  if (!item.criadoEm) return null;
  const date = new Date(item.criadoEm);
  return Number.isNaN(date.getTime()) ? null : date;
};

export default function TabelaPage() {
  const { username, role, logout, ready } = useAuthSession({
    defaultUsername: "Usuario",
    allowedRoles: ["ADMIN", "GERENTE", "TECNICO", "USUARIO"],
  });
  const mounted = useClientMounted();
  const [dados, setDados] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("todos");
  const [yearFilter, setYearFilter] = useState("todos");
  const [municipioFilter, setMunicipioFilter] = useState("todos");
  const [visibleRows, setVisibleRows] = useState<Set<number>>(new Set());
  const [selectedDetails, setSelectedDetails] = useState<Inscricao | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!ready || !mounted) return;
    carregarDados();
  }, [ready, mounted]);

  async function carregarDados() {
    try {
      setLoading(true);
      const data = await apiJson<Inscricao[]>("/inscricoes/web", undefined, "Erro ao buscar inscricoes");
      setDados(data);
      setErro("");
    } catch (error) {
      logger.error("Erro ao carregar inscricoes", error);
      setErro("Não foi possível carregar os dados. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  }

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    dados.forEach((item) => {
      const date = getInscricaoDate(item);
      if (date) years.add(String(date.getFullYear()));
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [dados]);

  const availableMunicipios = useMemo(() => {
    const municipios = new Set<string>();
    dados.forEach((item) => {
      if (item.municipio?.trim()) {
        municipios.add(item.municipio.trim());
      }
    });
    return Array.from(municipios).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [dados]);

  // Filtragem dos dados
  const filteredDados = useMemo(() => {
    const termo = searchTerm.trim().toLowerCase();
    const termoNumerico = searchTerm.replace(/\D/g, "");
    const noventaDiasAtras = new Date();
    noventaDiasAtras.setDate(noventaDiasAtras.getDate() - 90);

    return dados.filter((item) => {
      const dataCriacao = getInscricaoDate(item);
      const ano = dataCriacao ? String(dataCriacao.getFullYear()) : "";
      const cpfNumerico = item.cpf?.replace(/\D/g, "") || "";

      const correspondePesquisa =
        !termo ||
        item.nome?.toLowerCase().includes(termo) ||
        item.cpf?.toLowerCase().includes(termo) ||
        (termoNumerico.length > 0 && cpfNumerico.includes(termoNumerico)) ||
        ano.includes(termo);

      const correspondePeriodo =
        periodFilter === "todos" ||
        (dataCriacao !== null && dataCriacao >= noventaDiasAtras);

      const correspondeAno =
        yearFilter === "todos" ||
        ano === yearFilter;

      const correspondeMunicipio =
        municipioFilter === "todos" ||
        item.municipio?.trim() === municipioFilter;

      return correspondePesquisa && correspondePeriodo && correspondeAno && correspondeMunicipio;
    });
  }, [dados, searchTerm, periodFilter, yearFilter, municipioFilter]);

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    periodFilter !== "todos" ||
    yearFilter !== "todos" ||
    municipioFilter !== "todos";

  const limparFiltros = () => {
    setSearchTerm("");
    setPeriodFilter("todos");
    setYearFilter("todos");
    setMunicipioFilter("todos");
    setCurrentPage(1);
  };

  const formatarData = (valor?: string | null) => {
    if (!valor) return "-";
    const date = new Date(valor);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("pt-BR");
  };

  const formatarHora = (valor?: string | null) => {
    if (!valor) return "-";
    const date = new Date(valor);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleRowVisibility = (id: number) => {
    setVisibleRows((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Paginação
  const totalPages = Math.ceil(filteredDados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDados = filteredDados.slice(startIndex, startIndex + itemsPerPage);
  const hasPageRows = paginatedDados.length > 0;
  const arePageRowsVisible = hasPageRows && paginatedDados.every((item) => visibleRows.has(item.id));

  const togglePageVisibility = () => {
    setVisibleRows((current) => {
      const next = new Set(current);

      if (arePageRowsVisible) {
        paginatedDados.forEach((item) => next.delete(item.id));
      } else {
        paginatedDados.forEach((item) => next.add(item.id));
      }

      return next;
    });
  };

  const getTipoColor = (tipo: string) => {
    const tipoNormalizado = tipo?.toUpperCase();
    const cores: Record<string, string> = {
      "INSCRICAO_RENOVACAO": `bg-[${COLORS.accent}]/10 text-[${COLORS.accent}] border-[${COLORS.accent}]/20`,
      "DEVOLUCAO": "bg-amber-500/10 text-amber-700 border-amber-500/20",
      "Produtor Rural": `bg-[${COLORS.accent}]/10 text-[${COLORS.accent}] border-[${COLORS.accent}]/20`,
      "Fornecedor": "bg-blue-500/10 text-blue-400 border-blue-500/20",
      "Distribuidor": "bg-purple-500/10 text-purple-400 border-purple-500/20",
      "Cliente": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    };
    return cores[tipoNormalizado] || cores[tipo] || "bg-gray-500/10 text-gray-400 border-gray-500/20";
  };

  const formatarTipo = (tipo?: string | null) => {
    const tipoNormalizado = tipo?.toUpperCase();
    const labels: Record<string, string> = {
      INSCRICAO_RENOVACAO: "Inscrição/Renovação",
      DEVOLUCAO: "Devolução",
    };

    return tipoNormalizado ? labels[tipoNormalizado] || tipo || "-" : "-";
  };

  const filterFieldClass = "rounded-xl border py-3 text-sm outline-none transition-all focus:ring-4 focus:ring-[#6B9D4A]/10";
  const filterFieldStyle = {
    backgroundColor: COLORS.inputBg,
    borderColor: COLORS.border,
    color: COLORS.text,
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
        username={username || "Usuário"}
        role={role}
        onCollapsedChange={setSidebarCollapsed}
      />

      <main
        className="transition-all duration-300 min-h-screen"
        style={{ marginLeft: sidebarCollapsed ? '72px' : '260px' }}
      >
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Header da Página */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: COLORS.primary }}>Inscrições</h1>
                <p className="text-sm mt-1" style={{ color: COLORS.textLight }}>
                  Gerencie todas as inscrições do sistema
                </p>
              </div>
            </div>

            {/* Card da Tabela */}
            <div className="rounded-lg shadow-sm overflow-hidden" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
              {/* Barra de Pesquisa */}
              <div className="px-4 py-3" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <h2 className="text-base font-semibold" style={{ color: COLORS.text }}>Lista de inscrições</h2>
                    <p className="text-xs mt-0.5" style={{ color: COLORS.textLight }}>
                      {filteredDados.length} de {dados.length} registros
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 2xl:flex-row 2xl:items-center">
                    <div className="relative 2xl:w-96">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textLight }} />
                      <input
                        type="text"
                        placeholder="Pesquisar por ano, nome ou CPF..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
                        className={`${filterFieldClass} w-full pl-10 pr-4`}
                        style={filterFieldStyle}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="w-48">
                        <StyledSelect
                          value={periodFilter}
                          onChange={(value) => {
                            setPeriodFilter(value as PeriodFilter);
                            setCurrentPage(1);
                          }}
                          icon={<Filter size={15} />}
                          size="compact"
                          options={[
                            { value: "todos", label: "Todos os períodos" },
                            { value: "90", label: "Últimos 90 dias" },
                          ]}
                          colors={COLORS}
                        />
                      </div>

                      <div className="w-40">
                        <StyledSelect
                          value={yearFilter}
                          onChange={(value) => {
                            setYearFilter(value);
                            setCurrentPage(1);
                          }}
                          icon={<CalendarDays size={15} />}
                          size="compact"
                          options={[
                            { value: "todos", label: "Todos os anos" },
                            ...availableYears.map((year) => ({ value: year, label: year })),
                          ]}
                          colors={COLORS}
                        />
                      </div>

                      <div className="w-56">
                        <StyledSelect
                          value={municipioFilter}
                          onChange={(value) => {
                            setMunicipioFilter(value);
                            setCurrentPage(1);
                          }}
                          icon={<Search size={15} />}
                          size="compact"
                          options={[
                            { value: "todos", label: "Todas as localidades" },
                            ...availableMunicipios.map((municipio) => ({ value: municipio, label: municipio })),
                          ]}
                          colors={COLORS}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={togglePageVisibility}
                        disabled={!hasPageRows}
                        title={arePageRowsVisible ? "Ocultar CPF e memorando" : "Mostrar CPF e memorando"}
                        className="inline-flex min-h-11.5 items-center gap-2 rounded-xl border px-4 text-xs font-semibold transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[#6B9D4A]/10 disabled:cursor-not-allowed disabled:opacity-50"
                        style={{
                          color: arePageRowsVisible ? "#FFFFFF" : COLORS.primary,
                          backgroundColor: arePageRowsVisible ? COLORS.accent : COLORS.inputBg,
                          borderColor: arePageRowsVisible ? COLORS.accent : COLORS.border,
                        }}
                      >
                        {arePageRowsVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                        {arePageRowsVisible ? "Ocultar dados" : "Mostrar dados"}
                      </button>

                      {hasActiveFilters && (
                        <ClearFiltersButton onClick={limparFiltros} />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Loading */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 size={40} className="animate-spin" style={{ color: COLORS.accent }} />
                  <p className="mt-4" style={{ color: COLORS.textLight }}>Carregando dados...</p>
                </div>
              )}

              {/* Erro */}
              {!loading && erro && (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${COLORS.light}` }}>
                    <Bell size={32} style={{ color: COLORS.primary }} />
                  </div>
                  <p className="text-center" style={{ color: COLORS.primary }}>{erro}</p>
                  <button
                    onClick={carregarDados}
                    className="mt-4 px-4 py-2 text-sm text-white rounded-lg"
                    style={{ backgroundColor: COLORS.accent }}
                  >
                    Tentar novamente
                  </button>
                </div>
              )}

              {/* Sem Dados */}
              {!loading && !erro && dados.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: COLORS.light }}>
                    <FileText size={32} style={{ color: COLORS.primary }} />
                  </div>
                  <p className="text-center" style={{ color: COLORS.textLight }}>Nenhuma inscrição encontrada</p>
                </div>
              )}

              {!loading && !erro && dados.length > 0 && filteredDados.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: COLORS.light }}>
                    <FileText size={32} style={{ color: COLORS.primary }} />
                  </div>
                  <p className="text-center" style={{ color: COLORS.textLight }}>Nenhuma inscrição encontrada para os filtros selecionados</p>
                  {hasActiveFilters && (
                    <ClearFiltersButton onClick={limparFiltros} className="mt-4" />
                  )}
                </div>
              )}

              {/* Tabela */}
              {!loading && !erro && filteredDados.length > 0 && (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-200 border-collapse">
                      <thead style={{ backgroundColor: COLORS.background }}>
                        <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>ID</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Data</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Nome</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>CPF</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Localidade</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Memorando</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Tipo</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Visualizar</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>Detalhes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedDados.map((item) => {
                          const isVisible = visibleRows.has(item.id);
                          return (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors" style={{ borderTop: `1px solid ${COLORS.border}` }}>
                              <td className="px-4 py-3 text-sm font-medium tabular-nums" style={{ color: COLORS.textLight }}>{item.id}</td>
                              <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: COLORS.textLight }}>{formatarData(item.criadoEm)}</td>
                              <td className="px-4 py-3 text-sm" style={{ color: COLORS.textLight }}>{item.nome}</td>
                              <td className="px-4 py-3 text-sm whitespace-nowrap tabular-nums" style={{ color: COLORS.textLight }}>{isVisible ? item.cpf : "*****"}</td>
                              <td className="px-4 py-3 text-sm" style={{ color: COLORS.textLight }}>{item.municipio}</td>
                              <td className="px-4 py-3 text-sm" style={{ color: COLORS.textLight }}>{isVisible ? item.memorando : "*****"}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getTipoColor(item.tipo)}`}
                                  style={{ 
                                    backgroundColor: `${COLORS.accent}15`, 
                                    color: COLORS.accent,
                                    borderColor: `${COLORS.accent}30`
                                  }}>
                                  {formatarTipo(item.tipo)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => toggleRowVisibility(item.id)}
                                  title={isVisible ? "Ocultar dados" : "Visualizar dados"}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-gray-100"
                                  style={{ color: COLORS.textLight }}
                                >
                                  {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => setSelectedDetails(item)}
                                  title="Ver detalhes"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-gray-100"
                                  style={{ color: COLORS.textLight }}
                                >
                                  <Info size={18} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginação */}
                  {totalPages > 1 && (
                    <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderTop: `1px solid ${COLORS.border}` }}>
                      <p className="text-sm" style={{ color: COLORS.textLight }}>
                        Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredDados.length)} de {filteredDados.length} resultados
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                          style={{ color: COLORS.primary }}
                        >
                          <ChevronLeft size={18} />
                        </button>
                        <span className="text-sm" style={{ color: COLORS.text }}>
                          Página {currentPage} de {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                          style={{ color: COLORS.primary }}
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Detalhes */}
      {selectedDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <div className="absolute inset-0 bg-black/45" onClick={() => setSelectedDetails(null)} />
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-lg shadow-xl"
            style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: COLORS.primary }}>Detalhes da inscrição</h2>
                <p className="text-sm" style={{ color: COLORS.textLight }}>Registro #{selectedDetails.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetails(null)}
                title="Fechar"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-gray-100"
                style={{ color: COLORS.textLight }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  ["Data", formatarData(selectedDetails.criadoEm)],
                  ["Hora", formatarHora(selectedDetails.criadoEm)],
                  ["Nome", selectedDetails.nome],
                  ["CPF", selectedDetails.cpf],
                  ["Localidade", selectedDetails.municipio],
                  ["Memorando", selectedDetails.memorando],
                  ["Tipo", formatarTipo(selectedDetails.tipo)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md border p-3" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
                    <p className="text-xs font-semibold uppercase" style={{ color: COLORS.textLight }}>{label}</p>
                    <p className="mt-1 text-sm" style={{ color: COLORS.text }}>{value || "-"}</p>
                  </div>
                ))}
              </div>

              {selectedDetails.tipo?.toUpperCase().includes("DEVOLUCAO") && (
                <div
                  className="mt-4 rounded-md border p-4"
                  style={{ borderColor: COLORS.border, backgroundColor: `${COLORS.light}55` }}
                >
                  <div className="flex gap-3">
                    <Info size={18} style={{ color: COLORS.primary }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: COLORS.primary }}>Motivo da devolução indisponível</p>
                      <p className="mt-1 text-sm" style={{ color: COLORS.textLight }}>
                        O motivo e os detalhes da devolução ainda não estão disponíveis neste registro.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
