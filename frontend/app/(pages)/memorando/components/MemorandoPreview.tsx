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
      <div
        className="overflow-hidden rounded-3xl border"
        style={{
          backgroundColor: COLORS.white,
          borderColor: COLORS.border,
          boxShadow: "0 4px 24px rgba(31,58,46,.08)",
        }}
      >
        <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between" style={{ backgroundColor: COLORS.primary }}>
          <div>
            <p className="font-semibold text-white">Pré-visualização do Word</p>
            <p className="mt-1 text-xs text-white/80">Veja como o memorando ficará no documento final.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs text-white">
              Data {dataAtual}
            </span>
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs text-white">
              Unidade Local {form.unloc || "-"}
            </span>
          </div>
        </div>

        <div className="bg-[#eef2ec] px-4 py-6 sm:px-6">
          <div
            className="relative mx-auto min-h-[960px] w-full max-w-[680px] overflow-hidden bg-white px-14 pb-44 pt-36 text-[13px] leading-6 text-black shadow-sm"
            style={{
              backgroundImage: "url('/images/PapelTimbrado.png')",
              backgroundRepeat: "no-repeat",
              backgroundSize: "100% 100%",
              color: COLORS.text,
            }}
          >
            <p className="text-[16px] font-bold" style={{ color: COLORS.text }}>
              Memo Nº {form.numero || "(num)"}/2026 CPCPP/GABIN
            </p>

            <br />

            <p style={{ color: COLORS.textLight }}>Manaus, {dataAtual}</p>

            <br />
            <br />

            <p style={{ color: COLORS.text }}>
              <strong>DA:</strong> Coordenadoria do Programa Carteira do Produtor Primário
            </p>

            <p style={{ color: COLORS.text }}>
              <strong>AO:</strong> Gerente da Unidade Local de{" "}
              <strong>{form.unloc || "(muni)"}</strong>
            </p>

            <br />
            <br />

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

            <div className="rounded border p-4" style={{ backgroundColor: "rgba(243,244,239,.78)", borderColor: COLORS.border }}>
              <p className="mb-2 text-sm font-semibold" style={{ color: COLORS.text }}>
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

            <MemorandoTimbradoFooter />
          </div>
        </div>
      </div>

      <MemorandoFilters
        search={search}
        setSearch={setSearch}
        selectedUnloc={selectedUnloc}
        setSelectedUnloc={setSelectedUnloc}
      />

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3
            className="text-xl font-bold"
            style={{
              color: COLORS.primary,
            }}
          >
            Memorandos Registrados
          </h3>

          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
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

function MemorandoTimbradoFooter() {
  return (
    <footer className="absolute bottom-8 left-12 right-12 grid grid-cols-[1fr_1.25fr_1fr] items-center gap-5 text-[11px] leading-4 text-[#7D8AA5]">
      <div className="space-y-0.5">
        <p>www.idam.am.gov.br</p>
        <p>twitter.com/idam_govam</p>
        <p>youtube.com/idam_govam</p>
        <p>facebook.com/idam_govam</p>
        <p>Instagram.com/@idam_govam</p>
      </div>
      <div className="border-x border-[#98A6A1] px-5">
        <p>presidencia@idam.am.gov.br</p>
        <p>Fone: (92) 98452-9911</p>
        <p>Avenida Carlos Drummond de</p>
        <p>Andrade, 1460, Bloco G - 2º Andar</p>
        <p>Conj. Atílio Andreazza - Japiim</p>
        <p>Manaus - AM - CEP: 69077-730</p>
      </div>
      <div className="flex justify-end">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/IDAM.png" alt="IDAM 30 anos" className="h-14 w-auto object-contain" />
      </div>
    </footer>
  );
}
