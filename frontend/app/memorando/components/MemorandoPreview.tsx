"use client";

import { useState } from "react";
import { MemorandoForm, Memorando } from "../types/memorando";
import MemorandoTable from "./MemorandoTable";
import MemorandoFilters from "./MemorandoFilters";

const COLORS = {
  primary: "#1F3A2E",
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

export default function MemorandoPreview({
  form,
  memorandos,
  isLoading = false,
}: Props) {
  const [search, setSearch] = useState("");
  const [selectedUnloc, setSelectedUnloc] = useState("");

  const dataAtual = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Preview Documento */}
      <div
        className="rounded-3xl border overflow-hidden"
        style={{
          backgroundColor: COLORS.white,
          borderColor: COLORS.border,
          boxShadow: "0 4px 24px rgba(31,58,46,.08)",
        }}
      >
        {/* Cabeçalho */}
        <div className="px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" style={{ backgroundColor: COLORS.primary }}>
          <div>
            <p className="font-semibold text-white">Pré-visualização do Word</p>
            <p className="text-xs mt-1 text-white/80">Veja como o memorando ficará no documento final.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs text-white">
              Data {dataAtual}
            </span>
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs text-white">
              UNLOC {form.unloc || "—"}
            </span>
          </div>
        </div>

        {/* Documento */}
        <div
          className="bg-white p-10"
          style={{
            minHeight: "720px",
            lineHeight: 1.9,
            color: COLORS.text,
          }}
        >
          {/* Número */}
          <p
            style={{
              fontWeight: 700,
              fontSize: "16px",
              color: COLORS.text,
            }}
          >
            Memo Nº {form.numero || "(num)"}/2026 CPCPP/GABIN
          </p>

          <br />

          {/* Data */}
          <p style={{ color: COLORS.textLight }}>Manaus, {dataAtual}</p>

          <br />
          <br />

          {/* Destinatários */}
          <p style={{ color: COLORS.text }}>
            <strong>DA:</strong> Coordenadoria do Programa Carteira do Produtor Primário
          </p>

          <p style={{ color: COLORS.text }}>
            <strong>AO:</strong> Gerente da Unidade Local de{" "}
            <strong>{form.unloc || "(muni)"}</strong>
          </p>

          <br />
          <br />

          {/* Texto */}
          <p
            style={{
              textAlign: "justify",
              color: COLORS.text,
            }}
          >
            Ao cumprimentá-lo cordialmente, encaminho{" "}
            <strong>{form.descricao || "(qtda)"}</strong> fichas de inscrição
            do contribuinte para as providências necessárias.
          </p>

          <br />
          <br />

          <div className="rounded-3xl border p-5" style={{ backgroundColor: COLORS.lightGray, borderColor: COLORS.border }}>
            <p className="text-sm font-semibold mb-2" style={{ color: COLORS.text }}>
              Referente aos memorandos:
            </p>
            <p className="text-sm" style={{ color: COLORS.textLight }}>
              {form.memoEntrada || "(memos)"}
            </p>
          </div>

          <div className="mt-10 text-sm" style={{ color: COLORS.text }}>
            <p>Atenciosamente,</p>
            <div className="mt-8 w-full max-w-xs">
              <div style={{ borderTop: "1px solid #444", marginBottom: "10px" }} />
              <p className="font-semibold" style={{ color: COLORS.text }}>
                Aglei Duques Maciel
              </p>
              <p className="text-sm" style={{ color: COLORS.textLight }}>
                Coordenação do CPCPP
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <MemorandoFilters
        search={search}
        setSearch={setSearch}
        selectedUnloc={selectedUnloc}
        setSelectedUnloc={setSelectedUnloc}
      />

      {/* Tabela */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-xl font-bold"
            style={{
              color: COLORS.primary,
            }}
          >
            Memorandos Registrados
          </h3>

          <span
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: `${COLORS.accent}18`,
              color: COLORS.accent,
            }}
          >
            {memorandos.length}{" "}
            {memorandos.length === 1 ? "registro" : "registros"}
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