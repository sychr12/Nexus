"use client";

import { DollarSign, FileText, CreditCard } from 'lucide-react';

interface DashboardStats {
  totalLancamentos: number;
  totalMemorandos: number;
  totalCartoes: number;
}

interface StatsCardsProps {
  stats: DashboardStats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Lançamentos',
      value: stats.totalLancamentos,
      subtitle: 'últimos 30 dias',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      icon: DollarSign,
    },
    {
      title: 'Memorandos',
      value: stats.totalMemorandos,
      subtitle: 'total emitidos',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      icon: FileText,
    },
    {
      title: 'Cartões Emitidos',
      value: stats.totalCartoes,
      subtitle: 'produtores ativos',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      icon: CreditCard,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center`}>
                <Icon size={24} className={card.color} />
              </div>
              <span className={`text-3xl font-bold ${card.color}`}>
                {card.value?.toLocaleString() || 0}
              </span>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">{card.title}</h3>
            <p className="text-gray-400 text-xs">{card.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
}
