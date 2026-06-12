// frontend/app/carteira/components/BatchUpload.tsx
"use client";

import { useState } from "react";
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { formatBytes, UPLOAD_LIMITS, validateBatchPdfs, validateBatchZip } from "@/app/_lib/uploadLimits";
import { enviarBatchFiles, enviarBatchZip, BatchResult } from "../services/carteiraService";

export default function BatchUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<"pdfs" | "zip">("pdfs");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files);
      try {
        validateBatchPdfs(fileList);
        setFiles(fileList);
        setResult(null);
        setError(null);
      } catch (err) {
        setFiles([]);
        e.target.value = "";
        setError(err instanceof Error ? err.message : "Arquivos invalidos");
      }
    }
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        validateBatchZip(e.target.files[0]);
        setFiles([e.target.files[0]]);
        setResult(null);
        setError(null);
      } catch (err) {
        setFiles([]);
        e.target.value = "";
        setError(err instanceof Error ? err.message : "ZIP invalido");
      }
    }
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      setError("Selecione pelo menos um arquivo");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await enviarBatchFiles(files);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar lote");
    } finally {
      setIsLoading(false);
    }
  };

  const uploadZip = async () => {
    if (files.length === 0) {
      setError("Selecione um arquivo ZIP");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await enviarBatchZip(files[0]);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar ZIP");
    } finally {
      setIsLoading(false);
    }
  };

  const formatarTempo = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex gap-4 border-b border-gray-200 pb-4">
          <button
            onClick={() => { setUploadType("pdfs"); setFiles([]); setResult(null); }}
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
            onClick={() => { setUploadType("zip"); setFiles([]); setResult(null); }}
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
            <p className="mt-2 text-xs text-gray-500">
              Max. {UPLOAD_LIMITS.carteiraBatchMaxFiles} PDFs, {formatBytes(UPLOAD_LIMITS.carteiraBatchPdfMaxBytes)} por arquivo
            </p>
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
            {files.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">Arquivo: {files[0].name}</p>
                <button
                  onClick={uploadZip}
                  disabled={isLoading}
                  className="mt-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? "Processando..." : "Processar ZIP"}
                </button>
              </div>
            )}
            <p className="mt-2 text-xs text-gray-500">
              O ZIP deve conter apenas PDFs com nome = CPF. Max. {formatBytes(UPLOAD_LIMITS.carteiraBatchZipMaxBytes)}
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

            {result.detalhes && result.detalhes.length > 0 && (
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
                          <td className="px-3 py-2 text-sm truncate max-w-[200px]">{item.arquivo}</td>
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

      <div className="rounded-2xl bg-blue-50 p-6">
        <h3 className="font-semibold text-blue-900">Instruções</h3>
        <ul className="mt-2 list-inside list-disc text-sm text-blue-800">
          <li>Os arquivos PDF devem ter o nome igual ao CPF do produtor (ex: 12345678901.pdf)</li>
          <li>O sistema consultará automaticamente a SEFAZ para buscar os dados do produtor</li>
          <li>O ZIP deve conter apenas arquivos PDF com nome = CPF</li>
        </ul>
      </div>
    </div>
  );
}
