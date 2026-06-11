"use client";

import { ChevronDown, MapPin, X } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  filterUnlocOptions,
  getUnlocByCode,
  getUnlocByMunicipio,
} from "@/app/_lib/unlocs";

const DEFAULT_COLORS = {
  accent: "#6B8E23",
  card: "#FAFAF7",
  border: "#D8DDD4",
  borderFocus: "#6B8E23",
  text: "#1E2A22",
  textLight: "#6E786F",
  inputBg: "#FDFDFC",
  hoverBg: "#F0F4EE",
  danger: "#DC2626",
};

interface Props {
  value: string;
  onChange: (value: string) => void;
  valueMode?: "code" | "municipio";
  placeholder?: string;
  searchPlaceholder?: string;
  error?: boolean;
  disabled?: boolean;
  size?: "regular" | "compact";
  colors?: Partial<typeof DEFAULT_COLORS>;
}

export default function UnlocSelect({
  value,
  onChange,
  valueMode = "code",
  placeholder = "Selecione o município",
  searchPlaceholder = "Buscar município...",
  error = false,
  disabled = false,
  size = "regular",
  colors,
}: Props) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const isCompact = size === "compact";
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focar no input de busca quando abrir
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const selectedOption = valueMode === "code"
    ? getUnlocByCode(value)
    : getUnlocByMunicipio(value);
  
  const filteredOptions = filterUnlocOptions(search);

  const handleSelect = useCallback((optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearch("");
  }, [onChange]);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setIsOpen(false);
    setSearch("");
  }, [onChange]);

  const toggleDropdown = useCallback(() => {
    if (disabled) return;
    setIsOpen(prev => !prev);
    if (isOpen) {
      setSearch("");
    }
  }, [disabled, isOpen]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        className={`
          w-full border text-sm flex items-center justify-between
          transition-all duration-200
          ${isCompact ? "rounded-md px-3 py-2" : "rounded-xl px-4 py-3"}
          ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}
          hover:shadow-sm
        `}
        style={{
          backgroundColor: palette.inputBg,
          borderColor: error
            ? palette.danger
            : isOpen
              ? palette.borderFocus
              : selectedOption && !isCompact
                ? palette.accent
                : palette.border,
          color: selectedOption ? palette.text : palette.textLight,
          outline: "none",
          boxShadow: isOpen ? `0 0 0 3px ${palette.accent}18` : "none",
          minHeight: isCompact ? 38 : undefined,
        }}
        disabled={disabled}
      >
        <span className="flex min-w-0 items-center gap-2 flex-1">
          <MapPin
            size={13}
            className="shrink-0"
            style={{ color: selectedOption ? palette.accent : palette.textLight }}
          />
          <span className="truncate flex-1 text-left">
            {selectedOption?.label || placeholder}
          </span>
        </span>
        
        <div className="flex items-center gap-1 shrink-0">
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 rounded-full hover:bg-gray-200 transition-colors"
              aria-label="Limpar seleção"
            >
              <X size={14} style={{ color: palette.textLight }} />
            </button>
          )}
          <ChevronDown
            size={15}
            className="shrink-0 transition-transform duration-200"
            style={{
              color: palette.textLight,
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </div>
      </button>

      {isOpen && (
        <div
          className={`
            absolute z-50 w-full mt-1.5 border overflow-hidden
            ${isCompact ? "rounded-md" : "rounded-xl"}
            animate-in fade-in duration-200
          `}
          style={{
            backgroundColor: palette.card,
            borderColor: palette.borderFocus,
            boxShadow: "0 8px 32px rgba(31,58,46,0.14)",
          }}
        >
          <div className="p-2 border-b" style={{ borderColor: palette.border }}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={`
                w-full px-3 py-2 text-sm border outline-none
                focus:ring-1 focus:ring-green-500
                ${isCompact ? "rounded-md" : "rounded-lg"}
              `}
              style={{
                backgroundColor: "#F5F7F3",
                borderColor: palette.border,
                color: palette.text,
              }}
            />
          </div>

          <div className="max-h-52 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-center" style={{ color: palette.textLight }}>
                Nenhum resultado encontrado
              </div>
            ) : (
              filteredOptions.map((option) => {
                const optionValue = valueMode === "code" ? option.value : option.municipio;
                const isSelected = optionValue === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(optionValue)}
                    className="w-full text-left px-4 py-2.5 text-sm transition-all duration-150 hover:pl-5"
                    style={{
                      color: palette.text,
                      backgroundColor: isSelected ? `${palette.accent}14` : "transparent",
                      fontWeight: isSelected ? 600 : 400,
                    }}
                    onMouseEnter={(event) => {
                      if (!isSelected) {
                        event.currentTarget.style.backgroundColor = palette.hoverBg;
                      }
                    }}
                    onMouseLeave={(event) => {
                      if (!isSelected) {
                        event.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <span style={{ color: palette.accent, fontWeight: 700, marginRight: 8 }}>
                      {option.value}
                    </span>
                    <span>{option.municipio}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}