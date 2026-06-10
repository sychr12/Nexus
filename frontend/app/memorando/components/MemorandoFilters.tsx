"use client";

import { ChevronDown, MapPin, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { filterUnlocOptions, UNLOC_OPTIONS } from "../../lib/unlocs";

const COLORS = {
  primary: "#2D452F",
  accent: "#6B9D4A",
  light: "#CFE2CE",
  card: "#FFFFFF",
  text: "#1A2E1B",
  textLight: "#6B7C6A",
  border: "#E2E8E0",
  borderFocus: "#6B9D4A",
  hoverBg: "#F0F4EE",
  inputBg: "#FAFBF9",
};

interface Props {
  search: string;
  setSearch: (value: string) => void;
  selectedUnloc: string;
  setSelectedUnloc: (value: string) => void;
}

export default function MemorandoFilters({ search, setSearch, selectedUnloc, setSelectedUnloc }: Props) {
  const [isUnlocOpen, setIsUnlocOpen] = useState(false);
  const [unlocSearch, setUnlocSearch] = useState("");
  const [focusSearch, setFocusSearch] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsUnlocOpen(false);
        setUnlocSearch("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = filterUnlocOptions(unlocSearch);
  const selectedLabel = selectedUnloc
    ? UNLOC_OPTIONS.find((option) => option.value === selectedUnloc)?.label
    : null;
  const hasAnyFilter = search !== "" || selectedUnloc !== "";

  return (
    <div
      className="rounded-2xl border p-5 space-y-4"
      style={{
        backgroundColor: COLORS.card,
        borderColor: COLORS.border,
        boxShadow: "0 2px 12px rgba(31,58,46,0.06)",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: COLORS.textLight }}>
          Filtros
        </span>
        {hasAnyFilter && (
          <button
            onClick={() => {
              setSearch("");
              setSelectedUnloc("");
            }}
            className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70"
            style={{ color: COLORS.accent }}
          >
            <X size={12} />
            Limpar filtros
          </button>
        )}
      </div>

      <div className="relative">
        <Search
          size={14}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: focusSearch ? COLORS.accent : COLORS.textLight }}
        />
        <input
          type="text"
          placeholder="Buscar por número ou descrição..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setFocusSearch(true)}
          onBlur={() => setFocusSearch(false)}
          className="w-full rounded-xl pl-9 pr-9 py-2.5 border text-sm"
          style={{
            backgroundColor: COLORS.inputBg,
            borderColor: focusSearch ? COLORS.borderFocus : COLORS.border,
            color: COLORS.text,
            outline: "none",
            boxShadow: focusSearch ? `0 0 0 3px ${COLORS.accent}18` : "none",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
            style={{ color: COLORS.textLight }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => {
            setIsUnlocOpen(!isUnlocOpen);
            setUnlocSearch("");
          }}
          className="w-full rounded-xl px-4 py-2.5 border text-sm flex items-center justify-between"
          style={{
            backgroundColor: COLORS.inputBg,
            borderColor: isUnlocOpen ? COLORS.borderFocus : selectedUnloc ? COLORS.accent : COLORS.border,
            color: selectedLabel ? COLORS.text : COLORS.textLight,
            outline: "none",
            boxShadow: isUnlocOpen ? `0 0 0 3px ${COLORS.accent}18` : "none",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
        >
          <span className="flex min-w-0 items-center gap-2">
            <MapPin size={13} className="shrink-0" style={{ color: selectedUnloc ? COLORS.accent : COLORS.textLight }} />
            <span className="truncate">{selectedLabel || "Todos os municípios"}</span>
          </span>
          <div className="flex items-center gap-1.5">
            {selectedUnloc && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedUnloc("");
                }}
                className="p-0.5 rounded hover:opacity-70 transition-opacity"
                style={{ color: COLORS.textLight }}
              >
                <X size={12} />
              </span>
            )}
            <ChevronDown
              size={14}
              style={{
                color: COLORS.textLight,
                transform: isUnlocOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            />
          </div>
        </button>

        {isUnlocOpen && (
          <div
            className="absolute z-20 w-full mt-1.5 rounded-xl border overflow-hidden"
            style={{
              backgroundColor: COLORS.card,
              borderColor: COLORS.borderFocus,
              boxShadow: "0 8px 32px rgba(31,58,46,0.14)",
            }}
          >
            <div className="p-2 border-b" style={{ borderColor: COLORS.border }}>
              <input
                type="text"
                placeholder="Buscar município..."
                value={unlocSearch}
                onChange={(e) => setUnlocSearch(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm border"
                style={{
                  backgroundColor: "#F5F7F3",
                  borderColor: COLORS.border,
                  color: COLORS.text,
                  outline: "none",
                }}
                autoFocus
              />
            </div>
            <button
              onClick={() => {
                setSelectedUnloc("");
                setIsUnlocOpen(false);
                setUnlocSearch("");
              }}
              className="w-full text-left px-4 py-2.5 text-sm font-medium border-b"
              style={{
                color: !selectedUnloc ? COLORS.accent : COLORS.textLight,
                backgroundColor: !selectedUnloc ? `${COLORS.accent}10` : "transparent",
                borderColor: COLORS.border,
              }}
            >
              Todos os municípios
            </button>
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-center" style={{ color: COLORS.textLight }}>
                  Nenhum resultado
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSelectedUnloc(option.value);
                      setIsUnlocOpen(false);
                      setUnlocSearch("");
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                    style={{
                      color: COLORS.text,
                      backgroundColor: selectedUnloc === option.value ? `${COLORS.accent}14` : "transparent",
                      fontWeight: selectedUnloc === option.value ? 600 : 400,
                    }}
                    onMouseEnter={(e) => {
                      if (selectedUnloc !== option.value) {
                        e.currentTarget.style.backgroundColor = COLORS.hoverBg;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedUnloc !== option.value) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <span style={{ color: COLORS.accent, fontWeight: 700, marginRight: 6 }}>
                      {option.value}
                    </span>
                    {option.municipio}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
