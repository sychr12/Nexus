"use client";

import { BrushCleaning, X } from "lucide-react";

const DEFAULT_COLORS = {
  danger: "#B42318",
  border: "#FECDCA",
  background: "#FEF3F2",
};

type ClearFiltersButtonProps = {
  onClick: () => void;
  label?: string;
  className?: string;
  colors?: Partial<typeof DEFAULT_COLORS>;
};

export default function ClearFiltersButton({
  onClick,
  label = "Limpar",
  className = "",
  colors,
}: ClearFiltersButtonProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };

  return (
    <button
      type="button"
      onClick={onClick}
      title="Limpar filtros"
      className={`group relative inline-flex min-h-11.5 w-26 items-center justify-center overflow-hidden rounded-xl border text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#B42318]/10 ${className}`}
      style={{
        color: palette.danger,
        borderColor: palette.border,
        backgroundColor: palette.background,
      }}
    >
      <span className="inline-flex items-center gap-1.5 transition-all duration-200 group-hover:-translate-y-4 group-hover:opacity-0">
        <X size={14} />
        {label}
      </span>
      <BrushCleaning
        size={17}
        className="absolute translate-y-4 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100"
      />
    </button>
  );
}
