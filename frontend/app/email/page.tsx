// app/email/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { emailService } from './services/email.service';
import { EmailAnexo, EmailStats as EmailStatsType } from './types/email';
import EmailStatsComponent from './components/EmailStats';
import EmailFilters from './components/EmailFilters';
import EmailTable from './components/EmailTable';
import EmailLoginModal from './components/EmailLoginModal';
import { Download, RefreshCw } from 'lucide-react';
import Sidebar from '../sidebar/page';
import { useRouter } from 'next/navigation';
import { useAuthSession } from '../hooks/useAuthSession';

// Animações CSS
const animations = `
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}
`;

const COLORS = {
    primary: '#1F3A2E',
    accent: '#6B9D4A',
    background: '#F3F4EF',
    textLight: '#6B7C6A',
};

export default function EmailPage() {
    const router = useRouter();
    const { username, logout, ready } = useAuthSession({ defaultUsername: "Usuário" });
    const [emails, setEmails] = useState<EmailAnexo[]>([]);
    const [stats, setStats] = useState<EmailStatsType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [municipios, setMunicipios] = useState<string[]>([]);
    const [animated, setAnimated] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        // Adiciona estilos de animação
        if (!mounted) return;
        
        if (!document.getElementById("email-animations")) {
            const style = document.createElement("style");
            style.id = "email-animations";
            style.textContent = animations;
            document.head.appendChild(style);
        }
        setAnimated(true);
    }, [mounted]);

    const carregarEmails = useCallback(async () => {
        if (!ready) return;
        
        try {
            setIsLoading(true);
            const data = await emailService.listarEmails(0, 50);
            setEmails(data.content || []);
            
            const statsData = await emailService.obterEstatisticas();
            setStats(statsData);
            
            const municipiosList = Object.keys(statsData.porMunicipio || {});
            setMunicipios(municipiosList);
        } catch (error) {
            console.error('Erro ao carregar emails:', error);
        } finally {
            setIsLoading(false);
        }
    }, [ready]);

    useEffect(() => {
        if (!ready || !mounted) return;
        carregarEmails();
    }, [ready, mounted, carregarEmails]);

    const handleSearch = async (texto: string) => {
        if (!ready) return;
        
        try {
            setIsLoading(true);
            if (texto.trim()) {
                const data = await emailService.buscarEmails(texto, 0, 50);
                setEmails(data.content || []);
            } else {
                const data = await emailService.listarEmails(0, 50);
                setEmails(data.content || []);
            }
        } catch (error) {
            console.error('Erro ao buscar:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMunicipioFilter = async (municipio: string) => {
        if (!ready) return;
        
        try {
            setIsLoading(true);
            if (municipio) {
                const data = await emailService.buscarPorMunicipio(municipio, 0, 50);
                setEmails(data.content || []);
            } else {
                const data = await emailService.listarEmails(0, 50);
                setEmails(data.content || []);
            }
        } catch (error) {
            console.error('Erro ao filtrar:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async (id: number, nomeArquivo: string) => {
        try {
            const blob = await emailService.downloadPdf(id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = nomeArquivo || 'anexo.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Erro ao baixar PDF:', error);
            alert('Erro ao baixar o arquivo');
        }
    };

    const handleProcessarEmails = async (email: string, senha: string) => {
        setIsProcessing(true);
        try {
            const result = await emailService.processarEmails({
                email,
                senha,
                apenasNaoLidos: true,
            });
            
            if (result.success) {
                alert(`✅ ${result.message}`);
                await carregarEmails();
                setShowLoginModal(false);
            } else {
                alert(`❌ ${result.message}`);
            }
        } catch (error) {
            console.error('Erro ao processar:', error);
            alert('Erro ao processar emails. Verifique suas credenciais.');
            throw error;
        } finally {
            setIsProcessing(false);
        }
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
                onCollapsedChange={setSidebarCollapsed}
            />

            <main 
                className="transition-all duration-300 min-h-screen"
                style={{ marginLeft: sidebarCollapsed ? '72px' : '260px' }}
            >
                <div className="p-6">
                    <div className="max-w-7xl mx-auto">
                        {/* Cabeçalho */}
                        <div 
                            className="flex justify-between items-center mb-6 flex-wrap gap-4"
                            style={{ animation: animated ? "fadeInUp 0.5s ease-out" : "none" }}
                        >
                            <div>
                                <h1 
                                    className="text-3xl font-bold transition-all duration-300 hover:translate-x-1"
                                    style={{ color: COLORS.primary }}
                                >
                                    Gerenciador de E-mails
                                </h1>
                                <p 
                                    className="mt-1 text-sm transition-all duration-300 delay-100"
                                    style={{ color: COLORS.textLight }}
                                >
                                    Baixe e gerencie anexos PDF dos e-mails do Gmail
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => carregarEmails()}
                                    className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-md"
                                    style={{ backgroundColor: COLORS.primary, color: 'white' }}
                                >
                                    <RefreshCw size={18} className="transition-transform duration-300 group-hover:rotate-180" />
                                    Atualizar
                                </button>
                                <button
                                    onClick={() => setShowLoginModal(true)}
                                    disabled={isProcessing}
                                    className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-md disabled:opacity-50"
                                    style={{ backgroundColor: COLORS.accent, color: 'white' }}
                                >
                                    <Download size={18} className="transition-transform duration-300 group-hover:translate-y-0.5" />
                                    {isProcessing ? 'Processando...' : 'Baixar PDFs'}
                                </button>
                            </div>
                        </div>

                        {/* Estatísticas */}
                        <div style={{ animation: animated ? "fadeInUp 0.5s ease-out 0.1s both" : "none" }}>
                            {stats && <EmailStatsComponent stats={stats} />}
                        </div>

                        {/* Filtros */}
                        <div style={{ animation: animated ? "fadeInLeft 0.5s ease-out 0.2s both" : "none" }}>
                            <EmailFilters
                                onSearch={handleSearch}
                                onMunicipioChange={handleMunicipioFilter}
                                municipios={municipios}
                            />
                        </div>

                        {/* Tabela */}
                        <div style={{ animation: animated ? "fadeInRight 0.5s ease-out 0.3s both" : "none" }}>
                            <EmailTable
                                emails={emails}
                                isLoading={isLoading}
                                onDownload={handleDownload}
                            />
                        </div>

                        {/* Modal de Login */}
                        <EmailLoginModal
                            isOpen={showLoginModal}
                            onClose={() => setShowLoginModal(false)}
                            onConfirm={handleProcessarEmails}
                            isLoading={isProcessing}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}