"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  DollarSign,
  CreditCard,
  PieChart,
  BarChart3,
  LogOut,
  User,
  Menu,
  X,
  Search,
  Building2,
  UserCheck,
  ChevronLeft,
  MessageCircle,
  ClipboardList,
  IdCard,
} from "lucide-react";
import { getCurrentSession } from "@/app/_lib/auth";
import { MENU_ACCESS, ROLE_LABELS, normalizeRole } from "@/app/_lib/access-control";

// Paleta de cores
const COLORS = {
  primary: "#2D452F",
  secondary: "#4C6A4B",
  accent: "#6B9D4A",
  light: "#CFE2CE",
  white: "#FFFFFF",
  textLight: "#A8C4A0",
};

// LISTA COMPLETA DE ITENS DO MENU - TODAS AS ABAS
const MENU_ITEMS = [
  { id: "dashboard", label: "Dashboard / KPIs", icon: LayoutDashboard, href: "/dashboard" },
  { id: "relatorios", label: "Relatórios", icon: PieChart, href: "/relatorios" },
  { id: "unloc", label: "Unidade Local", icon: Building2, href: "/unloc" },
  { id: "gerente", label: "Gerente de Unidade Local", icon: UserCheck, href: "/gerente" },
  { id: "memorandos-assinados", label: "Central de Memorandos", icon: FileText, href: "/memorandos-assinados" },
  { id: "memorando", label: "Memorando de Saída", icon: FileText, href: "/memorando" },
  { id: "carteira", label: "Carteira Digital", icon: CreditCard, href: "/carteira" },
  // Aba Adicionar pausada temporariamente. Mantida no projeto para reativacao futura.
  // { id: "adicionar", label: "Adicionar", icon: PlusCircle, href: "/adicionar" },
  { id: "consultar", label: "Consultar", icon: Search, href: "/tabela" },
  { id: "analises", label: "Análises", icon: BarChart3, href: "/analises" },
  { id: "lancamentos", label: "Lançamentos", icon: DollarSign, href: "/lancamentos" },
  { id: "mensagens", label: "Mensagens", icon: MessageCircle, href: "/mensagens" },
  { id: "usuarios", label: "Gerenciamento de Usuários", icon: User, href: "/users" },
  { id: "auditoria", label: "Auditoria", icon: ClipboardList, href: "/auditoria" },
];

const PROFILE_MENU_ITEM = { id: "perfil", label: "Perfil", icon: IdCard, href: "/perfil" };

interface SidebarProps {
  onLogout: () => void;
  username: string;
  role?: string;
  onCollapsedChange?: (collapsed: boolean) => void;
}

// Animações CSS
const animations = `
@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes logoutPulse {
  0% { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.34); }
  70% { box-shadow: 0 0 0 10px rgba(248, 113, 113, 0); }
  100% { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0); }
}
@keyframes logoutIconExit {
  0% { transform: translateX(0); opacity: 1; }
  55% { transform: translateX(5px); opacity: 0.8; }
  100% { transform: translateX(0); opacity: 1; }
}
.sicpr-logout-active {
  animation: logoutPulse 0.7s ease-out;
}
.sicpr-logout-active .sicpr-logout-icon {
  animation: logoutIconExit 0.7s ease-out;
}
.sicpr-sidebar-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(207, 226, 206, 0.42) transparent;
  scrollbar-gutter: stable;
}
.sicpr-sidebar-scroll::-webkit-scrollbar {
  width: 10px;
}
.sicpr-sidebar-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.sicpr-sidebar-scroll::-webkit-scrollbar-thumb {
  background: rgba(207, 226, 206, 0.36);
  border: 3px solid #2D452F;
  border-radius: 999px;
}
.sicpr-sidebar-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(207, 226, 206, 0.55);
}
.sicpr-sidebar-scroll::-webkit-scrollbar-button {
  display: none;
}
`;

export default function Sidebar({ onLogout, username, role: sessionRole, onCollapsedChange }: SidebarProps) {
  const [collapsed, setCollapsedState] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [resolvedSessionRole, setResolvedSessionRole] = useState<string | null>(null);
  const role = normalizeRole(sessionRole || resolvedSessionRole);
  
  const pathname = usePathname();
  const router = useRouter();

  // Função para alterar o estado collapsed e notificar o pai
  const setCollapsed = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setCollapsedState((prev) => {
      const newValue = typeof value === 'function' ? value(prev) : value;
      return newValue;
    });
  }, []);

  useEffect(() => {
    let active = true;
    const mountTimer = window.setTimeout(() => {
      if (!active) return;
      setMounted(true);
      // Recuperar estado salvo do localStorage
      const saved = localStorage.getItem("sidebar-collapsed");
      if (saved !== null) {
        const savedValue = saved === "true";
        setCollapsedState(savedValue);
      }
    }, 0);

    if (!sessionRole) {
      void getCurrentSession(username).then((session) => {
        if (active) setResolvedSessionRole(session.role);
      }).catch(() => {
        if (active) setResolvedSessionRole("USUARIO");
      });
    }

    return () => {
      active = false;
      window.clearTimeout(mountTimer);
    };
  }, [sessionRole, username]);

  useEffect(() => {
    if (!mounted) return;
    onCollapsedChange?.(collapsed);
  }, [collapsed, mounted, onCollapsedChange]);

  // Salvar estado no localStorage quando mudar
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("sidebar-collapsed", String(collapsed));
    }
  }, [collapsed, mounted]);

  useEffect(() => {
    if (!mounted) return;
    
    const initialTimer = window.setTimeout(() => setCurrentTime(new Date()), 0);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    if (!document.getElementById("sidebar-animations")) {
      const style = document.createElement("style");
      style.id = "sidebar-animations";
      style.textContent = animations;
      document.head.appendChild(style);
    }
    
    return () => {
      window.clearTimeout(initialTimer);
      clearInterval(timer);
    };
  }, [mounted]);

  const handleNavigation = useCallback((href: string) => {
    if (!mounted) return;
    try {
      router.push(href);
    } catch {
      window.location.href = href;
    }
    setMobileMenuOpen(false);
  }, [router, mounted]);

  const handleLogout = useCallback(() => {
    if (!mounted || isLoggingOut) return;

    setIsLoggingOut(true);
    setMobileMenuOpen(false);
    window.setTimeout(() => {
      onLogout();
    }, 650);
  }, [isLoggingOut, onLogout, mounted]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed(prev => !prev);
  }, [setCollapsed]);

  const visibleMenuItems = [
    ...MENU_ITEMS.filter((item) => MENU_ACCESS[item.id]?.includes(role)),
    PROFILE_MENU_ITEM,
  ];
  const roleLabel = ROLE_LABELS[role] || "Usuário";

  // Renderizar placeholder durante SSR
  if (!mounted) {
    return (
      <div className="hidden lg:block fixed left-0 top-0 bottom-0 w-[72px] lg:w-[260px] bg-[#2D452F]" />
    );
  }

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 shadow-lg" style={{ backgroundColor: COLORS.primary }}>
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative h-10 w-10">
              {!imgError ? (
                <Image
                  src="/sicpr-badge.png"
                  alt="Logo SICPR"
                  width={40}
                  height={40}
                  className="h-full w-full object-contain"
                  onError={() => setImgError(true)}
                  priority
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
              )}
            </div>
            <h1 className="text-lg font-bold text-white">SICPR</h1>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="p-2 rounded-lg text-white hover:bg-white/10 transition-all"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside 
        className={`
          hidden lg:flex lg:flex-col fixed left-0 top-0 bottom-0 z-50 
          transition-all duration-300 shadow-2xl
          ${collapsed ? 'w-[72px]' : 'w-[260px]'}
        `} 
        style={{ backgroundColor: COLORS.primary }}
      >
        {/* Logo Area */}
        <div className={`py-6 ${collapsed ? 'px-2' : 'px-4'} border-b`} style={{ borderBottomColor: COLORS.secondary }}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
            <div className={`flex items-center gap-2 overflow-hidden ${collapsed ? 'justify-center w-full' : ''}`}>
              {/* Logo - Tamanho ajustado para collapsed */}
              <div className={`relative ${collapsed ? 'h-13 w-60' : 'h-12 w-14'} flex-shrink-0`}>
                {!imgError ? (
                  <Image
                    src="/sicpr-badge.png"
                    alt="Logo SICPR"
                    width={collapsed ? 40 : 76}
                    height={collapsed ? 40 : 57}
                    className="h-full w-full object-contain"
                    onError={() => setImgError(true)}
                    priority
                  />
                ) : (
                  <div className={`${collapsed ? 'h-8 w-8' : 'h-12 w-14'} rounded-lg bg-white/20 flex items-center justify-center`}>
                    <span className={`text-white font-bold ${collapsed ? 'text-sm' : 'text-xl'}`}>S</span>
                  </div>
                )}
              </div>
              {!collapsed && (
                <div className="flex-shrink-0">
                  <h1 className="text-xl font-bold text-white">SICPR</h1>
                  <p className="text-xs" style={{ color: COLORS.light }}>Sistema Integrado</p>
                </div>
              )}
            </div>
            {!collapsed && (
              <button 
                onClick={toggleCollapsed} 
                className="p-1.5 rounded-lg text-white hover:bg-white/10 transition-all flex-shrink-0"
              >
                <ChevronLeft size={18} />
              </button>
            )}
          </div>
          {/* Botão recolher quando está colapsado - aparece no hover */}
          {collapsed && (
            <button 
              onClick={toggleCollapsed} 
              className="absolute -right-3 top-20 p-1 rounded-full text-white transition-all hover:brightness-110"
              style={{
                backgroundColor: COLORS.primary,
                boxShadow: "0 0 0 1px rgba(0,0,0,0.28), 0 4px 12px rgba(0,0,0,0.35)",
              }}
            >
              <ChevronLeft size={14} className="rotate-180" />
            </button>
          )}
        </div>

        {/* User Info */}
        <div className={`py-4 ${collapsed ? 'px-2' : 'px-4'} border-b`} style={{ borderBottomColor: COLORS.secondary }}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <div className={`${collapsed ? 'w-7 h-7' : 'w-9 h-9'} rounded-full flex items-center justify-center shadow-md transition-all hover:scale-105 flex-shrink-0`} style={{ backgroundColor: COLORS.accent }}>
              <User size={collapsed ? 14 : 16} className="text-white" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{username}</p>
                <p className="text-xs" style={{ color: COLORS.light }}>{roleLabel}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="sicpr-sidebar-scroll flex-1 py-4 overflow-y-auto">
          <div className={`space-y-1 ${collapsed ? 'px-1' : 'px-3'}`}>
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.href)}
                  className={`
                    w-full flex items-center gap-3 rounded-lg transition-all duration-300
                    ${collapsed ? 'justify-center py-2 px-0' : 'py-2.5 px-3'}
                    ${isActive 
                      ? 'text-white shadow-sm' 
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                    }
                  `}
                  style={{ backgroundColor: isActive ? COLORS.accent : 'transparent' }}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={collapsed ? 18 : 18} className="flex-shrink-0" />
                  {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className={`py-4 ${collapsed ? 'px-2' : 'px-4'} border-t`} style={{ borderTopColor: COLORS.secondary }}>
          {!collapsed && (
            <div className="mb-3 px-1">
              <div className="flex items-center justify-between px-2 py-1.5 rounded-lg" style={{ backgroundColor: COLORS.secondary }}>
                <span className="text-xs text-white">
                  {currentTime ? currentTime.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "--/--"}
                </span>
                <span className="text-xs text-white font-mono">
                  {currentTime ? currentTime.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                </span>
              </div>
            </div>
          )}
          
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            aria-busy={isLoggingOut}
            className={`
              relative w-full overflow-hidden flex items-center gap-3 rounded-lg transition-all duration-300 hover:scale-105 disabled:cursor-wait
              ${collapsed ? 'justify-center py-2 px-0' : 'py-2 px-3'}
              ${isLoggingOut
                ? 'sicpr-logout-active bg-red-500/25 text-red-100'
                : 'text-red-300 hover:bg-red-500/20 hover:text-red-200'
              }
            `}
            title={collapsed ? (isLoggingOut ? "Saindo..." : "Sair") : undefined}
          >
            <LogOut size={collapsed ? 18 : 18} className="sicpr-logout-icon relative z-10 flex-shrink-0" />
            {!collapsed && <span className="relative z-10 text-sm">{isLoggingOut ? "Saindo..." : "Sair"}</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40" style={{ top: '57px' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute top-0 left-0 right-0 max-h-[calc(100vh-57px)] overflow-y-auto" style={{ backgroundColor: COLORS.primary }}>
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.accent }}>
                  <User size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">{username}</p>
                  <p className="text-xs text-white/60">{roleLabel}</p>
                </div>
                <button 
                  onClick={handleLogout} 
                  disabled={isLoggingOut}
                  aria-busy={isLoggingOut}
                  className={`relative overflow-hidden flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all disabled:cursor-wait ${
                    isLoggingOut ? "sicpr-logout-active bg-red-500/30 text-red-100" : "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                  }`}
                >
                  <LogOut size={16} className="sicpr-logout-icon relative z-10" />
                  <span className="relative z-10">{isLoggingOut ? "Saindo..." : "Sair"}</span>
                </button>
              </div>
            </div>
            <nav className="p-4 space-y-1">
              {visibleMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.href)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                      ${isActive ? 'text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}
                    `}
                    style={{ backgroundColor: isActive ? COLORS.accent : 'transparent' }}
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
    </>
  );
}
