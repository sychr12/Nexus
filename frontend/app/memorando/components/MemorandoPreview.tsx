"use client";

import { useState, type ReactNode } from "react";
import { MemorandoForm, Memorando } from "../types/memorando";
import MemorandoTable from "./MemorandoTable";
import MemorandoFilters from "./MemorandoFilters";
import { Building2, Hash, AlignLeft, FileInput } from "lucide-react";

const COLORS = {
  primary: "#1F3A2E",
  secondary: "#2D5A40",
  accent: "#6B8E23",
  border: "#D8DDD4",
  text: "#1E2A22",
  textLight: "#6E786F",
  white: "#FFFFFF",
  lightGray: "#F3F4EF",
};

interface Props {
  form: MemorandoForm;
  memorandos: Memorando[];
  isLoading?: boolean;
}

function PreviewField({
  label,
  value,
  icon,
  multiline,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span style={{ color: COLORS.accent }}>{icon}</span>
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: COLORS.accent }}
        >
          {label}
        </span>
      </div>
      <p
        className={`text-sm leading-relaxed pl-5 ${multiline ? "whitespace-pre-wrap" : ""}`}
        style={{ color: COLORS.text }}
      >
        {value}
      </p>
    </div>
  );
}

export default function MemorandoPreview({ form, memorandos, isLoading = false }: Props) {
  const [search, setSearch] = useState("");
  const [selectedUnloc, setSelectedUnloc] = useState("");

  const isEmpty = !form.numero && !form.unloc;

  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Document Preview */}
      <div
        className="rounded-3xl border overflow-hidden"
        style={{
          backgroundColor: COLORS.white,
          borderColor: COLORS.border,
          boxShadow: "0 4px 24px rgba(31,58,46,0.08)",
        }}
      >
        {/* Document Header Bar */}
        <div
          className="px-8 py-3 flex items-center justify-between"
          style={{ backgroundColor: COLORS.primary }}
        >
          <span className="text-xs font-semibold tracking-widest uppercase text-white opacity-70">
            Documento Oficial
          </span>
          <span className="text-xs text-white opacity-50">{today}</span>
        </div>

        <div className="px-10 py-8">
          {/* Document Title Row */}
          <div className="flex items-start justify-between mb-8 pb-6 border-b" style={{ borderColor: COLORS.border }}>
            <div>
              <h1
                className="text-2xl font-black tracking-tight"
                style={{ color: COLORS.primary, letterSpacing: "-0.01em" }}
              >
                MEMORANDO
              </h1>
              <p className="text-sm font-medium mt-0.5" style={{ color: COLORS.textLight }}>
                Memorando de Saída
              </p>
            </div>
            <div
              className="px-5 py-2.5 rounded-xl text-white font-bold text-lg"
              style={{ backgroundColor: COLORS.secondary }}
            >
              Nº{" "}
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                {form.numero || "---"}
              </span>
            </div>
          </div>

          {isEmpty ? (
            <div
              className="rounded-2xl py-16 flex flex-col items-center justify-center gap-3"
              style={{ backgroundColor: COLORS.lightGray }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: "#E4EAE0" }}
              >
                <FileInput size={22} style={{ color: COLORS.textLight }} />
              </div>
              <p className="text-sm font-medium" style={{ color: COLORS.textLight }}>
                Preencha o formulário para visualizar
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {form.unloc && (
                <PreviewField
                  label="UNLOC"
                  value={form.unloc}
                  icon={<Building2 size={13} />}
                />
              )}
              {form.numero && (
                <PreviewField
                  label="Número"
                  value={form.numero}
                  icon={<Hash size={13} />}
                />
              )}
              {form.descricao && (
                <PreviewField
                  label="Descrição"
                  value={form.descricao}
                  icon={<AlignLeft size={13} />}
                />
              )}
              {form.memoEntrada && (
                <div
                  className="rounded-xl p-5 border"
                  style={{ backgroundColor: COLORS.lightGray, borderColor: COLORS.border }}
                >
                  <div className="flex items-center gap-1.5 mb-3">
                    <FileInput size={13} style={{ color: COLORS.accent }} />
                    <span
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: COLORS.accent }}
                    >
                      Memo Entrada
                    </span>
                  </div>
                  <p
                    className="text-sm leading-relaxed whitespace-pre-wrap"
                    style={{ color: COLORS.text }}
                  >
                    {form.memoEntrada}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Document Footer */}
        {!isEmpty && (
          <div
            className="px-10 py-3 border-t flex justify-between items-center"
            style={{ borderColor: COLORS.border, backgroundColor: COLORS.lightGray }}
          >
            <span className="text-xs" style={{ color: COLORS.textLight }}>
              Pré-visualização — documento não salvo
            </span>
            <div className="w-16 h-0.5 rounded" style={{ backgroundColor: COLORS.border }} />
          </div>
        )}
      </div>

      {/* Filters */}
      <MemorandoFilters
        search={search}
        setSearch={setSearch}
        selectedUnloc={selectedUnloc}
        setSelectedUnloc={setSelectedUnloc}
      />

      {/* Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold" style={{ color: COLORS.primary }}>
            Memorandos Registrados
          </h3>
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: `${COLORS.accent}18`, color: COLORS.accent }}
          >
            {memorandos.length} {memorandos.length === 1 ? "registro" : "registros"}
          </span>
        </div>
        <MemorandoTable
          memorandos={memorandos}
          isLoading={isLoading}
          search={search}
          selectedUnloc={selectedUnloc}
        />
      </div>
    </div>
  );
}