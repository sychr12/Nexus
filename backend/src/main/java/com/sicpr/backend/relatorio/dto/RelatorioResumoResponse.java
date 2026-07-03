package com.sicpr.backend.relatorio.dto;

import com.sicpr.backend.dashboard.dto.DashboardStatsDTO;
import com.sicpr.backend.dashboard.dto.TopCategoriaDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RelatorioResumoResponse {
    private DashboardStatsDTO stats;
    private List<TopCategoriaDTO> categorias;
    private LocalDate inicio;
    private LocalDate fim;
    private String escopo;
    private String status;
}
