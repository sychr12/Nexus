"use client";

import { FileText, Clock, User, Calendar } from 'lucide-react';

interface AtividadeRecente {
  tipo: string;
  usuario: string;
  descricao: string;
  dataHora: string;
}

interface RecentActivitiesProps {
  activities: AtividadeRecente[];
}

export default function RecentActivities({ activities }: RecentActivitiesProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <Clock size={18} className="text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-800">Atividades Recentes</h3>
          </div>
          <span className="text-sm text-gray-400">{activities.length} atividades</span>
        </div>
      </div>

      <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <FileText size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Nenhuma atividade recente</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <FileText size={16} className="text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{activity.descricao}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <User size={10} />
                      <span>{activity.usuario}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar size={10} />
                      <span>{formatDate(activity.dataHora)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}