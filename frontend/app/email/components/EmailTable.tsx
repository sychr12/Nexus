// app/email/components/EmailTable.tsx
'use client';

import { EmailAnexo } from '../types/email';
import { Download, Eye, FileText, MapPin, Calendar, Mail } from 'lucide-react';

const COLORS = {
    primary: '#1F3A2E',
    accent: '#6B9D4A',
    border: '#E2E8E0',
    text: '#1E2A22',
    textLight: '#6B7C6A',
    white: '#FFFFFF',
    lightGray: '#F3F4EF',
};

interface EmailTableProps {
    emails: EmailAnexo[];
    isLoading: boolean;
    onDownload: (id: number, nomeArquivo: string) => void;
}

export default function EmailTable({ emails, isLoading, onDownload }: EmailTableProps) {
    const formatDate = (dateString: string) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) {
        return (
            <div className="rounded-xl p-8 text-center border" style={{ backgroundColor: COLORS.white, borderColor: COLORS.border }}>
                <div className="animate-pulse" style={{ color: COLORS.textLight }}>
                    Carregando emails...
                </div>
            </div>
        );
    }

    if (emails.length === 0) {
        return (
            <div className="rounded-xl p-12 text-center border" style={{ backgroundColor: COLORS.white, borderColor: COLORS.border }}>
                <Mail size={48} className="mx-auto mb-3 opacity-30" style={{ color: COLORS.textLight }} />
                <p style={{ color: COLORS.textLight }}>Nenhum email encontrado</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: COLORS.white, borderColor: COLORS.border }}>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead style={{ backgroundColor: COLORS.lightGray }}>
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: COLORS.textLight }}>Remetente</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: COLORS.textLight }}>Assunto</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: COLORS.textLight }}>Município</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: COLORS.textLight }}>Arquivo</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: COLORS.textLight }}>Data</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold" style={{ color: COLORS.textLight }}>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {emails.map((email) => (
                            <tr key={email.id} className="border-t hover:bg-gray-50" style={{ borderColor: COLORS.border }}>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <Mail size={14} style={{ color: COLORS.textLight }} />
                                        <span className="text-sm" style={{ color: COLORS.text }}>{email.remetente}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <p className="text-sm truncate max-w-xs" style={{ color: COLORS.text }} title={email.assunto}>
                                        {email.assunto}
                                    </p>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs" style={{ backgroundColor: `${COLORS.accent}15`, color: COLORS.accent }}>
                                        <MapPin size={12} />
                                        {email.municipio}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <FileText size={14} style={{ color: COLORS.textLight }} />
                                        <span className="text-sm" style={{ color: COLORS.text }}>{email.nomeArquivo}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} style={{ color: COLORS.textLight }} />
                                        <span className="text-sm" style={{ color: COLORS.textLight }}>{formatDate(email.criadoEm)}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button
                                        onClick={() => onDownload(email.id, email.nomeArquivo)}
                                        className="p-2 rounded-lg transition-colors hover:bg-gray-100"
                                        title="Baixar PDF"
                                    >
                                        <Download size={18} style={{ color: COLORS.accent }} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}