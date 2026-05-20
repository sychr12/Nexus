'use client';

import { useState, useEffect } from 'react';
import type { User, UserFilters as UserFiltersType } from './types/user';
import { userService } from './services/user.service';
import UserTable from './components/UserTable';
import UserForm from './components/UserForm';
import UserFilters from './components/UserFilters';
import UserStats from './components/UserStats';
import { Plus } from 'lucide-react';
import TopBar from "../sidebar/page";
import { useRouter } from 'next/navigation';

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

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    ativos: 0,
    inativos: 0,
    bloqueados: 0,
    administradores: 0,
    chefes: 0,
    usuarios: 0,
  });
  const [filters, setFilters] = useState<UserFiltersType>({
    search: '',
    perfil: '',
    status: '',
  });

  const [username, setUsername] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUsername(user.username || user.nomeCompleto || 'Usuário');
      } catch {
        setUsername('Usuário');
      }
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, filters]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
      const statsData = await userService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    if (filters.search) {
      filtered = filtered.filter(
        (user) =>
          user.nomeCompleto.toLowerCase().includes(filters.search!.toLowerCase()) ||
          user.username.toLowerCase().includes(filters.search!.toLowerCase()) ||
          user.email.toLowerCase().includes(filters.search!.toLowerCase())
      );
    }

    if (filters.perfil) {
      filtered = filtered.filter((user) => user.perfil === filters.perfil);
    }

    if (filters.status) {
      filtered = filtered.filter((user) => user.status === filters.status);
    }

    setFilteredUsers(filtered);
  };

  const handleCreateUser = async (_id: number | null, userData: any) => {
    try {
      await userService.createUser(userData);
      await loadUsers();
      setShowForm(false);
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  };

  const handleUpdateUser = async (id: number, userData: any) => {
    try {
      await userService.updateUser(id, userData);
      await loadUsers();
      setEditingUser(null);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await userService.deleteUser(id);
        await loadUsers();
      } catch (error) {
        console.error('Erro ao deletar usuário:', error);
      }
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'ATIVO' ? 'INATIVO' : 'ATIVO';
    try {
      await userService.updateStatus(id, newStatus);
      await loadUsers();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const handleSubmitForm = async (id: number | null, userData: any) => {
    if (editingUser) {
      return await handleUpdateUser(id!, userData);
    }
    return await handleCreateUser(id, userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <>
      <TopBar onLogout={handleLogout} username={username} />
      <main style={{ backgroundColor: COLORS.rowAlt, paddingTop: '70px', minHeight: '100vh' }}>
        <div className="px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-5">
            {/* Cabeçalho */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold" style={{ color: COLORS.primary }}>
                  Gerenciador de Usuários
                </h1>
                <p className="mt-0.5 text-sm" style={{ color: COLORS.textLight }}>
                  Gerencie administradores, chefes e usuários do sistema
                </p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="px-5 py-2.5 rounded-xl text-white font-semibold flex items-center gap-2 transition-all hover:scale-105"
                style={{ backgroundColor: COLORS.primary }}
              >
                <Plus size={20} />
                Novo Usuário
              </button>
            </div>

            {/* Cards de estatísticas */}
            <UserStats stats={stats} />

            {/* Filtros */}
            <UserFilters filters={filters} setFilters={setFilters} />
            
            {/* Tabela */}
            <UserTable
              users={filteredUsers}
              isLoading={isLoading}
              onEdit={setEditingUser}
              onDelete={handleDeleteUser}
              onToggleStatus={handleToggleStatus}
            />

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
          </div>
        </div>
      </main>
    </>
  );
}