"use client";

import { AlertTriangle, CheckCircle2, X } from "lucide-react";

const DEFAULT_COLORS = {
  card: "#FFFFFF",
  border: "#E2E8E0",
  text: "#1A2E1B",
  textLight: "#6B7C6A",
  primary: "#2D452F",
  danger: "#B42318",
  success: "#047857",
};

type ConfirmActionDialogProps = {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "success" | "danger";
  loading?: boolean;
  colors?: Partial<typeof DEFAULT_COLORS>;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmActionDialog({
  title,
  description,
  confirmLabel,
  tone = "success",
  loading = false,
  colors,
  onConfirm,
  onClose,
}: ConfirmActionDialogProps) {
  const palette = { ...DEFAULT_COLORS, ...colors };
  const isDanger = tone === "danger";
  const Icon = isDanger ? AlertTriangle : CheckCircle2;
  const accent = isDanger ? palette.danger : palette.success;

  return (
    <div className="fixed inset-0 z-90 flex items-center justify-center px-4 py-5">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <section className="relative w-full max-w-lg overflow-hidden rounded-lg border shadow-2xl" style={{ backgroundColor: palette.card, borderColor: palette.border }}>
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderBottomColor: palette.border }}>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: isDanger ? "#FEF3F2" : "#ECFDF3", color: accent }}>
              <Icon size={21} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: palette.textLight }}>
                Confirmação necessária
              </p>
              <h2 className="mt-1 text-lg font-bold" style={{ color: palette.text }}>
                {title}
              </h2>
            </div>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-md transition hover:bg-gray-100" style={{ color: palette.textLight }}>
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm leading-relaxed" style={{ color: palette.textLight }}>
            {description}
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t px-5 py-4" style={{ borderTopColor: palette.border }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-semibold transition hover:bg-gray-50 disabled:opacity-60"
            style={{ borderColor: palette.border, color: palette.text }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: accent }}
          >
            {loading ? "Processando..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
