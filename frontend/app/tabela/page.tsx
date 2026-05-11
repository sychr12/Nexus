"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Bell, 
  User, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Download,
  Eye,
  FileText,
  Users,
  Loader2
} from "lucide-react";
import TopBar from "../sidebar/page";

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
};

interface Inscricao {
  id: number;
  nome: string;
  cpf: string;
  municipio: string;
  memorando: string;
  tipo: string;
}

export default function TabelaPage() {
  const router = useRouter();
  const [dados, setDados] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    carregarDados();
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    router.push("/login");
  }

  async function carregarDados() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8080/api/inscricoes/web", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar inscrições");
      }

      const data = await response.json();
      setDados(data);
      setErro("");
    } catch (error) {
      console.error(error);
      setErro("Não foi possível carregar os dados. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  }

  const username = typeof window !== "undefined" ? localStorage.getItem("username") || "Usuário" : "Usuário";

  // Filtragem dos dados
  const filteredDados = dados.filter((item) =>
    item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.cpf.includes(searchTerm) ||
    item.municipio.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.memorando.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginação
  const totalPages = Math.ceil(filteredDados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDados = filteredDados.slice(startIndex, startIndex + itemsPerPage);

  const getTipoColor = (tipo: string) => {
    const cores: Record<string, string> = {
      "Produtor Rural": `bg-[${COLORS.accent}]/10 text-[${COLORS.accent}] border-[${COLORS.accent}]/20`,
      "Fornecedor": "bg-blue-500/10 text-blue-400 border-blue-500/20",
      "Distribuidor": "bg-purple-500/10 text-purple-400 border-purple-500/20",
      "Cliente": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    };
    return cores[tipo] || "bg-gray-500/10 text-gray-400 border-gray-500/20";
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
      <TopBar onLogout={handleLogout} username={username} />

      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header da Página */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: COLORS.primary }}>Inscrições</h1>
              <p className="text-sm mt-1" style={{ color: COLORS.textLight }}>
                Gerencie todas as inscrições do sistema
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all hover:shadow-md"
                style={{ 
                  color: COLORS.primary, 
                  backgroundColor: COLORS.card, 
                  border: `1px solid ${COLORS.border}` 
                }}
              >
                <Download size={16} />
                Exportar
              </button>
              <button 
                className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg transition-all hover:shadow-md"
                style={{ backgroundColor: COLORS.accent }}
              >
                <Users size={16} />
                Nova Inscrição
              </button>
            </div>
          </div>

          {/* Card da Tabela */}
          <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
            {/* Barra de Pesquisa */}
            <div className="p-4" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textLight }} />
                <input
                  type="text"
                  placeholder="Pesquisar por nome, CPF, município ou memorando..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-all"
                  style={{ 
                    border: `1px solid ${COLORS.border}`,
                    color: COLORS.text,
                    backgroundColor: COLORS.background
                  }}
                  onFocus={(e) => e.target.style.outline = `2px solid ${COLORS.accent}`}
                  onBlur={(e) => e.target.style.outline = "none"}
                />
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

            {/* Tabela */}
            {!loading && !erro && dados.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead style={{ backgroundColor: COLORS.background }}>
                      <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                        <th className="p-4 text-left text-sm font-semibold" style={{ color: COLORS.textLight }}>ID</th>
                        <th className="p-4 text-left text-sm font-semibold" style={{ color: COLORS.textLight }}>Nome</th>
                        <th className="p-4 text-left text-sm font-semibold" style={{ color: COLORS.textLight }}>CPF</th>
                        <th className="p-4 text-left text-sm font-semibold" style={{ color: COLORS.textLight }}>Município</th>
                        <th className="p-4 text-left text-sm font-semibold" style={{ color: COLORS.textLight }}>Memorando</th>
                        <th className="p-4 text-left text-sm font-semibold" style={{ color: COLORS.textLight }}>Tipo</th>
                        <th className="p-4 text-center text-sm font-semibold" style={{ color: COLORS.textLight }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: COLORS.border }}>
                      {paginatedDados.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 text-sm" style={{ color: COLORS.textLight }}>{item.id}</td>
                          <td className="p-4 text-sm font-medium" style={{ color: COLORS.text }}>{item.nome}</td>
                          <td className="p-4 text-sm" style={{ color: COLORS.textLight }}>{item.cpf}</td>
                          <td className="p-4 text-sm" style={{ color: COLORS.textLight }}>{item.municipio}</td>
                          <td className="p-4 text-sm" style={{ color: COLORS.textLight }}>{item.memorando}</td>
                          <td className="p-4">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getTipoColor(item.tipo)}`}
                              style={{ 
                                backgroundColor: `${COLORS.accent}15`, 
                                color: COLORS.accent,
                                borderColor: `${COLORS.accent}30`
                              }}>
                              {item.tipo}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button className="p-1 transition-colors" style={{ color: COLORS.textLight }}>
                              <Eye size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
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
      </main>
    </div>
  );
}