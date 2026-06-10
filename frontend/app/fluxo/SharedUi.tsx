import { FileText } from "lucide-react";
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
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-md border border-dashed bg-white text-center">
      <FileText size={48} />
      <p className="mt-3 font-semibold">{documento.arquivo}</p>
      <p className="mt-1 text-sm text-gray-500">Arquivo anexado. Pre-visualizacao disponivel para imagens e PDF.</p>
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
        <p className="mt-2 break-words text-sm font-semibold" style={{ color: SICPR_COLORS.text }}>{value}</p>
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
