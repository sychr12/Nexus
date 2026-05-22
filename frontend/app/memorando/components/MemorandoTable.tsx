"use client";

import { useEffect, useMemo } from "react";
import { FileX, SearchX } from "lucide-react";
import { Memorando } from "../types/memorando";
import DownloadButton from "./DownloadButton";

const KEYFRAMES = `
@keyframes fadeIn   { from{opacity:0} to{opacity:1} }
@keyframes rowIn    { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
@keyframes scaleIn  { from{opacity:0;transform:scale(0.94)} to{opacity:1;transform:scale(1)} }
@keyframes popIn    { 0%{transform:scale(0.8);opacity:0} 70%{transform:scale(1.06);opacity:1} 100%{transform:scale(1)} }
@keyframes shimmer  { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
`;

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

function SkeletonRow({ index }: { index: number }) {
  return (
    <tr
      style={{
        backgroundColor: index % 2 === 0 ? COLORS.card : COLORS.rowAlt,
        animation: "fadeIn 0.3s ease both",
        animationDelay: `${index * 60}ms`,
      }}
    >
      {[28, 80, 60, 100, 72].map((width, cellIndex) => (
        <td key={cellIndex} className="px-5 py-4">
          <div
            style={{
              height: 14,
              width,
              borderRadius: 6,
              background: "linear-gradient(90deg,#E8EDE6 25%,#D4DDD2 50%,#E8EDE6 75%)",
              backgroundSize: "400px 100%",
              animation: "shimmer 1.4s ease infinite",
            }}
          />
        </td>
      ))}
    </tr>
  );
}

export default function MemorandoTable({
  memorandos,
  isLoading = false,
  search,
  selectedUnloc,
}: Props) {
  useEffect(() => {
    if (!document.getElementById("kf-table")) {
      const style = document.createElement("style");
      style.id = "kf-table";
      style.textContent = KEYFRAMES;
      document.head.appendChild(style);
    }
  }, []);

  const filtered = useMemo(
    () =>
      memorandos.filter((memorando) => {
        const normalizedSearch = search.toLowerCase();
        const matchSearch =
          search === "" ||
          memorando.numero.toLowerCase().includes(normalizedSearch) ||
          memorando.descricao?.toLowerCase().includes(normalizedSearch) ||
          memorando.usuario?.toLowerCase().includes(normalizedSearch);
        const matchUnloc = selectedUnloc === "" || memorando.unloc === selectedUnloc;

        return matchSearch && matchUnloc;
      }),
    [memorandos, search, selectedUnloc]
  );

  const hasFilters = search !== "" || selectedUnloc !== "";

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        backgroundColor: COLORS.card,
        borderColor: COLORS.border,
        boxShadow: "0 2px 12px rgba(31,58,46,0.06)",
        transition: "box-shadow 0.25s",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.boxShadow = "0 6px 24px rgba(31,58,46,0.10)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.boxShadow = "0 2px 12px rgba(31,58,46,0.06)";
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ backgroundColor: COLORS.primary }}>
              {HEADERS.map((header, index) => (
                <th
                  key={header}
                  className={`px-5 py-3.5 font-semibold text-white text-xs uppercase tracking-wider ${
                    header === "Ação" ? "text-center" : "text-left"
                  }`}
                  style={{ animation: "fadeIn 0.3s ease both", animationDelay: `${index * 40}ms` }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, index) => <SkeletonRow key={index} index={index} />)
              : filtered.map((memorando, index) => (
                  <tr
                    key={memorando.id}
                    className="border-b"
                    style={{
                      backgroundColor: index % 2 === 0 ? COLORS.card : COLORS.rowAlt,
                      borderColor: COLORS.border,
                      transition: "background-color 0.18s, transform 0.15s",
                      animation: "rowIn 0.3s ease both",
                      animationDelay: `${index * 45}ms`,
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.backgroundColor = COLORS.hoverRow;
                      event.currentTarget.style.transform = "translateX(2px)";
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.backgroundColor = index % 2 === 0 ? COLORS.card : COLORS.rowAlt;
                      event.currentTarget.style.transform = "";
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
                        style={{
                          backgroundColor: `${COLORS.accent}18`,
                          color: COLORS.accent,
                          transition: "background-color 0.15s, transform 0.15s",
                        }}
                        onMouseEnter={(event) => {
                          event.currentTarget.style.backgroundColor = `${COLORS.accent}30`;
                          event.currentTarget.style.transform = "scale(1.06)";
                        }}
                        onMouseLeave={(event) => {
                          event.currentTarget.style.backgroundColor = `${COLORS.accent}18`;
                          event.currentTarget.style.transform = "";
                        }}
                      >
                        {memorando.unloc}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: COLORS.textLight }}>
                      {memorando.usuario}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <DownloadButton id={memorando.id} numero={memorando.numero} unloc={memorando.unloc} />
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {!isLoading && filtered.length === 0 && (
          <div className="px-5 py-10">
            <div
              className="rounded-2xl border flex flex-col items-center justify-center py-14 gap-3"
              style={{
                backgroundColor: COLORS.card,
                borderColor: COLORS.border,
                animation: "scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
              }}
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{
                  backgroundColor: "#EEF2EC",
                  animation: "popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
                  animationDelay: "80ms",
                }}
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
          </div>
        )}
      </div>

      {!isLoading && filtered.length > 0 && (
        <div
          className="px-5 py-2.5 border-t flex items-center justify-between"
          style={{ borderColor: COLORS.border, backgroundColor: "#FAFBF9", animation: "fadeIn 0.4s ease both" }}
        >
          <span className="text-xs" style={{ color: COLORS.textLight }}>
            {filtered.length} de {memorandos.length} memorandos{hasFilters && " (filtrados)"}
          </span>
        </div>
      )}
    </div>
  );
}
