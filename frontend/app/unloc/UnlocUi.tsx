"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { FAC_STATUS_LABELS, getFacStatus } from "../fluxo/storage";
import { SICPR_COLORS } from "../fluxo/SharedUi";
import type { ProcessoSicpr } from "../fluxo/types";
import type { CampoDocumento } from "./config";

const COLORS = SICPR_COLORS;

export function groupDocumentFields(fields: CampoDocumento[]) {
  return fields.reduce<Array<{ secao: string; campos: CampoDocumento[] }>>((groups, campo) => {
    const secao = campo.secao || "Dados";
    const existingGroup = groups.find((group) => group.secao === secao);

    if (existingGroup) {
      existingGroup.campos.push(campo);
      return groups;
    }

    groups.push({ secao, campos: [campo] });
    return groups;
  }, []);
}

export function DocumentOptionSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex min-h-[38px] w-full items-center justify-between rounded-md border px-3 py-2 text-sm"
        style={{
          backgroundColor: "#FDFDFC",
          borderColor: isOpen ? COLORS.accent : COLORS.border,
          color: value ? COLORS.text : COLORS.textLight,
          outline: "none",
          boxShadow: isOpen ? `0 0 0 3px ${COLORS.accent}18` : "none",
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown
          size={15}
          className="shrink-0"
          style={{
            color: COLORS.textLight,
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </button>

      {isOpen && (
        <div
          className="absolute z-30 mt-1.5 max-h-56 w-full overflow-y-auto rounded-md border"
          style={{
            backgroundColor: COLORS.card,
            borderColor: COLORS.accent,
            boxShadow: "0 8px 32px rgba(31,58,46,0.14)",
          }}
        >
          {options.map((option) => {
            const isSelected = option === value;

            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2.5 text-left text-sm transition-colors"
                style={{
                  color: COLORS.text,
                  backgroundColor: isSelected ? `${COLORS.accent}14` : "transparent",
                  fontWeight: isSelected ? 600 : 400,
                }}
                onMouseEnter={(event) => {
                  if (!isSelected) {
                    event.currentTarget.style.backgroundColor = "#F0F4EE";
                  }
                }}
                onMouseLeave={(event) => {
                  if (!isSelected) {
                    event.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                {option}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function FacStatusBadge({ processo }: { processo: ProcessoSicpr }) {
  const status = getFacStatus(processo);
  const isOk = status === "assinada_anexada";
  const isPending = status === "gerada";
  const color = isOk ? COLORS.primary : isPending ? "#92400E" : COLORS.textLight;
  const backgroundColor = isOk ? `${COLORS.accent}18` : isPending ? "#FEF3C7" : "#F3F4F6";

  return (
    <div className="rounded-md border px-3 py-2 text-xs" style={{ borderColor: COLORS.border, backgroundColor }}>
      <p className="font-semibold" style={{ color }}>FAC: {FAC_STATUS_LABELS[status]}</p>
      <p className="mt-1" style={{ color: COLORS.textLight }}>
        {isOk ? "FAC gerada e versao assinada anexada." : "A FAC assinada pelo produtor e obrigatoria antes do envio ao gerente."}
      </p>
    </div>
  );
}
