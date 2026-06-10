"use client";

import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import TopBar from "../sidebar/page";
import { useAuthSession } from "../hooks/useAuthSession";
import FormularioCarteira from "./components/FormularioCarteira";
import CardPreview from "./components/CardPreview";
import ModalBatchUpload from "./components/ModalBatchUpload";
import { CarteiraRequest, CarteiraResponse } from "./types/carteira";
import { cadastrarCarteira, listarCarteiras } from "./services/carteiraService";

// Animações CSS
const animations = `
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
`;

const COLORS = {
  background: "#EEF2EC",
  primary: "#1F3A2E",
  textLight: "#6E786F",
};

const initialForm: CarteiraRequest = {
  registro: "",
  cpf: "",
  nome: "",
  propriedade: "",
  unloc: "",
  inicio: "",
  validade: "",
  endereco: "",
  atividade1: "",
  atividade2: "",
  georef: "",
  fotos: [],
};

export default function CarteiraDigitalPage() {
  const { username, logout, ready } = useAuthSession({ defaultUsername: "Usuario" });
  const [form, setForm] = useState<CarteiraRequest>(initialForm);
  const [carteiras, setCarteiras] = useState<CarteiraResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    // Adiciona estilos de animação
    if (!document.getElementById("carteira-animations")) {
      const style = document.createElement("style");
      style.id = "carteira-animations";
      style.textContent = animations;
      document.head.appendChild(style);
    }
    setAnimated(true);
  }, []);

  const carregarCarteiras = async () => {
    try {
      const data = await listarCarteiras(0, 10);
      setCarteiras(data.content);
    } catch (err) {
      console.error("Erro ao carregar carteiras:", err);
    }
  };

  useEffect(() => {
    if (!ready) return;
    carregarCarteiras();
  }, [ready]);

  const handleSubmit = async (data: CarteiraRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      await cadastrarCarteira(data);
      
      setSuccess("Carteira digital cadastrada com sucesso!");
      setForm(initialForm);
      await carregarCarteiras();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar carteira");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (data: CarteiraRequest) => {
    setForm(data);
  };


  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: COLORS.background }}>
      <TopBar onLogout={logout} username={username} />

      <main style={{ paddingTop: "70px", minHeight: "100vh" }}>
        <div className="px-4 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto">
          {/* Page Header com botões */}
          <div 
            className="mb-8 flex items-center justify-between"
            style={{ animation: animated ? "fadeInUp 0.5s ease-out" : "none" }}
          >
            <div>
              <h1
                className="text-3xl font-black tracking-tight transition-all duration-300 hover:translate-x-1"
                style={{ color: COLORS.primary, letterSpacing: "-0.02em" }}
              >
                Carteira Digital do Produtor Rural
              </h1>
              <p className="text-sm mt-1.5 transition-all duration-300 delay-100" style={{ color: COLORS.textLight }}>
                Cadastre e gerencie carteiras digitais dos produtores rurais
              </p>
            </div>
            
            {/* Botão Gerar Lote */}
            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
              style={{
                backgroundColor: "#3b82f6",
                color: "white",
                animation: animated ? "pulse 2s infinite" : "none",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "#2563eb";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "#3b82f6";
              }}
            >
              <Upload size={16} className="transition-transform duration-300 group-hover:rotate-12" />
              Gerar Lote
            </button>
          </div>

          {/* Success banner */}
          {success && (
            <div
              className="mb-6 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-300 hover:scale-[1.02]"
              style={{ 
                backgroundColor: "#DCFCE7", 
                color: "#166534", 
                border: "1px solid #BBF7D0",
                animation: animated ? "slideInUp 0.4s ease-out" : "none"
              }}
            >
              <span className="animate-pulse">✓</span> {success}
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div
              className="mb-6 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-300 hover:scale-[1.02]"
              style={{ 
                backgroundColor: "#FEF2F2", 
                color: "#DC2626", 
                border: "1px solid #FECACA",
                animation: animated ? "slideInUp 0.4s ease-out" : "none"
              }}
            >
              <span>⚠</span> {error}
              <button
                onClick={() => setError(null)}
                className="ml-auto underline text-xs hover:opacity-70 transition-opacity duration-300 hover:scale-105"
              >
                Fechar
              </button>
            </div>
          )}

          {/* Two-column layout */}
          <div className="flex gap-6 items-start">
            {/* Coluna Esquerda - Formulário */}
            <div 
              className="w-1/2 sticky top-6 transition-all duration-500"
              style={{ 
                animation: animated ? "fadeInLeft 0.6s ease-out 0.1s both" : "none",
              }}
            >
              <FormularioCarteira 
                onSubmit={handleSubmit}
                isLoading={isLoading}
                onFormChange={handleFormChange}
              />
            </div>

            {/* Coluna Direita - Preview do Cartão */}
            <div 
              className="w-1/2 transition-all duration-500"
              style={{ 
                animation: animated ? "fadeInRight 0.6s ease-out 0.2s both" : "none",
              }}
            >
              <CardPreview form={form} />
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Gerar Lote */}
      <ModalBatchUpload
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onSuccess={carregarCarteiras}
      />
    </div>
  );
}
