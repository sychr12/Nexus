"use client";

import { useEffect, useMemo } from "react";
import { Memorando } from "../types/memorando";
import DownloadButton from "./DownloadButton";
import { SearchX, FileX } from "lucide-react";

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
    <tr style={{ backgroundColor: index % 2 === 0 ? COLORS.card : COLORS.rowAlt, animation: `fadeIn 0.3s ease both`, animationDelay: `${index * 60}ms` }}>
      {[28, 80, 60, 100, 72].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div style={{ height: 14, width: w, borderRadius: 6, background: "linear-gradient(90deg,#E8EDE6 25%,#D4DDD2 50%,#E8EDE6 75%)", backgroundSize: "400px 100%", animation: "shimmer 1.4s ease infinite" }} />
        </td>
      ))}
    </tr>
  );
}

export default function MemorandoTable({ memorandos, isLoading = false, search, selectedUnloc }: Props) {
  useEffect(() => {
    if (!document.getElementById("kf-table")) {
      const s = document.createElement("style");
      s.id = "kf-table";
      s.textContent = KEYFRAMES;
      document.head.appendChild(s);
    }
  }, []);

  const filtered = useMemo(
    () =>
      memorandos.filter(m => {
        const matchSearch =
          search === "" ||
          m.numero.toLowerCase().includes(search.toLowerCase()) ||
          (m.descricao && m.descricao.toLowerCase().includes(search.toLowerCase()));
        const matchUnloc = selectedUnloc === "" || m.unloc === selectedUnloc;
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
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 24px rgba(31,58,46,0.10)"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(31,58,46,0.06)"}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ backgroundColor: COLORS.primary }}>
              {HEADERS.map((h, i) => (
                <th
                  key={h}
                  className={`px-5 py-3.5 font-semibold text-white text-xs uppercase tracking-wider ${h === "Ação" ? "text-center" : "text-left"}`}
                  style={{ animation: "fadeIn 0.3s ease both", animationDelay: `${i * 40}ms` }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} index={i} />)
              : filtered.map((m, index) => (
                  <tr
                    key={m.id}
                    className="border-b"
                    style={{
                      backgroundColor: index % 2 === 0 ? COLORS.card : COLORS.rowAlt,
                      borderColor: COLORS.border,
                      transition: "background-color 0.18s, transform 0.15s",
                      animation: "rowIn 0.3s ease both",
                      animationDelay: `${index * 45}ms`,
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = COLORS.hoverRow;
                      (e.currentTarget as HTMLElement).style.transform = "translateX(2px)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = index % 2 === 0 ? COLORS.card : COLORS.rowAlt;
                      (e.currentTarget as HTMLElement).style.transform = "";
                    }}
                  >
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold" style={{ backgroundColor: "#EEF2EC", color: COLORS.primary }}>
                        {m.id}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold" style={{ color: COLORS.text }}>{m.numero}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold"
                        style={{ backgroundColor: `${COLORS.accent}18`, color: COLORS.accent, transition: "background-color 0.15s, transform 0.15s" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = `${COLORS.accent}30`; (e.currentTarget as HTMLElement).style.transform = "scale(1.06)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = `${COLORS.accent}18`; (e.currentTarget as HTMLElement).style.transform = ""; }}
                      >
                        {m.unloc}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: COLORS.textLight }}>{m.usuario}</td>
                    <td className="px-5 py-3.5 text-center">
                      <DownloadButton id={m.id} numero={m.numero} unloc={m.unloc} />
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <div className="px-5 py-10">
            <div className="rounded-2xl border flex flex-col items-center justify-center py-14 gap-3" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border, animation: "scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#EEF2EC", animation: "popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both", animationDelay: "80ms" }}>
                {hasFilters ? <SearchX size={20} style={{ color: COLORS.textLight }} /> : <FileX size={20} style={{ color: COLORS.textLight }} />}
              </div>
              <p className="text-sm font-medium" style={{ color: COLORS.textLight }}>
                {hasFilters ? "Nenhum memorando encontrado com os filtros aplicados" : "Nenhum memorando registrado ainda"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {!isLoading && filtered.length > 0 && (
        <div className="px-5 py-2.5 border-t flex items-center justify-between" style={{ borderColor: COLORS.border, backgroundColor: "#FAFBF9", animation: "fadeIn 0.4s ease both" }}>
          <span className="text-xs" style={{ color: COLORS.textLight }}>
            {filtered.length} de {memorandos.length} memorandos{hasFilters && " (filtrados)"}
          </span>
        </div>
      )}
    </div>
  );
}