"use client";

import { Users, Clock, User, Circle } from 'lucide-react';

interface UsuarioAtivo {
  username: string;
  nome: string;
  perfil: string;
  tempoOnline: string;
}

interface UsersOnlineProps {
  users: UsuarioAtivo[];
}

export default function UsersOnline({ users }: UsersOnlineProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Users size={18} className="text-emerald-600" />
            </div>
            <h3 className="font-semibold text-gray-800">Usuários Ativos</h3>
          </div>
          <span className="text-sm text-emerald-600">{users.length} online</span>
        </div>
      </div>

      <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
        {users.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <User size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Nenhum usuário ativo no momento</p>
          </div>
        ) : (
          users.map((user, index) => (
            <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Circle size={8} className="text-emerald-500 absolute -top-1 -right-1 fill-emerald-500" />
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <User size={14} className="text-emerald-600" />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{user.nome}</p>
                    <p className="text-xs text-gray-400">
                      @{user.username} · {user.perfil}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={12} />
                  <span>{user.tempoOnline}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}