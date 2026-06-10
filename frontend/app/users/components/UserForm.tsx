// app/users/components/UserForm.tsx
'use client';

import { useState } from 'react';
import { X, User as UserIcon, Phone, Key, Briefcase, Shield, Crown, User, Building2 } from 'lucide-react';

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

interface UserFormProps {
  user?: any;
  onClose: () => void;
  onSubmit: (id: number | null, data: any) => Promise<void>;
}

export default function UserForm({ user, onClose, onSubmit }: UserFormProps) {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    nomeCompleto: user?.nomeCompleto || '',
    telefone: user?.telefone || '',
    password: '',
    confirmPassword: '',
    perfil: user?.perfil || 'USUARIO',
    status: user?.status || 'ATIVO',
    cargo: user?.cargo || '',
    funcao: user?.funcao || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username) newErrors.username = 'Usuário é obrigatório';
    if (!formData.nomeCompleto) newErrors.nomeCompleto = 'Nome completo é obrigatório';
    if (!user) {
      if (!formData.password) newErrors.password = 'Senha é obrigatória';
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Senhas não conferem';
      }
      if (formData.password && formData.password.length < 6) {
        newErrors.password = 'Senha deve ter no mínimo 6 caracteres';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const submitData = user
        ? {
            username: formData.username,
            nomeCompleto: formData.nomeCompleto,
            telefone: formData.telefone,
            perfil: formData.perfil,
            status: formData.status,
            cargo: formData.cargo,
            funcao: formData.funcao,
          }
        : {
            username: formData.username,
            nomeCompleto: formData.nomeCompleto,
            telefone: formData.telefone,
            password: formData.password,
            perfil: formData.perfil,
            status: formData.status,
            cargo: formData.cargo,
            funcao: formData.funcao,
          };

      await onSubmit(user?.id || null, submitData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPerfilIcon = (perfil: string) => {
    switch (perfil) {
      case 'ADMIN': return <Shield size={18} />;
      case 'CHEFE': return <Crown size={18} />;
      default: return <User size={18} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="relative w-full max-w-2xl rounded-3xl overflow-auto max-h-[90vh]" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
        {/* Cabeçalho */}
        <div className="sticky top-0 flex justify-between items-center p-6 border-b" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: COLORS.primary }}>
              {user ? 'Editar Usuário' : 'Novo Usuário'}
            </h2>
            <p className="text-sm mt-1" style={{ color: COLORS.textLight }}>
              {user ? 'Altere as informações do usuário' : 'Preencha os dados para criar um novo usuário'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Avatar Placeholder */}
          <div className="flex justify-center mb-4">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: COLORS.primary }}
            >
              {formData.nomeCompleto ? formData.nomeCompleto.charAt(0).toUpperCase() : '?'}
            </div>
          </div>

          {/* Campos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.primary }}>
                Nome de Usuário *
              </label>
              <div className="relative">
                <UserIcon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: COLORS.textLight }} />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-opacity-20"
                  style={{ 
                    backgroundColor: COLORS.rowAlt,
                    borderColor: errors.username ? COLORS.danger : COLORS.border,
                    color: COLORS.primary,
                    transition: 'all 0.2s'
                  }}
                />
              </div>
              {errors.username && <p className="text-xs mt-1" style={{ color: COLORS.danger }}>{errors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.primary }}>
                Nome Completo *
              </label>
              <input
                type="text"
                value={formData.nomeCompleto}
                onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: COLORS.rowAlt,
                  borderColor: errors.nomeCompleto ? COLORS.danger : COLORS.border,
                  color: COLORS.primary,
                }}
              />
              {errors.nomeCompleto && <p className="text-xs mt-1" style={{ color: COLORS.danger }}>{errors.nomeCompleto}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.primary }}>
                Telefone
              </label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: COLORS.textLight }} />
                <input
                  type="text"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: COLORS.rowAlt,
                    borderColor: COLORS.border,
                    color: COLORS.primary,
                  }}
                  placeholder="(99) 99999-9999"
                />
              </div>
            </div>

            {!user && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: COLORS.primary }}>
                    Senha *
                  </label>
                  <div className="relative">
                    <Key size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: COLORS.textLight }} />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 rounded-xl border focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: COLORS.rowAlt,
                        borderColor: errors.password ? COLORS.danger : COLORS.border,
                        color: COLORS.primary,
                      }}
                    />
                  </div>
                  {errors.password && <p className="text-xs mt-1" style={{ color: COLORS.danger }}>{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: COLORS.primary }}>
                    Confirmar Senha *
                  </label>
                  <div className="relative">
                    <Key size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: COLORS.textLight }} />
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 rounded-xl border focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: COLORS.rowAlt,
                        borderColor: errors.confirmPassword ? COLORS.danger : COLORS.border,
                        color: COLORS.primary,
                      }}
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-xs mt-1" style={{ color: COLORS.danger }}>{errors.confirmPassword}</p>}
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.primary }}>
                Perfil *
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  {getPerfilIcon(formData.perfil)}
                </div>
                <select
                  value={formData.perfil}
                  onChange={(e) => setFormData({ ...formData, perfil: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: COLORS.rowAlt,
                    borderColor: COLORS.border,
                    color: COLORS.primary,
                  }}
                >
                  <option value="USUARIO">Usuário Padrão</option>
                  <option value="CHEFE">Chefe</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.primary }}>
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: COLORS.rowAlt,
                  borderColor: COLORS.border,
                  color: COLORS.primary,
                }}
              >
                <option value="ATIVO">Ativo</option>
                <option value="INATIVO">Inativo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.primary }}>
                Cargo
              </label>
              <div className="relative">
                <Briefcase size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: COLORS.textLight }} />
                <input
                  type="text"
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: COLORS.rowAlt,
                    borderColor: COLORS.border,
                    color: COLORS.primary,
                  }}
                  placeholder="Ex: Gerente"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.primary }}>
                Função
              </label>
              <div className="relative">
                <Building2 size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: COLORS.textLight }} />
                <input
                  type="text"
                  value={formData.funcao}
                  onChange={(e) => setFormData({ ...formData, funcao: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: COLORS.rowAlt,
                    borderColor: COLORS.border,
                    color: COLORS.primary,
                  }}
                  placeholder="Ex: Coordenação"
                />
              </div>
            </div>
          </div>

          {/* Informação adicional */}
          {user && (
            <div className="p-3 rounded-xl" style={{ backgroundColor: COLORS.rowAlt }}>
              <p className="text-xs" style={{ color: COLORS.textLight }}>
                <strong>Último login:</strong> {user.ultimoLogin ? new Date(user.ultimoLogin).toLocaleString('pt-BR') : 'Nunca'}
              </p>
              <p className="text-xs mt-1" style={{ color: COLORS.textLight }}>
                <strong>Criado em:</strong> {new Date(user.criadoEm).toLocaleString('pt-BR')}
              </p>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl border font-medium transition-all hover:bg-gray-50"
              style={{ borderColor: COLORS.border, color: COLORS.textLight }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-xl text-white font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              style={{ backgroundColor: COLORS.primary }}
            >
              {isLoading ? 'Salvando...' : user ? 'Atualizar Usuário' : 'Criar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
