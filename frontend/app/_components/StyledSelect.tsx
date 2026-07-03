"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type SelectOption = {
  value: string;
  label: string;
};

const DEFAULT_COLORS = {
  accent: "#6B9D4A",
  card: "#FFFFFF",
  border: "#DDE6DC",
  inputBg: "#FFFFFF",
  text: "#1F3A2E",
  textLight: "#6B7C6A",
  hoverBg: "#F0F4EE",
  danger: "#DC2626",
};

type StyledSelectProps = {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  icon?: ReactNode;
  size?: "compact" | "regular";
  className?: string;
  menuClassName?: string;
  colors?: Partial<typeof DEFAULT_COLORS>;
};

export default function StyledSelect({
  value,
  options,
  onChange,
  placeholder = "Selecione",
  disabled = false,
  error = false,
  icon,
  size = "regular",
  className = "",
  menuClassName = "",
  colors,
}: StyledSelectProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = useMemo(() => options.find((option) => option.value === value), [options, value]);
  const isCompact = size === "compact";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <div className={`relative w-full ${isOpen ? "z-[80]" : "z-0"} ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        className={`flex w-full items-center justify-between border text-left transition-all duration-200 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 ${
          isCompact ? "min-h-10 rounded-md px-3 py-2 text-sm" : "min-h-11 rounded-xl px-4 py-2.5 text-sm"
        }`}
        style={{
          backgroundColor: palette.inputBg,
          borderColor: error ? palette.danger : isOpen ? palette.accent : palette.border,
          color: selectedOption ? palette.text : palette.textLight,
          outline: "none",
          boxShadow: isOpen ? `0 0 0 3px ${palette.accent}22` : "none",
        }}
        aria-expanded={isOpen}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {icon && <span className="shrink-0" style={{ color: palette.textLight }}>{icon}</span>}
          <span className="truncate">{selectedOption?.label || placeholder}</span>
        </span>
        <ChevronDown
          size={16}
          className="ml-2 shrink-0 transition-transform duration-200"
          style={{ color: palette.textLight, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute z-[90] mt-1.5 max-h-60 w-full overflow-y-auto border shadow-xl ${
            isCompact ? "rounded-md" : "rounded-xl"
          } ${menuClassName}`}
          style={{
            backgroundColor: palette.card,
            borderColor: palette.accent,
            boxShadow: "0 12px 34px rgba(31,58,46,0.16)",
          }}
        >
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2.5 text-left text-sm transition-colors"
                style={{
                  color: palette.text,
                  backgroundColor: isSelected ? `${palette.accent}18` : "transparent",
                  fontWeight: isSelected ? 700 : 500,
                }}
                onMouseEnter={(event) => {
                  if (!isSelected) event.currentTarget.style.backgroundColor = palette.hoverBg;
                }}
                onMouseLeave={(event) => {
                  if (!isSelected) event.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
