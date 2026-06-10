'use client';

import { Search, X } from 'lucide-react';
import type { UserFilters as UserFiltersType } from '../types/user';

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

interface UserFiltersProps {
  filters: UserFiltersType;
  setFilters: (filters: UserFiltersType) => void;
}

export default function UserFilters({ filters, setFilters }: UserFiltersProps) {
  const hasActiveFilters = filters.search || filters.perfil || filters.status;

  const clearFilters = () => {
    setFilters({ search: '', perfil: '', status: '' });
  };

  return (
    <div className="rounded-2xl p-5" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
      <div className="flex flex-wrap gap-4 items-end">
        {/* Busca */}
        <div className="flex-1 min-w-50">
          <label className="block text-xs font-medium mb-1" style={{ color: COLORS.textLight }}>
            Buscar
          </label>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: COLORS.textLight }} />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Nome ou usuário..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-opacity-20"
              style={{ 
                backgroundColor: COLORS.rowAlt, 
                borderColor: COLORS.border,
                color: COLORS.primary,
              }}
            />
          </div>
        </div>

        {/* Filtro por Perfil */}
        <div className="w-48">
          <label className="block text-xs font-medium mb-1" style={{ color: COLORS.textLight }}>
            Perfil
          </label>
          <select
            value={filters.perfil}
            onChange={(e) => setFilters({ ...filters, perfil: e.target.value })}
            className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2"
            style={{ backgroundColor: COLORS.rowAlt, borderColor: COLORS.border, color: COLORS.primary }}
          >
            <option value="">Todos</option>
            <option value="ADMIN">Administrador</option>
            <option value="CHEFE">Chefe</option>
            <option value="USUARIO">Usuário Padrão</option>
          </select>
        </div>

        {/* Filtro por Status */}
        <div className="w-48">
          <label className="block text-xs font-medium mb-1" style={{ color: COLORS.textLight }}>
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2"
            style={{ backgroundColor: COLORS.rowAlt, borderColor: COLORS.border, color: COLORS.primary }}
          >
            <option value="">Todos</option>
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
            <option value="BLOQUEADO">Bloqueado</option>
          </select>
        </div>

        {/* Limpar Filtros */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 hover:bg-gray-100"
            style={{ color: COLORS.accent }}
          >
            <X size={16} />
            Limpar Filtros
          </button>
        )}
      </div>
    </div>
  );
}
