'use client';

import type { User } from '../types/user';
import { Edit, KeyRound, Loader2, Trash2, Shield, Briefcase, Wrench, User as UserIcon, Phone } from 'lucide-react';

const COLORS = {
  primary: "#1F3A2E",
  accent: "#6B9D4A",
  danger: "#DC2626",
  textLight: "#6B7C6A",
  card: "#FFFFFF",
  border: "#E2E8E0",
  rowAlt: "#F7FAF7",
  success: "#059669",
};

interface UserTableProps {
  users: User[];
  isLoading: boolean;
  currentUsername: string;
  statusUpdatingId?: number | null;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onIssueResetToken: (user: User) => void;
}

export default function UserTable({ users, isLoading, currentUsername, statusUpdatingId, onEdit, onDelete, onToggleStatus, onIssueResetToken }: UserTableProps) {
  const getPerfilIcon = (perfil: string) => {
    switch (perfil) {
      case 'ADMIN': return <Shield size={16} />;
      case 'GERENTE':
      case 'CHEFE': return <Briefcase size={16} />;
      case 'TECNICO': return <Wrench size={16} />;
      default: return <UserIcon size={16} />;
    }
  };

  const getPerfilColor = (perfil: string) => {
    switch (perfil) {
      case 'ADMIN': return '#8B5CF6';
      case 'GERENTE':
      case 'CHEFE': return '#F59E0B';
      case 'TECNICO': return '#2563EB';
      default: return COLORS.accent;
    }
  };

  const getPerfilLabel = (perfil: string) => {
    switch (perfil) {
      case 'ADMIN': return 'Admin';
      case 'GERENTE':
      case 'CHEFE': return 'Gerente';
      case 'TECNICO': return 'Tecnico';
      default: return 'Usuário';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ATIVO': return COLORS.success;
      case 'INATIVO': return COLORS.danger;
      case 'BLOQUEADO': return '#F59E0B';
      default: return COLORS.textLight;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ATIVO': return 'Ativo';
      case 'INATIVO': return 'Inativo';
      case 'BLOQUEADO': return 'Bloqueado';
      default: return status;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
        <div className="animate-pulse" style={{ color: COLORS.textLight }}>
          Carregando usuários...
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead style={{ backgroundColor: COLORS.rowAlt }}>
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.textLight }}>
                Usuário
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.textLight }}>
                Perfil
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.textLight }}>
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.textLight }}>
                Criado em
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.textLight }}>
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr 
                key={user.id} 
                className="border-t transition-colors"
                style={{ 
                  borderColor: COLORS.border,
                  backgroundColor: index % 2 === 0 ? COLORS.card : COLORS.rowAlt
                }}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                      style={{ backgroundColor: getPerfilColor(user.perfil) }}
                    >
                      {user.nomeCompleto.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: COLORS.primary }}>{user.nomeCompleto}</p>
                      <p className="text-xs" style={{ color: COLORS.textLight }}>@{user.username}</p>
                      {user.unidadeLocal && (
                        <p className="text-xs" style={{ color: COLORS.textLight }}>Unidade: {user.unidadeLocal}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: `${getPerfilColor(user.perfil)}15`, color: getPerfilColor(user.perfil) }}
                  >
                    {getPerfilIcon(user.perfil)}
                    {getPerfilLabel(user.perfil)}
                  </span>
                  {user.cargo && (
                    <p className="text-xs mt-1" style={{ color: COLORS.textLight }}>{user.cargo}</p>
                  )}
                  {user.telefone && (
                    <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: COLORS.textLight }}>
                      <Phone size={12} />
                      {user.telefone}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span
                    className="inline-flex px-2 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: `${getStatusColor(user.status)}15`, color: getStatusColor(user.status) }}
                  >
                    {getStatusLabel(user.status)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm" style={{ color: COLORS.textLight }}>
                  {formatDate(user.criadoEm)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onToggleStatus(user)}
                      disabled={user.username.toLowerCase() === currentUsername.toLowerCase() || statusUpdatingId === user.id}
                      className="relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border px-1 transition-all disabled:cursor-not-allowed disabled:opacity-55"
                      style={{
                        borderColor: user.status === 'ATIVO' ? COLORS.success : COLORS.border,
                        backgroundColor: user.status === 'ATIVO' ? `${COLORS.success}22` : '#EEF1EE',
                      }}
                      title={user.username.toLowerCase() === currentUsername.toLowerCase() ? 'Voce nao pode inativar seu proprio usuario' : user.status === 'ATIVO' ? 'Inativar usuario' : 'Ativar usuario'}
                    >
                      {statusUpdatingId === user.id ? (
                        <Loader2 size={15} className="mx-auto animate-spin" style={{ color: COLORS.primary }} />
                      ) : (
                        <span
                          className="h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
                          style={{
                            transform: user.status === 'ATIVO' ? 'translateX(26px)' : 'translateX(0)',
                            border: `1px solid ${user.status === 'ATIVO' ? COLORS.success : COLORS.border}`,
                          }}
                        />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(user)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
                      title="Editar"
                    >
                      <Edit size={18} style={{ color: COLORS.accent }} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onIssueResetToken(user)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
                      title="Gerar codigo temporario de senha"
                    >
                      <KeyRound size={18} style={{ color: COLORS.primary }} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(user)}
                      disabled={user.username.toLowerCase() === currentUsername.toLowerCase()}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-45"
                      title={user.username.toLowerCase() === currentUsername.toLowerCase() ? 'Voce nao pode inativar seu proprio usuario' : 'Inativar usuario'}
                    >
                      <Trash2 size={18} style={{ color: COLORS.danger }} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="p-12 text-center" style={{ color: COLORS.textLight }}>
          <UserIcon size={48} className="mx-auto mb-3 opacity-30" />
          <p>Nenhum usuário encontrado</p>
        </div>
      )}
    </div>
  );
}
