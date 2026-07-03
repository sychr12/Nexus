"use client";

import { useState, type ReactNode } from "react";
import { FileText, Maximize2, Minimize2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import type { DocumentoProcesso } from "./types";

export const SICPR_COLORS = {
  primary: "#2D452F",
  accent: "#6B9D4A",
  background: "#F5F7F5",
  card: "#FFFFFF",
  text: "#1A2E1B",
  textLight: "#6B7C6A",
  border: "#E2E8E0",
  danger: "#B42318",
};

type DocumentPreviewViewerProps = {
  children: ReactNode;
  title?: string;
};

export function DocumentPreviewViewer({ children, title = "Visualização do documento" }: DocumentPreviewViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const isZoomed = zoom > 1.05;

  const decreaseZoom = () => setZoom((current) => Math.max(0.55, Number((current - 0.1).toFixed(2))));
  const increaseZoom = () => setZoom((current) => Math.min(1.8, Number((current + 0.1).toFixed(2))));
  const resetZoom = () => setZoom(1);
  const toggleDocumentZoom = () => setZoom((current) => (current > 1.05 ? 1 : 1.35));

  return (
    <div
      className={expanded ? "fixed inset-3 z-[130] flex w-full flex-col overflow-hidden rounded-lg border bg-white shadow-2xl" : "flex h-full min-h-0 w-full flex-col"}
      style={expanded ? { borderColor: SICPR_COLORS.border } : undefined}
    >
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-md border bg-white px-3 py-2 print:hidden" style={{ borderColor: SICPR_COLORS.border }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: SICPR_COLORS.textLight }}>
            {title}
          </p>
          <p className="text-xs" style={{ color: SICPR_COLORS.textLight }}>
            Zoom {Math.round(zoom * 100)}%
          </p>
          <p className="text-[11px]" style={{ color: SICPR_COLORS.textLight }}>
            Duplo clique no documento para {isZoomed ? "reduzir" : "aproximar"}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <PreviewToolButton label="Diminuir zoom" onClick={decreaseZoom} icon={<ZoomOut size={16} />} />
          <PreviewToolButton label="Aumentar zoom" onClick={increaseZoom} icon={<ZoomIn size={16} />} />
          <PreviewToolButton label="Restaurar zoom" onClick={resetZoom} icon={<RotateCcw size={16} />} />
          {expanded && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition hover:bg-[#F5F7F5]"
              style={{ borderColor: SICPR_COLORS.border, color: SICPR_COLORS.primary }}
            >
              <Minimize2 size={16} />
              Sair da tela cheia
            </button>
          )}
          {!expanded && (
            <PreviewToolButton
              label="Ampliar visualização"
              onClick={() => setExpanded(true)}
              icon={<Maximize2 size={16} />}
            />
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto overscroll-contain rounded-md" style={{ backgroundColor: SICPR_COLORS.background }}>
        <div
          className="w-fit min-w-full px-3 py-3"
          style={{ display: "flex", justifyContent: isZoomed ? "flex-start" : "center" }}
        >
          <div
            className="sicpr-preview-scale"
            onDoubleClick={toggleDocumentZoom}
            style={{
              cursor: isZoomed ? "zoom-out" : "zoom-in",
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              width: `${100 / zoom}%`,
              minHeight: `${100 / zoom}%`,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewToolButton({ label, icon, onClick }: { label: string; icon: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border transition hover:bg-[#F5F7F5]"
      style={{ borderColor: SICPR_COLORS.border, color: SICPR_COLORS.primary }}
    >
      {icon}
    </button>
  );
}

export function AttachmentPreview({ documento }: { documento: DocumentoProcesso }) {
  if (documento.conteudo && documento.mimeType?.startsWith("image/")) {
    return (
      <div className="flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={documento.conteudo} alt={documento.arquivo} className="max-h-[72vh] max-w-full rounded-md border bg-white object-contain" />
      </div>
    );
  }

  if (documento.conteudo && documento.mimeType === "application/pdf") {
    return <iframe title={documento.arquivo} src={documento.conteudo} className="h-[72vh] w-full rounded-md border bg-white" />;
  }

  return (
    <div className="flex min-h-90 flex-col items-center justify-center rounded-md border border-dashed bg-white text-center">
      <FileText size={48} />
      <p className="mt-3 font-semibold">{documento.arquivo}</p>
      <p className="mt-1 text-sm text-gray-500">Arquivo anexado. Pré-visualização disponível para imagens e PDF.</p>
    </div>
  );
}

export function DetailInfoCard({ label, value, badgeClass }: { label: string; value: string; badgeClass?: string }) {
  return (
    <div className="rounded-md border bg-white px-3 py-3" style={{ borderColor: SICPR_COLORS.border }}>
      <p className="text-xs font-semibold uppercase" style={{ color: SICPR_COLORS.textLight }}>{label}</p>
      {badgeClass ? (
        <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${badgeClass}`}>
          {value}
        </span>
      ) : (
        <p className="mt-2 wrap-break-word text-sm font-semibold" style={{ color: SICPR_COLORS.text }}>{value}</p>
      )}
    </div>
  );
}

export function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border px-3 py-2 shadow-sm" style={{ backgroundColor: SICPR_COLORS.card, borderColor: SICPR_COLORS.border }}>
      <p className="text-xs font-semibold uppercase" style={{ color: SICPR_COLORS.textLight }}>{label}</p>
      <p className="mt-1 text-xl font-bold" style={{ color: SICPR_COLORS.primary }}>{value}</p>
    </div>
  );
}

export function FilterStatCard({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border px-3 py-2 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm"
      style={{
        borderColor: active ? SICPR_COLORS.primary : SICPR_COLORS.border,
        backgroundColor: active ? "#EEF5EC" : SICPR_COLORS.background,
      }}
    >
      <p className="text-xs font-semibold uppercase" style={{ color: active ? SICPR_COLORS.primary : SICPR_COLORS.textLight }}>{label}</p>
      <p className="mt-1 text-xl font-bold" style={{ color: SICPR_COLORS.primary }}>{value}</p>
    </button>
  );
}
