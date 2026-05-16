// frontend/app/carteira/components/FormularioCarteira.tsx
"use client";

import { useState, useEffect } from "react";
import { CarteiraRequest } from "../types/carteira";

const UNLOC_CODES: Record<string, string> = {
  "Manaus": "MAO", "Parintins": "PAR", "Itacoatiara": "ITA",
  "Coari": "COA", "Tefé": "TEF", "Tabatinga": "TAB",
  "Humaitá": "HUM", "Lábrea": "LAB", "Manicoré": "MCO",
  "Iranduba": "IRA", "Rio Preto da Eva": "RPE", "Presidente Figueiredo": "PFIG",
  "Novo Airão": "NAI", "Careiro": "CAI", "Careiro da Várzea": "CAV",
  "Autazes": "AUT", "Borba": "BOR", "Nova Olinda do Norte": "NON",
};

interface FormularioCarteiraProps {
  onSubmit: (data: CarteiraRequest) => Promise<void>;
  isLoading?: boolean;
  initialData?: Partial<CarteiraRequest>;
  onFormChange?: (data: CarteiraRequest) => void; // Adicionar esta linha
}

export default function FormularioCarteira({ 
  onSubmit, 
  isLoading = false,
  initialData,
  onFormChange 
}: FormularioCarteiraProps) {
  const [form, setForm] = useState<CarteiraRequest>({
    registro: initialData?.registro || "",
    cpf: initialData?.cpf || "",
    nome: initialData?.nome || "",
    propriedade: initialData?.propriedade || "",
    unloc: initialData?.unloc || "",
    inicio: initialData?.inicio || "",
    validade: initialData?.validade || "",
    endereco: initialData?.endereco || "",
    atividade1: initialData?.atividade1 || "",
    atividade2: initialData?.atividade2 || "",
    georef: initialData?.georef || "",
    fotos: [],
  });

  const [fotosPreview, setFotosPreview] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Notificar mudanças do formulário para o componente pai
  useEffect(() => {
    if (onFormChange) {
      onFormChange(form);
    }
  }, [form, onFormChange]);

  const handleChange = (field: keyof CarteiraRequest, value: string) => {
    setForm({ ...form, [field]: value });
    setError(null);
  };

  const handleFotoChange = (index: number, file: File | null) => {
    const novasFotos = [...(form.fotos || [])];
    const novosPreviews = [...fotosPreview];

    if (file) {
      novasFotos[index] = file;
      const reader = new FileReader();
      reader.onloadend = () => {
        novosPreviews[index] = reader.result as string;
        setFotosPreview(novosPreviews);
      };
      reader.readAsDataURL(file);
    } else {
      delete novasFotos[index];
      delete novosPreviews[index];
    }

    setForm({ ...form, fotos: novasFotos.filter(Boolean) });
    setFotosPreview(novosPreviews.filter(Boolean));
  };

  const formatarCpf = (value: string) => {
    const numeros = value.replace(/\D/g, "");
    if (numeros.length <= 11) {
      return numeros
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return value;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.registro || !form.cpf || !form.nome || !form.propriedade || !form.unloc) {
      setError("Preencha todos os campos obrigatórios (*)");
      return;
    }

    const cpfNumeros = form.cpf.replace(/\D/g, "");
    if (cpfNumeros.length !== 11) {
      setError("CPF inválido. Deve conter 11 dígitos");
      return;
    }

    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Registro Estadual *
          </label>
          <input
            type="text"
            value={form.registro}
            onChange={(e) => handleChange("registro", e.target.value)}
            placeholder="Ex: 001/2025"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            CPF *
          </label>
          <input
            type="text"
            value={form.cpf}
            onChange={(e) => handleChange("cpf", formatarCpf(e.target.value))}
            placeholder="000.000.000-00"
            maxLength={14}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Nome do Produtor *
        </label>
        <input
          type="text"
          value={form.nome}
          onChange={(e) => handleChange("nome", e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Propriedade *
        </label>
        <input
          type="text"
          value={form.propriedade}
          onChange={(e) => handleChange("propriedade", e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            UNLOC (Município) *
          </label>
          <select
            value={form.unloc}
            onChange={(e) => handleChange("unloc", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            required
          >
            <option value="">Selecione o município</option>
            {Object.entries(UNLOC_CODES).map(([municipio, sigla]) => (
              <option key={sigla} value={sigla}>
                {sigla} - {municipio}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Endereço
          </label>
          <input
            type="text"
            value={form.endereco}
            onChange={(e) => handleChange("endereco", e.target.value)}
            placeholder="Endereço completo da propriedade"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Data de Início
          </label>
          <input
            type="date"
            value={form.inicio}
            onChange={(e) => handleChange("inicio", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Data de Validade
          </label>
          <input
            type="date"
            value={form.validade}
            onChange={(e) => handleChange("validade", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Atividade Principal
        </label>
        <textarea
          value={form.atividade1}
          onChange={(e) => handleChange("atividade1", e.target.value)}
          rows={2}
          placeholder="Descreva a atividade principal do produtor"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Atividade Secundária
        </label>
        <textarea
          value={form.atividade2}
          onChange={(e) => handleChange("atividade2", e.target.value)}
          rows={2}
          placeholder="Descreva a atividade secundária (opcional)"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Georreferenciamento
        </label>
        <input
          type="text"
          value={form.georef}
          onChange={(e) => handleChange("georef", e.target.value)}
          placeholder="Coordenadas geográficas (latitude, longitude)"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Fotos (até 3)
        </label>
        <div className="mt-2 grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="space-y-2">
              {fotosPreview[index] ? (
                <div className="relative">
                  <img
                    src={fotosPreview[index]}
                    alt={`Preview ${index + 1}`}
                    className="h-32 w-full rounded-lg border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleFotoChange(index, null)}
                    className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-green-500">
                  <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="mt-1 text-xs text-gray-500">Foto {index + 1}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFotoChange(index, e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500">Formatos aceitos: JPG, PNG (máx. 5MB cada)</p>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
      >
        {isLoading ? "Salvando..." : "Salvar Carteira Digital"}
      </button>
    </form>
  );
}