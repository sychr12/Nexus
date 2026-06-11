// frontend/app/carteira/visualizar/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { buscarCarteiraPorId, baixarPdf, visualizarPdf } from "../../services/carteiraService";
import { CarteiraResponse } from "../../types/carteira";
import { Download, Eye, ArrowLeft, Calendar, MapPin, User, Building2, FileText } from "lucide-react";

export default function VisualizarCarteiraPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [carteira, setCarteira] = useState<CarteiraResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function carregar() {
      try {
        setIsLoading(true);
        setError(null);
        const entry = await buscarCarteiraPorId(parseInt(id));
        setCarteira(entry);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar registro");
      } finally {
        setIsLoading(false);
      }
    }

    carregar();
  }, [id]);

  const formatarCpf = (cpf: string) => {
    if (!cpf) return "—";
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatarData = (data: string) => {
    if (!data) return "—";
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <div className="flex items-center justify-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-600 border-t-transparent"></div>
              <span className="text-gray-500">Carregando carteira...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Detalhes da Carteira Digital</h1>
              <p className="mt-2 text-gray-600">
                Visualize todas as informações do produtor rural.
              </p>
            </div>
            <button
              onClick={() => router.push("/carteira")}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <ArrowLeft size={16} />
              Voltar
            </button>
          </div>
        </header>

        {error && (
          <div className="rounded-xl bg-rose-50 p-4 text-rose-700">
            <strong>Erro:</strong> {error}
          </div>
        )}

        {carteira && (
          <>
            {/* Ações */}
            <div className="flex gap-3">
              <button
                onClick={() => visualizarPdf(carteira.id)}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
              >
                <Eye size={16} />
                Visualizar PDF
              </button>
              <button
                onClick={() => baixarPdf(carteira.id, carteira.nome)}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
              >
                <Download size={16} />
                Baixar PDF
              </button>
            </div>

            {/* Informações principais */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Dados do Produtor</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <FileText size={14} />
                    Registro Estadual
                  </div>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{carteira.registro}</p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <User size={14} />
                    Produtor
                  </div>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{carteira.nome}</p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <User size={14} />
                    CPF
                  </div>
                  <p className="mt-1 text-gray-900">{formatarCpf(carteira.cpf)}</p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Building2 size={14} />
                    Propriedade
                  </div>
                  <p className="mt-1 text-gray-900">{carteira.propriedade}</p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin size={14} />
                    Unidade Local
                  </div>
                  <p className="mt-1">
                    <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                      {carteira.unloc}
                    </span>
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar size={14} />
                    Validade
                  </div>
                  <p className="mt-1 text-gray-900">{formatarData(carteira.validade)}</p>
                </div>
              </div>
            </div>

            {/* Endereço */}
            {carteira.endereco && (
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold text-gray-900">Endereço</h2>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-gray-900">{carteira.endereco}</p>
                </div>
              </div>
            )}

            {/* Atividades */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Atividades</h2>
              <div className="space-y-4">
                {carteira.atividade1 && (
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-500">Atividade Principal</p>
                    <p className="mt-1 text-gray-900">{carteira.atividade1}</p>
                  </div>
                )}
                {carteira.atividade2 && (
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-500">Atividade Secundária</p>
                    <p className="mt-1 text-gray-900">{carteira.atividade2}</p>
                  </div>
                )}
                {carteira.georef && (
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-500">Georreferenciamento</p>
                    <p className="mt-1 font-mono text-sm text-gray-900">{carteira.georef}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Metadados */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Informações do Sistema</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Cadastrado por</p>
                  <p className="mt-1 font-medium text-gray-900">{carteira.usuario}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Data de Cadastro</p>
                  <p className="mt-1 font-medium text-gray-900">{formatarData(carteira.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Fotos */}
            {carteira.fotosBase64 && carteira.fotosBase64.length > 0 && (
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold text-gray-900">Fotos</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  {carteira.fotosBase64.map((foto, index) => (
                    <div key={index} className="overflow-hidden rounded-lg border border-gray-200">
                      <img
                        src={`data:image/jpeg;base64,${foto}`}
                        alt={`Foto ${index + 1}`}
                        className="h-48 w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
