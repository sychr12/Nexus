import {
  AtividadeRecente,
  ChartData,
  DashboardStats,
  Notificacao,
  Relatorio,
  TopCategoria,
  UsuarioAtivo,
} from "./types";
import { apiJson } from "@/app/_lib/http";

export const dashboardApi = {
  getStats(): Promise<DashboardStats> {
    return apiJson<DashboardStats>("/dashboard/stats");
  },

  getUsuariosAtivos(): Promise<UsuarioAtivo[]> {
    return apiJson<UsuarioAtivo[]>("/dashboard/usuarios-ativos");
  },

  registrarPresenca(): Promise<void> {
    return apiJson<void>("/dashboard/presenca", { method: "POST" });
  },

  getAtividadesRecentes(): Promise<AtividadeRecente[]> {
    return apiJson<AtividadeRecente[]>("/dashboard/atividades");
  },

  getTopCategorias(): Promise<TopCategoria[]> {
    return apiJson<TopCategoria[]>("/dashboard/categorias");
  },

  getRelatorios(): Promise<Relatorio[]> {
    return apiJson<Relatorio[]>("/dashboard/relatorios");
  },

  getNotificacoes(): Promise<Notificacao[]> {
    return apiJson<Notificacao[]>("/dashboard/notificacoes");
  },

  getChartData(): Promise<ChartData> {
    return apiJson<ChartData>("/dashboard/chart");
  },
};
