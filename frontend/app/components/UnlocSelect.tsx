"use client";

import { ChevronDown, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  filterUnlocOptions,
  getUnlocByCode,
  getUnlocByMunicipio,
} from "../lib/unlocs";

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
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = valueMode === "code"
    ? getUnlocByCode(value)
    : getUnlocByMunicipio(value);
  const filteredOptions = filterUnlocOptions(search);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          setIsOpen((current) => !current);
          setSearch("");
        }}
        className={`w-full border text-sm flex items-center justify-between ${
          isCompact ? "rounded-md px-3 py-2" : "rounded-xl px-4 py-3"
        }`}
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
          transition: "border-color 0.2s, box-shadow 0.2s",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.7 : 1,
          minHeight: isCompact ? 38 : undefined,
        }}
        disabled={disabled}
      >
        <span className="flex min-w-0 items-center gap-2">
          <MapPin
            size={13}
            className="shrink-0"
            style={{ color: selectedOption ? palette.accent : palette.textLight }}
          />
          <span className="truncate">{selectedOption?.label || placeholder}</span>
        </span>
        <ChevronDown
          size={15}
          className="shrink-0"
          style={{
            color: palette.textLight,
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute z-20 w-full mt-1.5 border overflow-hidden ${
            isCompact ? "rounded-md" : "rounded-xl"
          }`}
          style={{
            backgroundColor: palette.card,
            borderColor: palette.borderFocus,
            boxShadow: "0 8px 32px rgba(31,58,46,0.14)",
          }}
        >
          <div className="p-2 border-b" style={{ borderColor: palette.border }}>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={`w-full px-3 py-2 text-sm border ${isCompact ? "rounded-md" : "rounded-lg"}`}
              style={{
                backgroundColor: "#F5F7F3",
                borderColor: palette.border,
                color: palette.text,
                outline: "none",
              }}
              autoFocus
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
                    onClick={() => {
                      onChange(optionValue);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm transition-colors"
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
                    <span style={{ color: palette.accent, fontWeight: 700, marginRight: 6 }}>
                      {option.value}
                    </span>
                    {option.municipio}
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
