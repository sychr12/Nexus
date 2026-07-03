// app/services/user.service.ts
import { apiJson } from "@/app/_lib/http";
import type { User, UserRequest, UserStats } from "../types/user";

export const userService = {
  async getAllUsers(): Promise<User[]> {
    return apiJson<User[]>("/users", undefined, "Erro ao carregar usuarios");
  },

  async getUserById(id: number): Promise<User> {
    return apiJson<User>(`/users/${id}`, undefined, "Erro ao carregar usuario");
  },

  async createUser(user: UserRequest): Promise<User> {
    return apiJson<User>(
      "/users",
      {
        method: "POST",
        body: user,
      },
      "Erro ao criar usuario",
    );
  },

  async updateUser(id: number, user: Partial<UserRequest>): Promise<User> {
    return apiJson<User>(
      `/users/${id}`,
      {
        method: "PUT",
        body: user,
      },
      "Erro ao atualizar usuario",
    );
  },

  async updateStatus(id: number, status: string): Promise<void> {
    await apiJson<void>(
      `/users/${id}/status?status=${encodeURIComponent(status)}`,
      { method: "PATCH" },
      "Erro ao atualizar status",
    );
  },

  async changePassword(id: number, oldPassword: string, newPassword: string): Promise<void> {
    await apiJson<void>(
      `/users/${id}/password`,
      {
        method: "PATCH",
        body: { oldPassword, newPassword },
      },
      "Erro ao alterar senha",
    );
  },

  async issuePasswordResetToken(id: number): Promise<{ token: string; expiresAt: string }> {
    return apiJson<{ token: string; expiresAt: string }>(
      `/users/${id}/password-reset-token`,
      { method: "POST" },
      "Erro ao gerar codigo temporario",
    );
  },

  async deleteUser(id: number): Promise<void> {
    await apiJson<void>(`/users/${id}`, { method: "DELETE" }, "Erro ao deletar usuario");
  },

  async getStats(): Promise<UserStats> {
    const users = await this.getAllUsers();
    return {
      total: users.length,
      ativos: users.filter((u) => u.status === "ATIVO").length,
      inativos: users.filter((u) => u.status === "INATIVO").length,
      bloqueados: users.filter((u) => u.status === "BLOQUEADO").length,
      administradores: users.filter((u) => u.perfil === "ADMIN").length,
      gerentes: users.filter((u) => ["GERENTE", "CHEFE"].includes(u.perfil)).length,
      tecnicos: users.filter((u) => u.perfil === "TECNICO").length,
      usuarios: users.filter((u) => u.perfil === "USUARIO").length,
    };
  },
};
