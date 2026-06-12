package com.sicpr.backend.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {
    private int usuariosOnline;
    private int usuariosOffline;
    private int totalUsuarios;
    private int usuariosAtivos;
    private int usuariosBloqueados;
    private int totalInscricoes;
    private int inscricoesHoje;
    private int totalLancamentos;
    private int totalMemorandos;
    private int memorandosHoje;
    private int totalCartoes;
    private int cartoesHoje;
    private int totalProcessosFluxo;
    private int processosEmElaboracao;
    private int processosGerente;
    private int processosAnalise;
    private int processosLancamento;
    private int processosConcluidos;
    private int processosDevolvidos;
    private String ultimoAcesso;
}
