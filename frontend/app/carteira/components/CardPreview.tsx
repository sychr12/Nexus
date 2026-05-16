// frontend/app/carteira/components/CardPreview.tsx
"use client";

import { CarteiraRequest } from "../types/carteira";
import { useState } from "react";
import Image from "next/image";

interface CardPreviewProps {
  form: CarteiraRequest;
}

export default function CardPreview({ form }: CardPreviewProps) {
  const [imgError, setImgError] = useState({ frente: false, verso: false });

  const formatarCpf = (cpf: string) => {
    if (!cpf) return "";
    const numeros = cpf.replace(/\D/g, "");
    if (numeros.length === 11) {
      return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return cpf;
  };

  const formatarData = (data: string) => {
    if (!data) return "";
    return new Date(data).toLocaleDateString("pt-BR");
  };

  const isEmpty = !form.registro && !form.nome && !form.cpf;

  // ─────────────────────────────────────────────────────────────────
  // COORDENADAS PIXEL A PIXEL — frente: 1409×943 px | verso: 1408×943 px
  //
  // Cada entrada define exatamente o retângulo cinza:
  //   top    = borda superior do retângulo (% da altura total)
  //   left   = borda esquerda (% da largura total)
  //   width  = largura do retângulo
  //   height = altura do retângulo
  //
  // fieldStyle usa flexbox (alignItems + justifyContent) para
  // centralizar o texto dentro do retângulo — vertical e horizontalmente.
  // ─────────────────────────────────────────────────────────────────

  const FRENTE: Record<string, React.CSSProperties> = {
    registro:    { top: "39.3%", left: "6.0%",  width: "42.7%", height: "10.5%" },
    cpf:         { top: "39.3%", left: "50.9%", width: "42.9%", height: "10.5%" },
    nome:        { top: "53.7%", left: "6.0%",  width: "87.8%", height: "11.6%" },
    propriedade: { top: "69.0%", left: "6.0%",  width: "87.8%", height: "11.8%" },
    unloc:       { top: "84.9%", left: "5.8%",  width: "38.0%", height: "10.1%" },
    inicio:      { top: "84.9%", left: "44.9%", width: "24.9%", height: "10.1%" },
    validade:    { top: "84.9%", left: "71.0%", width: "22.8%", height: "10.1%" },
  };

  const VERSO: Record<string, React.CSSProperties> = {
    endereco:   { top: "29.5%", left: "4.0%", width: "91.9%", height: "14.0%" },
    atividade1: { top: "49.3%", left: "4.0%", width: "91.9%", height: "10.7%" },
    atividade2: { top: "66.2%", left: "4.0%", width: "91.9%", height: "10.7%" },
    georef:     { top: "82.4%", left: "4.0%", width: "91.9%", height: "10.6%" },
  };

  // Flexbox centraliza vertical + horizontalmente dentro do retângulo cinza
  const fieldStyle = (pos: React.CSSProperties): React.CSSProperties => ({
    position: "absolute",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    paddingInline: "2%",
    boxSizing: "border-box",
    ...pos,
  });

  const PlaceholderCard = ({ titulo }: { titulo: string }) => (
    <div className="flex h-80 w-full items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-100">
      <div className="text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-500">{titulo}</p>
        <p className="text-xs text-gray-400">
          Coloque em: /public/images/carteira/{titulo.toLowerCase()}.png
        </p>
      </div>
    </div>
  );

  return (
    <div className="sticky top-6 space-y-6">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Pré-visualização do Cartão
        </h2>

        {isEmpty ? (
          <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <p className="text-gray-500">Preencha o formulário ao lado</p>
            <p className="text-sm text-gray-400">para visualizar o cartão</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* ── FRENTE DO CARTÃO ── */}
            <div className="relative overflow-hidden rounded-xl border border-gray-200 shadow-lg">
              {!imgError.frente ? (
                <div className="relative">
                  <Image
                    src="/images/carteira/frente.png"
                    alt="Frente do Cartão"
                    width={1409}
                    height={943}
                    className="h-auto w-full"
                    priority
                    onError={() => setImgError((e) => ({ ...e, frente: true }))}
                  />
                  <div className="absolute inset-0">

                    <span className="text-[1.05cqw] font-bold text-gray-900" style={fieldStyle(FRENTE.registro)}>
                      {form.registro}
                    </span>

                    <span className="font-mono text-[1.05cqw] text-gray-900" style={fieldStyle(FRENTE.cpf)}>
                      {formatarCpf(form.cpf)}
                    </span>

                    <span className="text-[1.05cqw] font-semibold text-gray-900" style={fieldStyle(FRENTE.nome)}>
                      {form.nome}
                    </span>

                    <span className="text-[1.05cqw] text-gray-800" style={fieldStyle(FRENTE.propriedade)}>
                      {form.propriedade}
                    </span>

                    <span className="text-[1.05cqw] font-semibold text-gray-900" style={fieldStyle(FRENTE.unloc)}>
                      {form.unloc}
                    </span>

                    <span className="text-[1.05cqw] text-gray-800" style={fieldStyle(FRENTE.inicio)}>
                      {formatarData(form.inicio)}
                    </span>

                    <span className="text-[1.05cqw] text-gray-800" style={fieldStyle(FRENTE.validade)}>
                      {formatarData(form.validade)}
                    </span>

                  </div>
                </div>
              ) : (
                <PlaceholderCard titulo="frente" />
              )}
            </div>

            {/* ── VERSO DO CARTÃO ── */}
            <div className="relative overflow-hidden rounded-xl border border-gray-200 shadow-lg">
              {!imgError.verso ? (
                <div className="relative">
                  <Image
                    src="/images/carteira/verso.png"
                    alt="Verso do Cartão"
                    width={1408}
                    height={943}
                    className="h-auto w-full"
                    onError={() => setImgError((e) => ({ ...e, verso: true }))}
                  />
                  <div className="absolute inset-0">

                    <span className="text-[1.05cqw] text-gray-800" style={fieldStyle(VERSO.endereco)}>
                      {form.endereco}
                    </span>

                    <span className="text-[1.05cqw] text-gray-800" style={fieldStyle(VERSO.atividade1)}>
                      {form.atividade1}
                    </span>

                    <span className="text-[1.05cqw] text-gray-800" style={fieldStyle(VERSO.atividade2)}>
                      {form.atividade2}
                    </span>

                    <span className="font-mono text-[1.05cqw] text-gray-800" style={fieldStyle(VERSO.georef)}>
                      {form.georef}
                    </span>

                  </div>
                </div>
              ) : (
                <PlaceholderCard titulo="verso" />
              )}
            </div>

          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="rounded-xl bg-gray-50 p-4 text-xs text-gray-600">
        <p className="mb-2 font-semibold">Campos do Cartão:</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p><strong>Registro:</strong> Número de registro</p>
            <p><strong>CPF:</strong> Cadastro de Pessoa Física</p>
            <p><strong>Nome:</strong> Nome do produtor</p>
            <p><strong>Propriedade:</strong> Nome da propriedade</p>
          </div>
          <div>
            <p><strong>UNLOC:</strong> Código do município</p>
            <p><strong>Início:</strong> Data de início</p>
            <p><strong>Validade:</strong> Data de validade</p>
            <p><strong>Endereço/Atividades:</strong> Verso do cartão</p>
          </div>
        </div>
      </div>
    </div>
  );
}