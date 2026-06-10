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
    private int totalLancamentos;
    private int totalMemorandos;
    private int totalCartoes;
    private String ultimoAcesso;
}
