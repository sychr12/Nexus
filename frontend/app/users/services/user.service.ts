// app/services/user.service.ts
import type { User, UserRequest, UserStats } from '../types/user';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const userService = {
  async getAllUsers(): Promise<User[]> {
    const response = await fetch(`${API_URL}/api/users`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Erro ao carregar usuários');
    return response.json();
  },

  async getUserById(id: number): Promise<User> {
    const response = await fetch(`${API_URL}/api/users/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Erro ao carregar usuário');
    return response.json();
  },

  async createUser(user: UserRequest): Promise<User> {
    const response = await fetch(`${API_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Erro ao criar usuário');
    }
    return response.json();
  },

  async updateUser(id: number, user: Partial<UserRequest>): Promise<User> {
    const response = await fetch(`${API_URL}/api/users/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Erro ao atualizar usuário');
    }
    return response.json();
  },

  async updateStatus(id: number, status: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/users/${id}/status?status=${status}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Erro ao atualizar status');
  },

  async changePassword(id: number, oldPassword: string, newPassword: string): Promise<void> {
    const response = await fetch(
      `${API_URL}/api/users/${id}/password?oldPassword=${oldPassword}&newPassword=${newPassword}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    if (!response.ok) throw new Error('Erro ao alterar senha');
  },

  async deleteUser(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Erro ao deletar usuário');
  },

  async getStats(): Promise<UserStats> {
    const users = await this.getAllUsers();
    return {
      total: users.length,
      ativos: users.filter(u => u.status === 'ATIVO').length,
      inativos: users.filter(u => u.status === 'INATIVO').length,
      bloqueados: users.filter(u => u.status === 'BLOQUEADO').length,
      administradores: users.filter(u => u.perfil === 'ADMIN').length,
      chefes: users.filter(u => u.perfil === 'CHEFE').length,
      usuarios: users.filter(u => u.perfil === 'USUARIO').length,
    };
  },
};