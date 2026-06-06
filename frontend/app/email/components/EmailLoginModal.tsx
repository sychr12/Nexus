// app/email/components/EmailLoginModal.tsx
'use client';

import { useState } from 'react';
import { X, Mail, Lock, Loader2 } from 'lucide-react';

const COLORS = {
    background: "#EEF2EC",
    primary: "#1F3A2E",
    textLight: "#6E786F",
    accent: "#6B9D4A",
    border: "#D8DDD4",
    white: "#FFFFFF",
    danger: "#DC2626",
};

interface EmailLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (email: string, senha: string) => Promise<void>;
    isLoading?: boolean;
}

export default function EmailLoginModal({ isOpen, onClose, onConfirm, isLoading = false }: EmailLoginModalProps) {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!email || !senha) {
            setError('Preencha todos os campos');
            return;
        }
        
        setLoading(true);
        try {
            await onConfirm(email, senha);
            setEmail('');
            setSenha('');
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao processar');
        } finally {
            setLoading(false);
        }
    };

    const isProcessing = isLoading || loading;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div 
                className="relative w-full max-w-md rounded-2xl overflow-hidden" 
                style={{ 
                    backgroundColor: COLORS.white, 
                    border: `1px solid ${COLORS.border}`,
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                }}
            >
                {/* Cabeçalho */}
                <div className="flex justify-between items-center p-5 border-b" style={{ borderColor: COLORS.border }}>
                    <h2 className="text-xl font-bold" style={{ color: COLORS.primary }}>Login do Gmail</h2>
                    <button 
                        onClick={onClose} 
                        className="p-1.5 rounded-lg transition-all hover:bg-gray-100"
                        style={{ color: COLORS.textLight }}
                    >
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Campo E-mail */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: COLORS.primary }}>
                            E-mail
                        </label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: COLORS.textLight }} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-opacity-20"
                                style={{ 
                                    backgroundColor: COLORS.white,
                                    borderColor: COLORS.border,
                                    color: COLORS.primary
                                }}
                                placeholder="seuemail@gmail.com"
                                disabled={isProcessing}
                            />
                        </div>
                    </div>
                    
                    {/* Campo Senha */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: COLORS.primary }}>
                            Senha
                        </label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: COLORS.textLight }} />
                            <input
                                type="password"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-opacity-20"
                                style={{ 
                                    backgroundColor: COLORS.white,
                                    borderColor: COLORS.border,
                                    color: COLORS.primary
                                }}
                                placeholder="••••••••"
                                disabled={isProcessing}
                            />
                        </div>
                    </div>
                    
                    {/* Mensagem de erro */}
                    {error && (
                        <div className="p-3 rounded-xl text-sm text-center" style={{ backgroundColor: '#FEF2F2', color: COLORS.danger, border: '1px solid #FECACA' }}>
                            ⚠️ {error}
                        </div>
                    )}
                    
                    {/* Botão de submit */}
                    <button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full py-2.5 rounded-xl text-white font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                        style={{ backgroundColor: COLORS.primary }}
                    >
                        {isProcessing ? (
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 size={18} className="animate-spin" />
                                Processando...
                            </div>
                        ) : (
                            'Baixar PDFs do Gmail'
                        )}
                    </button>

                    {/* Informação adicional */}
                    <p className="text-center text-xs" style={{ color: COLORS.textLight }}>
                        Use sua senha de aplicativo do Gmail
                    </p>
                </form>
            </div>
        </div>
    );
}