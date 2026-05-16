// frontend/app/sidebar/page.tsx
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
  Upload,
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
  { id: "gerarLote", label: "Gerar Lote", icon: Upload, href: "/carteira/batch" },
  { id: "adicionar", label: "Adicionar", icon: Plus, href: "/adicionar" },
  { id: "consultar", label: "Consultar", icon: Search, href: "/tabela" },
  { id: "anexar", label: "Anexar", icon: Paperclip, href: "/anexar" },
  { id: "analises", label: "Análises", icon: BarChart3, href: "/analises" },
  { id: "emails", label: "E-mails", icon: Mail, href: "/emails" },
  { id: "senha", label: "Senha", icon: Key, href: "/senha" },
  { id: "devolucao", label: "Devolução", icon: RotateCcw, href: "/devolucao" },
  { id: "notificacao", label: "Notificação", icon: Bell, href: "/notificacao" },
];

interface TopBarProps {
  onLogout: () => void;
  username: string;
}

export default function TopBar({ onLogout, username }: TopBarProps) {
  const router = useRouter();
  const activePath = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  // Garantir que o componente só renderize no cliente
  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleNavigation = (href: string) => {
    router.push(href);
    setMobileMenuOpen(false);
  };

  // Se não estiver montado, renderiza um placeholder para evitar hidratação
  if (!mounted) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 shadow-lg" style={{ backgroundColor: COLORS.primary }}>
        <div className="px-6 py-2 border-b" style={{ borderBottomColor: COLORS.secondary }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-0">
              <div className="relative h-16 w-20 overflow-hidden rounded-xl lg:h-20 lg:w-30">
                <Image
                  src="/sicpr-badge.png"
                  alt="Logo SICPR"
                  width={1536}
                  height={1024}
                  priority
                  className="absolute left-1/2 top-1/2 w-[128px] -translate-x-1/2 -translate-y-1/2 object-contain lg:w-[176px]"
                  style={{ filter: "brightness(0) saturate(100%) invert(54%) sepia(33%) saturate(707%) hue-rotate(50deg) brightness(94%) contrast(88%) drop-shadow(0 4px 8px rgba(0,0,0,0.18))" }}
                />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">SICPR</h1>
                <p className="text-xs" style={{ color: COLORS.light }}>Sistema Integrado de Controle</p>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 shadow-lg" style={{ backgroundColor: COLORS.primary }}>
        {/* Logo e informações do usuário */}
        <div className="px-6 py-2 border-b" style={{ borderBottomColor: COLORS.secondary }}>
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-0">
              <div className="relative h-16 w-20 overflow-hidden rounded-xl lg:h-20 lg:w-30">
                <Image
                  src="/sicpr-badge.png"
                  alt="Logo SICPR"
                  width={1536}
                  height={1024}
                  priority
                  className="absolute left-1/2 top-1/2 w-[128px] -translate-x-1/2 -translate-y-1/2 object-contain lg:w-[176px]"
                  style={{ filter: "brightness(0) saturate(100%) invert(54%) sepia(33%) saturate(707%) hue-rotate(50deg) brightness(94%) contrast(88%) drop-shadow(0 4px 8px rgba(0,0,0,0.18))" }}
                />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">SICPR</h1>
                <p className="text-xs" style={{ color: COLORS.light }}>Sistema Integrado de Controle</p>
              </div>
            </div>

            {/* Desktop - Info */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: COLORS.secondary }}>
                <span className="text-xs text-white">
                  {currentTime ? currentTime.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "--/--/----"}
                </span>
                <span className="text-xs text-white/50">•</span>
                <span className="text-xs text-white font-mono">
                  {currentTime ? currentTime.toLocaleTimeString("pt-BR") : "--:--:--"}
                </span>
              </div>

              <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
                <Bell size={18} className="text-white" />
              </button>

              <div className="flex items-center gap-3 pl-3 border-l border-white/20">
                <div className="text-right">
                  <p className="text-sm font-medium text-white" suppressHydrationWarning>{username}</p>
                  <p className="text-xs" style={{ color: COLORS.light }}>Administrador</p>
                </div>
                <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-md" style={{ backgroundColor: COLORS.accent }}>
                  <User size={16} className="text-white" />
                </div>
              </div>

              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors"
              >
                <LogOut size={16} />
                <span>Sair</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Abas - Desktop */}
        <div className="hidden lg:block px-6 py-1">
          <div className="flex items-center justify-center">
            <nav className="flex items-center justify-center gap-1 flex-wrap">
              {TOP_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activePath === item.href;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.href)}
                    className={`
                      flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap
                      ${isActive 
                        ? "text-white shadow-sm" 
                        : "text-white/70 hover:text-white hover:bg-white/10"
                      }
                    `}
                    style={{
                      backgroundColor: isActive ? COLORS.accent : "transparent",
                    }}
                  >
                    <Icon size={12} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Menu Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[81px] z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute top-0 left-0 right-0 max-h-[calc(100vh-81px)] overflow-y-auto" style={{ backgroundColor: COLORS.primary }}>
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.accent }}>
                  <User size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white" suppressHydrationWarning>{username}</p>
                  <p className="text-xs text-white/60">Administrador</p>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-red-500/20 text-red-300"
                >
                  <LogOut size={16} />
                  Sair
                </button>
              </div>
            </div>
            <nav className="p-4 space-y-1">
              {TOP_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activePath === item.href;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.href)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                      ${isActive 
                        ? "text-white" 
                        : "text-white/70 hover:text-white hover:bg-white/10"
                      }
                    `}
                    style={{
                      backgroundColor: isActive ? COLORS.accent : "transparent",
                    }}
                  >
                    <Icon size={20} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <div className="h-[104px] lg:h-[152px]" />
    </>
  );
}