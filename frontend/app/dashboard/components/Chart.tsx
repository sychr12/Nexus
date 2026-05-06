// app/dashboard/components/Chart.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3, TrendingUp } from 'lucide-react';
import { dashboardApi } from '../lib/api';

export default function Chart() {
  const [data, setData] = useState<{ dia: string; relatorios: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, []);

  async function loadChartData() {
    try {
      const response = await dashboardApi.getChartData();
      const formattedData = response.dias.map((dia, index) => ({
        dia,
        relatorios: response.valores[index],
      }));
      setData(formattedData);
    } catch (error) {
      console.error('Erro ao carregar gráfico:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
          <BarChart3 size={18} className="text-emerald-600" />
        </div>
        <h3 className="font-semibold text-gray-800">Relatórios - Últimos 30 Dias</h3>
        <div className="ml-auto flex items-center gap-1 text-xs text-gray-400">
          <TrendingUp size={12} />
          <span>30 dias</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="dia" stroke="#9ca3af" fontSize={12} />
          <YAxis stroke="#9ca3af" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            formatter={(value) => [`${value} relatórios`, 'Quantidade']}
          />
          <Line
            type="monotone"
            dataKey="relatorios"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
            activeDot={{ r: 6, fill: '#10b981' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}