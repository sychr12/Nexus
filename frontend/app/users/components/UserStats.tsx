'use client';

import { Users, UserCheck, UserX, AlertCircle, Shield, Crown, User } from 'lucide-react';

const COLORS = {
  primary: "#1F3A2E",
  accent: "#6B9D4A",
  danger: "#DC2626",
  textLight: "#6B7C6A",
  card: "#FFFFFF",
  border: "#E2E8E0",
  rowAlt: "#F7FAF7",
  success: "#059669",
};

interface UserStatsProps {
  stats: {
    total: number;
    ativos: number;
    inativos: number;
    bloqueados: number;
    administradores: number;
    chefes: number;
    usuarios: number;
  };
}

export default function UserStats({ stats }: UserStatsProps) {
  const statCards = [
    { label: 'Total', value: stats.total, icon: Users, color: COLORS.primary, bg: `${COLORS.primary}10` },
    { label: 'Ativos', value: stats.ativos, icon: UserCheck, color: COLORS.success, bg: `${COLORS.success}10` },
    { label: 'Inativos', value: stats.inativos, icon: UserX, color: COLORS.danger, bg: `${COLORS.danger}10` },
    { label: 'Bloqueados', value: stats.bloqueados, icon: AlertCircle, color: '#F59E0B', bg: '#F59E0B10' },
    { label: 'Administradores', value: stats.administradores, icon: Shield, color: '#8B5CF6', bg: '#8B5CF610' },
    { label: 'Chefes', value: stats.chefes, icon: Crown, color: '#F59E0B', bg: '#F59E0B10' },
    { label: 'Usuários', value: stats.usuarios, icon: User, color: COLORS.accent, bg: `${COLORS.accent}10` },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      {statCards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl p-4 transition-all hover:shadow-md"
          style={{
            backgroundColor: COLORS.card,
            border: `1px solid ${COLORS.border}`,
          }}
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
            <div className="p-2 rounded-full" style={{ backgroundColor: card.bg }}>
              <card.icon size={20} style={{ color: card.color }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}