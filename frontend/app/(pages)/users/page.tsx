'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User, UserFilters as UserFiltersType, UserRequest, UserStats as UserStatsType } from './types/user';
import { userService } from './services/user.service';
import UserTable from './components/UserTable';
import UserForm from './components/UserForm';
import UserFilters from './components/UserFilters';
import UserStats from './components/UserStats';
import { AlertTriangle, Check, Clock3, Copy, Loader2, Plus, ShieldCheck, X } from 'lucide-react';
import Sidebar from "@/app/_components/layout/Sidebar";
import { useClientMounted } from '@/app/_hooks/useClientMounted';
import { useAuthSession } from '@/app/_hooks/useAuthSession';
import { logger } from '@/app/_lib/logger';

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

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes slideIn {
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
`;

const COLORS = {
  primary: "#1F3A2E",
  accent: "#6B9D4A",
  danger: "#DC2626",
  textLight: "#6B7C6A",
  card: "#FFFFFF",
  border: "#E2E8E0",
  rowAlt: "#F7FAF7",
  success: "#059669",
  background: "#F5F7F5",
};

type ResetCodeModalState = {
  username: string;
  token: string;
  expiresAt: string;
  copied: boolean;
};

type ResetCodeCacheEntry = Omit<ResetCodeModalState, "copied">;

export default function UsersPage() {
  const { username, role, logout, ready } = useAuthSession({
    defaultUsername: "Usuario",
    allowedRoles: ["ADMIN"],
  });
  const mounted = useClientMounted();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [filters, setFilters] = useState<UserFiltersType>({
    search: '',
    perfil: '',
    status: '',
  });
  const [animated, setAnimated] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
  const [pendingStatusUser, setPendingStatusUser] = useState<User | null>(null);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<User | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [resetCodeModal, setResetCodeModal] = useState<ResetCodeModalState | null>(null);
  const [resetCodeCache, setResetCodeCache] = useState<Record<number, ResetCodeCacheEntry>>({});

  useEffect(() => {
    // Adiciona estilos de animação
    if (!mounted) return;
    
    if (!document.getElementById("users-animations")) {
      const style = document.createElement("style");
      style.id = "users-animations";
      style.textContent = animations;
      document.head.appendChild(style);
    }
    const frame = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(frame);
  }, [mounted]);

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error) {
      logger.error('Erro ao carregar usuarios', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready || !mounted) return;
    const timer = window.setTimeout(() => {
      void loadUsers();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadUsers, ready, mounted]);

  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    if (filters.search) {
      filtered = filtered.filter(
        (user) =>
          user.nomeCompleto.toLowerCase().includes(filters.search!.toLowerCase()) ||
          user.username.toLowerCase().includes(filters.search!.toLowerCase())
      );
    }

    if (filters.perfil) {
      filtered = filtered.filter((user) => user.perfil === filters.perfil);
    }

    if (filters.status) {
      filtered = filtered.filter((user) => user.status === filters.status);
    }

    return filtered;
  }, [filters, users]);

  const stats = useMemo<UserStatsType>(() => ({
    total: users.length,
    ativos: users.filter((u) => u.status === "ATIVO").length,
    inativos: users.filter((u) => u.status === "INATIVO").length,
    bloqueados: users.filter((u) => u.status === "BLOQUEADO").length,
    administradores: users.filter((u) => u.perfil === "ADMIN").length,
    gerentes: users.filter((u) => u.perfil === "GERENTE").length,
    tecnicos: users.filter((u) => u.perfil === "TECNICO").length,
    usuarios: users.filter((u) => u.perfil === "USUARIO").length,
  }), [users]);

  const handleCreateUser = async (_id: number | null, userData: Partial<UserRequest>) => {
    try {
      await userService.createUser(userData as UserRequest);
      await loadUsers();
      setShowForm(false);
    } catch (error) {
      logger.error('Erro ao criar usuario', error);
      throw error;
    }
  };

  const handleUpdateUser = async (id: number, userData: Partial<UserRequest>) => {
    try {
      await userService.updateUser(id, userData);
      await loadUsers();
      setEditingUser(null);
    } catch (error) {
      logger.error('Erro ao atualizar usuario', error);
      throw error;
    }
  };

  const showNotice = (type: "success" | "error", text: string) => {
    setNotice({ type, text });
    window.setTimeout(() => setNotice(null), 3500);
  };

  const handleDeleteUser = async (user: User) => {
    setPendingDeleteUser(user);
  };

  const confirmDeleteUser = async () => {
    if (!pendingDeleteUser) return;

    setStatusUpdatingId(pendingDeleteUser.id);
    try {
      await userService.deleteUser(pendingDeleteUser.id);
      await loadUsers();
      showNotice("success", `Usuario ${pendingDeleteUser.username} inativado.`);
      setPendingDeleteUser(null);
    } catch (error) {
      logger.error('Erro ao deletar usuario', error);
      showNotice("error", error instanceof Error ? error.message : "Nao foi possivel inativar o usuario.");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleToggleStatus = async (user: User) => {
    setPendingStatusUser(user);
  };

  const confirmToggleStatus = async () => {
    if (!pendingStatusUser) return;

    const newStatus = pendingStatusUser.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';
    setStatusUpdatingId(pendingStatusUser.id);
    try {
      await userService.updateStatus(pendingStatusUser.id, newStatus);
      await loadUsers();
      showNotice("success", `Usuario ${pendingStatusUser.username} ${newStatus === "ATIVO" ? "ativado" : "inativado"}.`);
      setPendingStatusUser(null);
    } catch (error) {
      logger.error('Erro ao alterar status', error);
      showNotice("error", error instanceof Error ? error.message : "Nao foi possivel alterar o status.");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleIssueResetToken = async (user: User) => {
    const cachedCode = resetCodeCache[user.id];
    const cachedExpiresAt = cachedCode ? new Date(cachedCode.expiresAt).getTime() : 0;

    if (cachedCode && cachedExpiresAt > Date.now()) {
      setResetCodeModal({ ...cachedCode, copied: false });
      return;
    }

    try {
      const response = await userService.issuePasswordResetToken(user.id);
      const nextCode = {
        username: user.username,
        token: response.token,
        expiresAt: response.expiresAt,
      };

      setResetCodeCache((current) => ({
        ...current,
        [user.id]: nextCode,
      }));
      setResetCodeModal({
        ...nextCode,
        copied: false,
      });
    } catch (error) {
      logger.error('Erro ao gerar codigo temporario', error);
      window.alert(error instanceof Error ? error.message : 'Erro ao gerar codigo temporario');
    }
  };

  const handleCopyResetCode = async () => {
    if (!resetCodeModal) return;

    try {
      await navigator.clipboard.writeText(resetCodeModal.token);
      setResetCodeModal({ ...resetCodeModal, copied: true });
      window.setTimeout(() => {
        setResetCodeModal((current) => current ? { ...current, copied: false } : current);
      }, 1800);
    } catch (error) {
      logger.error('Erro ao copiar codigo temporario', error);
    }
  };

  const handleSubmitForm = async (id: number | null, userData: Partial<UserRequest>) => {
    if (editingUser) {
      return await handleUpdateUser(id!, userData);
    }
    return await handleCreateUser(id, userData);
  };

  if (!mounted || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.background }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderBottomColor: COLORS.primary }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
      <Sidebar
        onLogout={logout}
        username={username || "Usuário"}
        role={role}
        onCollapsedChange={setSidebarCollapsed}
      />

      <main
        className="transition-all duration-300 min-h-screen"
        style={{ marginLeft: sidebarCollapsed ? '72px' : '260px' }}
      >
        <div className="px-6 py-8 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-5">
            {/* Cabeçalho */}
            <div 
              className="flex justify-between items-center flex-wrap gap-4"
              style={{ animation: animated ? "fadeInUp 0.5s ease-out" : "none" }}
            >
              <div>
                <h1 
                  className="text-3xl font-bold transition-all duration-300 hover:translate-x-1"
                  style={{ color: COLORS.primary }}
                >
                  Gerenciador de Usuários
                </h1>
                <p 
                  className="mt-0.5 text-sm transition-all duration-300 delay-100"
                  style={{ color: COLORS.textLight }}
                >
                  Gerencie administradores, gerentes, tecnicos e usuarios do sistema
                </p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="px-5 py-2.5 rounded-xl text-white font-semibold flex items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-md"
                style={{ backgroundColor: COLORS.primary }}
              >
                <Plus size={20} className="transition-transform duration-300 group-hover:rotate-90" />
                Novo Usuário
              </button>
            </div>

            {/* Cards de estatísticas */}
            <div style={{ animation: animated ? "fadeInUp 0.5s ease-out 0.1s both" : "none" }}>
              <UserStats stats={stats} />
            </div>

            {/* Filtros */}
            <div className="relative z-30" style={{ animation: animated ? "fadeInLeft 0.5s ease-out 0.2s both" : "none" }}>
              <UserFilters filters={filters} setFilters={setFilters} />
            </div>

            {notice && (
              <div
                className="rounded-lg border px-4 py-3 text-sm font-semibold"
                style={{
                  borderColor: notice.type === "success" ? "#A7F3D0" : "#FCA5A5",
                  backgroundColor: notice.type === "success" ? "#ECFDF3" : "#FEF2F2",
                  color: notice.type === "success" ? COLORS.success : COLORS.danger,
                }}
              >
                {notice.text}
              </div>
            )}
            
            {/* Tabela */}
            <div className="relative z-10" style={{ animation: animated ? "fadeInRight 0.5s ease-out 0.3s both" : "none" }}>
              <UserTable
                users={filteredUsers}
                isLoading={isLoading}
                currentUsername={username || ""}
                statusUpdatingId={statusUpdatingId}
                onEdit={setEditingUser}
                onDelete={handleDeleteUser}
                onToggleStatus={handleToggleStatus}
                onIssueResetToken={handleIssueResetToken}
              />
            </div>

            {/* Modal */}
            {(showForm || editingUser) && (
              <UserForm
                user={editingUser}
                onClose={() => {
                  setShowForm(false);
                  setEditingUser(null);
                }}
                onSubmit={handleSubmitForm}
              />
            )}

            {resetCodeModal && (
              <ResetCodeModal
                username={resetCodeModal.username}
                token={resetCodeModal.token}
                expiresAt={resetCodeModal.expiresAt}
                copied={resetCodeModal.copied}
                onCopy={handleCopyResetCode}
                onClose={() => setResetCodeModal(null)}
              />
            )}

            {pendingStatusUser && (
              <ConfirmActionModal
                title={pendingStatusUser.status === "ATIVO" ? "Inativar usuario" : "Ativar usuario"}
                description={
                  pendingStatusUser.status === "ATIVO"
                    ? `O usuario ${pendingStatusUser.username} perdera o acesso ao sistema ate ser reativado.`
                    : `O usuario ${pendingStatusUser.username} voltara a acessar o sistema.`
                }
                confirmLabel={pendingStatusUser.status === "ATIVO" ? "Inativar" : "Ativar"}
                tone={pendingStatusUser.status === "ATIVO" ? "danger" : "success"}
                loading={statusUpdatingId === pendingStatusUser.id}
                onConfirm={confirmToggleStatus}
                onClose={() => setPendingStatusUser(null)}
              />
            )}

            {pendingDeleteUser && (
              <ConfirmActionModal
                title="Inativar usuario"
                description={`Esta acao inativa ${pendingDeleteUser.username}. O registro sera mantido para auditoria, mas o usuario nao podera acessar o sistema.`}
                confirmLabel="Inativar"
                tone="danger"
                loading={statusUpdatingId === pendingDeleteUser.id}
                onConfirm={confirmDeleteUser}
                onClose={() => setPendingDeleteUser(null)}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ResetCodeModal({
  username,
  token,
  expiresAt,
  copied,
  onCopy,
  onClose,
}: {
  username: string;
  token: string;
  expiresAt: string;
  copied: boolean;
  onCopy: () => void;
  onClose: () => void;
}) {
  const isIdamCode = /^IDAM-\d{6}$/.test(token);
  const expiresAtTime = new Date(expiresAt).getTime();
  const [remainingMs, setRemainingMs] = useState(() => Math.max(expiresAtTime - Date.now(), 0));
  const isExpired = remainingMs <= 0;

  useEffect(() => {
    if (Number.isNaN(expiresAtTime)) return;

    const interval = window.setInterval(() => {
      setRemainingMs(Math.max(expiresAtTime - Date.now(), 0));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [expiresAtTime]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-[#102016]/60 backdrop-blur-[2px]" onClick={onClose} />
      <section className="relative w-full max-w-[520px] overflow-hidden rounded-lg border bg-white shadow-2xl" style={{ borderColor: COLORS.border }}>
        <div className="flex items-start justify-between gap-4 px-6 py-5 text-white" style={{ backgroundColor: COLORS.primary }}>
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-white/12 text-white">
              <ShieldCheck size={22} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">IDAM</p>
              <h2 className="mt-1 text-lg font-bold">Código temporário gerado</h2>
              <p className="mt-1 text-sm leading-5 text-white/78">
                Entregue este código ao usuário <strong>{username}</strong> para redefinir a senha.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="rounded-lg border px-4 py-4 text-center" style={{ borderColor: COLORS.border, backgroundColor: "#F8FBF8" }}>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: COLORS.textLight }}>
              Código de recuperação
            </p>
            <div
              className={`mx-auto rounded-md border bg-white px-4 py-4 font-mono font-black ${
                isIdamCode
                  ? "max-w-[330px] text-4xl tracking-[0.16em]"
                  : "max-h-24 overflow-y-auto break-all text-sm leading-6 tracking-normal"
              }`}
              style={{ borderColor: COLORS.border, color: COLORS.primary }}
            >
              {token}
            </div>
            <div className="mt-4 flex flex-col items-center gap-2">
              <div
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold"
                style={{
                  borderColor: isExpired ? "#FCA5A5" : COLORS.border,
                  backgroundColor: isExpired ? "#FEF2F2" : "#FFFFFF",
                  color: isExpired ? COLORS.danger : COLORS.primary,
                }}
              >
                <Clock3 size={15} />
                {isExpired ? "Código expirado" : `Expira em ${formatCountdown(remainingMs)}`}
              </div>
              <span className="text-xs" style={{ color: COLORS.textLight }}>
                Validade total: 10 minutos
              </span>
            </div>
          </div>

          {!isIdamCode && (
            <div className="mt-4 rounded-md border px-4 py-3 text-sm font-medium leading-6" style={{ borderColor: "#FBBF24", backgroundColor: "#FFFBEB", color: "#92400E" }}>
              O backend ainda retornou um código antigo. Reinicie o backend e gere novamente para receber o padrão IDAM-123456.
            </div>
          )}

          <div className="mt-4 rounded-md border px-4 py-3 text-sm leading-6" style={{ borderColor: COLORS.border, color: COLORS.textLight }}>
            O código é de uso único. Após a redefinição da senha, ele deixa de funcionar automaticamente.
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-semibold transition-colors hover:bg-gray-100"
              style={{ border: `1px solid ${COLORS.border}`, color: COLORS.primary }}
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={onCopy}
              disabled={isExpired}
              className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: isExpired ? COLORS.textLight : COLORS.primary }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copiado" : "Copiar código"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ConfirmActionModal({
  title,
  description,
  confirmLabel,
  tone,
  loading,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  tone: "success" | "danger";
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const isDanger = tone === "danger";
  const accentColor = isDanger ? COLORS.danger : COLORS.success;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-[#102016]/55 backdrop-blur-[2px]" onClick={loading ? undefined : onClose} />
      <section className="relative w-full max-w-md overflow-hidden rounded-lg border bg-white shadow-2xl" style={{ borderColor: COLORS.border }}>
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderBottomColor: COLORS.border, backgroundColor: COLORS.background }}>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: `${accentColor}14`, color: accentColor }}>
              <AlertTriangle size={21} />
            </span>
            <div>
              <h2 className="text-base font-bold" style={{ color: COLORS.primary }}>{title}</h2>
              <p className="mt-1 text-sm leading-5" style={{ color: COLORS.textLight }}>{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-white disabled:opacity-50"
            style={{ color: COLORS.textLight }}
            aria-label="Fechar"
          >
            <X size={17} />
          </button>
        </div>

        <div className="flex flex-col-reverse gap-2 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-md px-4 py-2 text-sm font-semibold transition-colors hover:bg-gray-100 disabled:opacity-50"
            style={{ border: `1px solid ${COLORS.border}`, color: COLORS.primary }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
            style={{ backgroundColor: accentColor }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Processando..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function formatCountdown(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
