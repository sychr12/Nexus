"use client";

const COLORS = {
  primary: "#2D452F",
  accent: "#6B9D4A",
  textLight: "#6B7C6A",
  card: "#FFFFFF",
  text: "#1A2E1B",
  border: "#E2E8E0",
};

interface Props {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
}

export default function MemorandoCard({ title, value, icon }: Props) {
  return (
    <div
      className="rounded-2xl p-5 border flex items-center gap-4 font-sans"
      style={{
        backgroundColor: COLORS.card,
        borderColor: COLORS.border,
        boxShadow: "0 2px 12px rgba(31,58,46,0.06)",
      }}
    >
      {icon && (
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${COLORS.accent}14` }}
        >
          <span style={{ color: COLORS.accent }}>{icon}</span>
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider truncate" style={{ color: COLORS.textLight }}>
          {title}
        </p>
        <p className="text-2xl font-bold mt-1 tabular-nums" style={{ color: COLORS.text }}>
          {value}
        </p>
      </div>
    </div>
  );
}