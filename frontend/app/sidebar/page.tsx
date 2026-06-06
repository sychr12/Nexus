"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  DollarSign,
  CreditCard,
  Mail,
  PieChart,
  BarChart3,
  LogOut,
  Bell,
  User,
  Menu,
  X,
  Home,
  Plus,
  Search,
  Paperclip,
  Key,
  RotateCcw,
  MessageCircle,
} from "lucide-react";

// Paleta de cores da sua imagem
const COLORS = {
  primary: "#2D452F",
  secondary: "#4C6A4B",
  accent: "#6B9D4A",
  light: "#CFE2CE",
  white: "#FFFFFF",
  textLight: "#A8C4A0",
};

const TOP_ITEMS = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "dashboard", label: "Dashboard / KPIs", icon: LayoutDashboard, href: "/dashboard" },
  { id: "relatorios", label: "Relatórios", icon: PieChart, href: "/relatorios" },
  { id: "memorando", label: "Memorando de Saída", icon: FileText, href: "/memorando" },
  { id: "lancamentos", label: "Lançamentos", icon: DollarSign, href: "/lancamentos" },
  { id: "carteira", label: "Carteira Digital", icon: CreditCard, href: "/carteira" },
  { id: "adicionar", label: "Adicionar", icon: Plus, href: "/adicionar" },
  { id: "consultar", label: "Consultar", icon: Search, href: "/tabela" },
  { id: "anexar", label: "Anexar", icon: Paperclip, href: "/anexar" },
  { id: "analises", label: "Análises", icon: BarChart3, href: "/analises" },
  { id: "emails", label: "E-mails", icon: Mail, href: "/email" },
  { id: "mensagens", label: "Mensagens", icon: MessageCircle, href: "/mensagens" },
  { id: "senha", label: "Senha", icon: Key, href: "/senha" },
  { id: "Gerenciamento de Usuarios", label: "Gerenciamento de Usuários", icon: User, href: "/users" },
  { id: "devolucao", label: "Devolução", icon: RotateCcw, href: "/devolucao" },
  { id: "notificacao", label: "Notificação", icon: Bell, href: "/notificacao" },
];

interface TopBarProps {
  onLogout: () => void;
  username: string;
}

// Animações CSS
const animations = `
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
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

@keyframes shine {
  to {
    background-position: 200% center;
  }
}

@keyframes glow {
  0% {
    box-shadow: 0 0 0px rgba(107, 157, 74, 0);
  }
  50% {
    box-shadow: 0 0 20px rgba(107, 157, 74, 0.5);
  }
  100% {
    box-shadow: 0 0 0px rgba(107, 157, 74, 0);
  }
}
`;

export default function TopBar({ onLogout, username }: TopBarProps) {
  const router = useRouter();
  const activePath = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    // Adiciona estilos de animação
    if (!document.getElementById("topbar-animations")) {
      const style = document.createElement("style");
      style.id = "topbar-animations";
      style.textContent = animations;
      document.head.appendChild(style);
    }

    const initialTimer = window.setTimeout(() => setCurrentTime(new Date()), 0);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Ativa animações após montagem
    setTimeout(() => setAnimated(true), 100);
    
    return () => {
      window.clearTimeout(initialTimer);
      clearInterval(timer);
    };
  }, []);

  const handleNavigation = (href: string) => {
    router.push(href);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header 
        className="fixed top-0 left-0 right-0 z-50 shadow-lg" 
        style={{ 
          backgroundColor: COLORS.primary,
          animation: animated ? "fadeInDown 0.6s ease-out" : "none"
        }}
      >
        {/* Logo e informações do usuário */}
        <div className="px-6 py-2 border-b" style={{ borderBottomColor: COLORS.secondary }}>
          <div className="flex items-center justify-between">
            {/* Logo com animação */}
            <div className="flex items-center gap-0" style={{ animation: animated ? "slideInLeft 0.5s ease-out" : "none" }}>
              <div className="relative h-16 w-20 overflow-hidden rounded-xl lg:h-20 lg:w-30">
                <Image
                  src="/sicpr-badge.png"
                  alt="Logo SICPR"
                  width={1536}
                  height={1024}
                  priority
                  className="absolute left-1/2 top-1/2 w-32 -translate-x-1/2 -translate-y-1/2 object-contain lg:w-44 transition-transform duration-300 hover:scale-110"
                  style={{ filter: "brightness(0) saturate(100%) invert(54%) sepia(33%) saturate(707%) hue-rotate(50deg) brightness(94%) contrast(88%) drop-shadow(0 4px 8px rgba(0,0,0,0.18))" }}
                />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">SICPR</h1>
                <p className="text-xs" style={{ color: COLORS.light }}>Sistema Integrado de Controle</p>
              </div>
            </div>

            {/* Desktop - Info com animação */}
            <div className="hidden lg:flex items-center gap-4" style={{ animation: animated ? "slideInRight 0.5s ease-out" : "none" }}>
              <div 
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 hover:scale-105" 
                style={{ backgroundColor: COLORS.secondary }}
              >
                <span className="text-xs text-white transition-colors duration-300">
                  {currentTime ? currentTime.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "--/--/----"}
                </span>
                <span className="text-xs text-white/50">•</span>
                <span className="text-xs text-white font-mono">
                  {currentTime ? currentTime.toLocaleTimeString("pt-BR") : "--:--:--"}
                </span>
              </div>

              <button 
                className="relative p-2 rounded-lg hover:bg-white/10 transition-all duration-300 hover:scale-110"
                style={{ animation: animated ? "pulse 2s infinite" : "none" }}
              >
                <Bell size={18} className="text-white" />
              </button>

              <div className="flex items-center gap-3 pl-3 border-l border-white/20">
                <div className="text-right">
                  <p className="text-sm font-medium text-white transition-colors duration-300 hover:text-accent">{username}</p>
                  <p className="text-xs" style={{ color: COLORS.light }}>Administrador</p>
                </div>
                <div 
                  className="w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all duration-300 hover:scale-110 hover:shadow-lg" 
                  style={{ backgroundColor: COLORS.accent }}
                >
                  <User size={16} className="text-white" />
                </div>
              </div>

              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all duration-300 hover:scale-105"
              >
                <LogOut size={16} />
                <span>Sair</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-all duration-300 hover:scale-110"
            >
              {mobileMenuOpen ? <X size={24} className="animate-spin" /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Abas - Desktop com animação */}
        <div className="hidden lg:block px-6 py-1">
          <div className="flex items-center justify-center">
            <nav className="flex items-center justify-center gap-1 flex-wrap" style={{ animation: animated ? "fadeIn 0.8s ease-out" : "none" }}>
              {TOP_ITEMS.map((item, index) => {
                const Icon = item.icon;
                const isActive = activePath === item.href;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.href)}
                    className={`
                      flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-300 whitespace-nowrap
                      ${isActive 
                        ? "text-white shadow-sm" 
                        : "text-white/70 hover:text-white hover:bg-white/10"
                      }
                    `}
                    style={{
                      backgroundColor: isActive ? COLORS.accent : "transparent",
                      animation: animated ? `fadeIn 0.4s ease-out ${index * 0.02}s both` : "none",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <Icon size={12} className="transition-transform duration-300 group-hover:scale-110" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Menu Mobile Dropdown com animação */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 z-40" style={{ top: '81px', animation: "fadeInDown 0.3s ease-out" }}>
          <div className="absolute inset-0 bg-black/50 animate-fadeIn" onClick={() => setMobileMenuOpen(false)} />
          <div 
            className="absolute top-0 left-0 right-0 max-h-[calc(100vh-81px)] overflow-y-auto" 
            style={{ 
              backgroundColor: COLORS.primary,
              animation: "slideInLeft 0.3s ease-out"
            }}
          >
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110" 
                  style={{ backgroundColor: COLORS.accent }}
                >
                  <User size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">{username}</p>
                  <p className="text-xs text-white/60">Administrador</p>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-red-500/20 text-red-300 transition-all duration-300 hover:scale-105 hover:bg-red-500/30"
                >
                  <LogOut size={16} />
                  Sair
                </button>
              </div>
            </div>
            <nav className="p-4 space-y-1">
              {TOP_ITEMS.map((item, index) => {
                const Icon = item.icon;
                const isActive = activePath === item.href;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.href)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                      ${isActive 
                        ? "text-white" 
                        : "text-white/70 hover:text-white hover:bg-white/10"
                      }
                    `}
                    style={{
                      backgroundColor: isActive ? COLORS.accent : "transparent",
                      animation: `fadeIn 0.3s ease-out ${index * 0.03}s both`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateX(5px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                  >
                    <Icon size={20} className="transition-transform duration-300" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <div style={{ height: '104px' }} />
    </>
  );
}
