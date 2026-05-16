"use client";

import { useMemo } from "react";
import { Memorando } from "../lib/types";
import DownloadButton from "./DownloadButton";
import { Loader2, SearchX, FileX } from "lucide-react";

const COLORS = {
  primary: "#2D452F",
  accent: "#6B9D4A",
  textLight: "#6B7C6A",
  card: "#FFFFFF",
  text: "#1A2E1B",
  border: "#E2E8E0",
  rowAlt: "#F7FAF7",
  hoverRow: "#EFF4EE",
};

interface Props {
  memorandos: Memorando[];
  isLoading?: boolean;
  search: string;
  selectedUnloc: string;
}

const HEADERS = ["ID", "Número", "UNLOC", "Usuário", "Ação"];

export default function MemorandoTable({ memorandos, isLoading = false, search, selectedUnloc }: Props) {
  const filteredMemorandos = useMemo(() => {
    return memorandos.filter((m) => {
      const matchesSearch =
        search === "" ||
        m.numero.toLowerCase().includes(search.toLowerCase()) ||
        (m.descricao && m.descricao.toLowerCase().includes(search.toLowerCase()));
      const matchesUnloc = selectedUnloc === "" || m.unloc === selectedUnloc;
      return matchesSearch && matchesUnloc;
    });
  }, [memorandos, search, selectedUnloc]);

  const hasFilters = search !== "" || selectedUnloc !== "";

  if (isLoading) {
    return (
      <div
        className="rounded-2xl border flex items-center justify-center py-14 gap-2.5"
        style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
      >
        <Loader2 size={18} className="animate-spin" style={{ color: COLORS.accent }} />
        <span className="text-sm" style={{ color: COLORS.textLight }}>
          Carregando memorandos...
        </span>
      </div>
    );
  }

  if (filteredMemorandos.length === 0) {
    return (
      <div
        className="rounded-2xl border flex flex-col items-center justify-center py-14 gap-3"
        style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
      >
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "#EEF2EC" }}
        >
          {hasFilters ? (
            <SearchX size={20} style={{ color: COLORS.textLight }} />
          ) : (
            <FileX size={20} style={{ color: COLORS.textLight }} />
          )}
        </div>
        <p className="text-sm font-medium" style={{ color: COLORS.textLight }}>
          {hasFilters
            ? "Nenhum memorando encontrado com os filtros aplicados"
            : "Nenhum memorando registrado ainda"}
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ backgroundColor: COLORS.card, borderColor: COLORS.border, boxShadow: "0 2px 12px rgba(31,58,46,0.06)" }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ backgroundColor: COLORS.primary }}>
              {HEADERS.map((h) => (
                <th
                  key={h}
                  className={`px-5 py-3.5 font-semibold text-white text-xs uppercase tracking-wider ${
                    h === "Ação" ? "text-center" : "text-left"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredMemorandos.map((memorando, index) => (
              <tr
                key={memorando.id}
                className="border-b transition-colors"
                style={{
                  backgroundColor: index % 2 === 0 ? COLORS.card : COLORS.rowAlt,
                  borderColor: COLORS.border,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = COLORS.hoverRow;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    index % 2 === 0 ? COLORS.card : COLORS.rowAlt;
                }}
              >
                <td className="px-5 py-3.5">
                  <span
                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold"
                    style={{ backgroundColor: "#EEF2EC", color: COLORS.primary }}
                  >
                    {memorando.id}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-semibold" style={{ color: COLORS.text }}>
                  {memorando.numero}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold"
                    style={{ backgroundColor: `${COLORS.accent}18`, color: COLORS.accent }}
                  >
                    {memorando.unloc}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-sm" style={{ color: COLORS.textLight }}>
                  {memorando.usuario}
                </td>
                <td className="px-5 py-3.5 text-center">
                  <DownloadButton
                    id={memorando.id}
                    numero={memorando.numero}
                    unloc={memorando.unloc}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Footer count */}
      <div
        className="px-5 py-2.5 border-t flex items-center justify-between"
        style={{ borderColor: COLORS.border, backgroundColor: "#FAFBF9" }}
      >
        <span className="text-xs" style={{ color: COLORS.textLight }}>
          {filteredMemorandos.length} de {memorandos.length} memorandos
          {hasFilters && " (filtrados)"}
        </span>
      </div>
    </div>
  );
}