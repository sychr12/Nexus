// app/email/components/EmailStats.tsx
'use client';

import { Mail, Inbox, Calendar, MapPin } from 'lucide-react';

const COLORS = {
    primary: '#1F3A2E',
    accent: '#6B9D4A',
    textLight: '#6B7C6A',
    card: '#FFFFFF',
    border: '#E2E8E0',
};

interface EmailStatsProps {
    stats: {
        total: number;
        hoje: number;
        estaSemana: number;
        esteMes: number;
        porMunicipio: Record<string, number>;
    };
}

export default function EmailStats({ stats }: EmailStatsProps) {
    const statCards = [
        { label: 'Total', value: stats.total, icon: Mail, color: COLORS.primary },
        { label: 'Hoje', value: stats.hoje, icon: Calendar, color: '#10B981' },
        { label: 'Esta Semana', value: stats.estaSemana, icon: Inbox, color: '#3B82F6' },
        { label: 'Este Mês', value: stats.esteMes, icon: Calendar, color: '#F59E0B' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {statCards.map((card) => (
                <div
                    key={card.label}
                    className="rounded-xl p-4 border"
                    style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium" style={{ color: COLORS.textLight }}>
                                {card.label}
                            </p>
                            <p className="text-2xl font-bold mt-1" style={{ color: card.color }}>
                                {card.value}
                            </p>
                        </div>
                        <card.icon size={28} style={{ color: card.color, opacity: 0.7 }} />
                    </div>
                </div>
            ))}
        </div>
    );
}