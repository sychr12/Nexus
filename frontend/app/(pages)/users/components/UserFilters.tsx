'use client';

import { Search } from 'lucide-react';
import ClearFiltersButton from '@/app/_components/ClearFiltersButton';
import StyledSelect from '@/app/_components/StyledSelect';
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
  const selectColors = {
    accent: COLORS.accent,
    card: COLORS.card,
    border: COLORS.border,
    inputBg: COLORS.rowAlt,
    text: COLORS.primary,
    textLight: COLORS.textLight,
    hoverBg: "#F0F4EE",
  };

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
          <StyledSelect
            value={filters.perfil || ""}
            onChange={(value) => setFilters({ ...filters, perfil: value })}
            options={[
              { value: "", label: "Todos" },
              { value: "ADMIN", label: "Administrador" },
              { value: "GERENTE", label: "Gerente" },
              { value: "TECNICO", label: "Técnico" },
              { value: "USUARIO", label: "Usuário" },
            ]}
            colors={selectColors}
          />
        </div>

        {/* Filtro por Status */}
        <div className="w-48">
          <label className="block text-xs font-medium mb-1" style={{ color: COLORS.textLight }}>
            Status
          </label>
          <StyledSelect
            value={filters.status || ""}
            onChange={(value) => setFilters({ ...filters, status: value })}
            options={[
              { value: "", label: "Todos" },
              { value: "ATIVO", label: "Ativo" },
              { value: "INATIVO", label: "Inativo" },
              { value: "BLOQUEADO", label: "Bloqueado" },
            ]}
            colors={selectColors}
          />
        </div>

        {/* Limpar Filtros */}
        {hasActiveFilters && (
          <ClearFiltersButton onClick={clearFilters} />
        )}
      </div>
    </div>
  );
}
