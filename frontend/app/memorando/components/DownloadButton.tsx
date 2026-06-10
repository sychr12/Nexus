"use client";

import { useState } from "react";
import { Download, Loader2, CheckCircle2, AlertCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { apiFetch } from "../../lib/http";
import { downloadMemorando } from "../services/memorando.service";

const COLORS = {
  primary: "#1F3A2E",
  accent: "#6B9D4A",
  danger: "#DC2626",
  textLight: "#6B7C6A",
  card: "#FFFFFF",
  border: "#E2E8E0",
  rowAlt: "#F7FAF7",
  success: "#059669",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Gera o nome do arquivo com estrutura de data e hora.
 * Exemplo: 2025-05-14_14h_memorando-001-2025_MAO.pdf
 */
function buildFileName(numero: string, unloc: string, ext: string = "pdf"): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);            // 2025-05-14
  const hour = String(now.getHours()).padStart(2, "0");   // 14
  const safeNumero = numero.replace(/[^a-zA-Z0-9\-]/g, "-");
  return `${date}_${hour}h_memorando-${safeNumero}_${unloc}.${ext}`;
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface DownloadEntry {
  id: string;
  fileName: string;
  timestamp: Date;
  status: "ok" | "error";
  errorMsg?: string;
}

interface Props {
  id: number;
  numero: string;
  unloc: string;
  disabled?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DownloadButton({ id, numero, unloc, disabled = false }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<DownloadEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const addHistory = (entry: Omit<DownloadEntry, "id">) => {
    setHistory((prev) => [{ ...entry, id: `${Date.now()}-${Math.random()}` }, ...prev]);
  };

  const handleDownload = async () => {
    if (isLoading || disabled) return;
    setIsLoading(true);
    const fileName = buildFileName(numero, unloc);
    try {
      const blob = await fetchBlob(id);
      if (blob) {
        triggerBlobDownload(blob, fileName);
      } else {
        // Fallback: serviço original (abre link direto)
        downloadMemorando(id);
      }
      addHistory({ fileName, timestamp: new Date(), status: "ok" });
      setShowHistory(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao baixar";
      addHistory({ fileName, timestamp: new Date(), status: "error", errorMsg: msg });
      setShowHistory(true);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const lastStatus = history[0]?.status;

  return (
    <div className="relative inline-flex flex-col items-center gap-1 font-sans">
      {/* Botão principal */}
      <button
        onClick={handleDownload}
        disabled={disabled || isLoading}
        title={`Baixar como ${buildFileName(numero, unloc)}`}
        className="inline-flex items-center gap-1.5 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: COLORS.accent }}
        onMouseEnter={(e) => {
          if (!disabled && !isLoading)
            (e.currentTarget as HTMLElement).style.backgroundColor = "#5A8A3A";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = COLORS.accent;
        }}
      >
        {isLoading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : lastStatus === "ok" ? (
          <CheckCircle2 size={12} />
        ) : lastStatus === "error" ? (
          <AlertCircle size={12} />
        ) : (
          <Download size={12} />
        )}
        {isLoading ? "Baixando…" : "Download"}
      </button>

      {/* Toggle histórico */}
      {history.length > 0 && (
        <button
          onClick={() => setShowHistory((v) => !v)}
          className="flex items-center gap-0.5 text-xs transition-opacity hover:opacity-70"
          style={{ color: COLORS.textLight }}
        >
          <Clock size={10} />
          {history.length} download{history.length > 1 ? "s" : ""}
          {showHistory ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>
      )}

      {/* Painel de histórico */}
      {showHistory && history.length > 0 && (
        <div
          className="absolute top-full mt-1 z-30 rounded-xl border shadow-xl overflow-hidden text-left"
          style={{
            backgroundColor: COLORS.card,
            borderColor: COLORS.border,
            width: "290px",
            right: 0,
            boxShadow: "0 8px 32px rgba(31,58,46,0.16)",
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-2.5 border-b flex items-center justify-between"
            style={{ borderColor: COLORS.border, backgroundColor: COLORS.rowAlt }}
          >
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.textLight }}>
              Histórico de Downloads
            </span>
            <button
              onClick={() => { setHistory([]); setShowHistory(false); }}
              className="text-xs hover:opacity-70 transition-opacity"
              style={{ color: COLORS.textLight }}
            >
              Limpar
            </button>
          </div>

          {/* Entries */}
          <div className="max-h-52 overflow-y-auto">
            {history.map((entry, i) => (
              <div
                key={entry.id}
                className="px-4 py-2.5 flex items-start gap-2.5 border-b last:border-b-0"
                style={{ borderColor: COLORS.border, backgroundColor: i % 2 === 0 ? COLORS.card : COLORS.rowAlt }}
              >
                {entry.status === "ok" ? (
                  <CheckCircle2 size={13} className="mt-0.5 shrink-0" style={{ color: COLORS.success }} />
                ) : (
                  <AlertCircle size={13} className="mt-0.5 shrink-0" style={{ color: COLORS.danger }} />
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className="text-xs font-medium truncate leading-snug"
                    style={{ color: entry.status === "ok" ? COLORS.primary : COLORS.danger }}
                    title={entry.fileName}
                  >
                    {entry.fileName}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: COLORS.textLight }}>
                    {formatDateTime(entry.timestamp)}
                    {entry.errorMsg && (
                      <span style={{ color: COLORS.danger }}> — {entry.errorMsg}</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers de blob ─────────────────────────────────────────────────────────

async function fetchBlob(id: number): Promise<Blob | null> {
  try {
    const response = await apiFetch(`/memorandos/${id}/download`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.blob();
  } catch {
    return null;
  }
}

function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
