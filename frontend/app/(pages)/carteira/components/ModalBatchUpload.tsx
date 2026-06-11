// frontend/app/carteira/components/ModalBatchUpload.tsx
"use client";

import { useState } from "react";
import { X, Upload, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { apiFetch, throwIfNotOk } from "@/app/_lib/http";

interface BatchResult {
  batchId: string;
  totalArquivos: number;
  sucessos: number;
  erros: number;
  ignorados: number;
  tempoTotalMs: number;
  detalhes: Array<{
    arquivo: string;
    cpf: string;
    sucesso: boolean;
    mensagem: string;
  }>;
}

interface ModalBatchUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalBatchUpload({ isOpen, onClose, onSuccess }: ModalBatchUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<"pdfs" | "zip">("pdfs");

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files);
      setFiles(fileList);
      setResult(null);
      setError(null);
    }
  };

  const handleZipChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const zipFile = e.target.files[0];
      await uploadZip(zipFile);
    }
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      setError("Selecione pelo menos um arquivo PDF");
      return;
    }

    const formData = new FormData();
    files.forEach(file => {
      formData.append("files", file);
    });

    await upload(formData, "/batch/upload");
  };

  const uploadZip = async (zipFile: File) => {
    const formData = new FormData();
    formData.append("file", zipFile);
    await upload(formData, "/batch/zip");
  };

  const upload = async (formData: FormData, endpoint: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await apiFetch(`/carteira${endpoint}`, {
        method: "POST",
        body: formData,
      });
      await throwIfNotOk(response);

      const data = await response.json();
      setResult(data);
      if (data.sucessos > 0) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar lote");
    } finally {
      setIsLoading(false);
    }
  };

  const formatarTempo = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const resetForm = () => {
    setFiles([]);
    setResult(null);
    setError(null);
    setUploadType("pdfs");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Gerar Carteiras em Lote</h2>
            <p className="text-sm text-gray-500">
              Processe múltiplas carteiras digitais a partir de arquivos PDF
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Tipo de upload */}
          <div className="mb-6 flex gap-4 border-b border-gray-200 pb-4">
            <button
              onClick={() => setUploadType("pdfs")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                uploadType === "pdfs"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <FileText size={16} />
              Múltiplos PDFs
            </button>
            <button
              onClick={() => setUploadType("zip")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                uploadType === "zip"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Upload size={16} />
              Arquivo ZIP
            </button>
          </div>

          {uploadType === "pdfs" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Selecionar PDFs
              </label>
              <input
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 p-2 text-sm"
              />
              {files.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">{files.length} arquivo(s) selecionado(s)</p>
                  <button
                    onClick={uploadFiles}
                    disabled={isLoading}
                    className="mt-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {isLoading ? "Processando..." : "Processar Lote"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Enviar ZIP com PDFs
              </label>
              <input
                type="file"
                accept=".zip"
                onChange={handleZipChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 p-2 text-sm"
              />
              <p className="mt-2 text-xs text-gray-500">
                O ZIP deve conter apenas arquivos PDF com nome = CPF
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-4 text-red-700">
              <strong>Erro:</strong> {error}
            </div>
          )}

          {isLoading && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-blue-50 p-4 text-blue-700">
              <Loader2 className="h-5 w-5 animate-spin" />
              Processando arquivos, aguarde...
            </div>
          )}

          {result && (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="font-semibold text-gray-900">Resumo do Processamento</h3>
                <div className="mt-3 grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{result.totalArquivos}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{result.sucessos}</p>
                    <p className="text-xs text-gray-500">Sucessos</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{result.erros}</p>
                    <p className="text-xs text-gray-500">Erros</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">{result.ignorados}</p>
                    <p className="text-xs text-gray-500">Ignorados</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Tempo total: {formatarTempo(result.tempoTotalMs)}
                </p>
              </div>

              {result.detalhes.length > 0 && (
                <div>
                  <h3 className="mb-2 font-semibold text-gray-900">Detalhes</h3>
                  <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Arquivo</th>
                          <th className="px-3 py-2 text-left">CPF</th>
                          <th className="px-3 py-2 text-center">Status</th>
                          <th className="px-3 py-2 text-left">Mensagem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {result.detalhes.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm">{item.arquivo}</td>
                            <td className="px-3 py-2 font-mono text-sm">{item.cpf || "—"}</td>
                            <td className="px-3 py-2 text-center">
                              {item.sucesso ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-600" />
                              )}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-600">{item.mensagem}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer com instruções */}
        <div className="sticky bottom-0 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="rounded-lg bg-blue-50 p-3">
            <h4 className="text-sm font-semibold text-blue-900">Instruções</h4>
            <ul className="mt-1 list-inside list-disc text-xs text-blue-800">
              <li>Os arquivos PDF devem ter o nome igual ao CPF do produtor (ex: 12345678901.pdf)</li>
              <li>O sistema consultará automaticamente a SEFAZ para buscar os dados do produtor</li>
              <li>O ZIP deve conter apenas arquivos PDF com nome = CPF</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
