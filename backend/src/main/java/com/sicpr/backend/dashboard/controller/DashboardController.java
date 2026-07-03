package com.sicpr.backend.dashboard.controller;

import com.sicpr.backend.dashboard.dto.*;
import com.sicpr.backend.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public DashboardStatsDTO getStats() {
        return dashboardService.obterEstatisticas();
    }

    @GetMapping("/usuarios-ativos")
    public List<UsuarioAtivoDTO> getUsuariosAtivos() {
        return dashboardService.obterUsuariosAtivos();
    }

    @PostMapping("/presenca")
    public ResponseEntity<Void> registrarPresenca() {
        dashboardService.registrarPresenca();
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/atividades")
    public List<AtividadeRecenteDTO> getAtividadesRecentes() {
        return dashboardService.obterAtividadesRecentes();
    }

    @GetMapping("/chart")
    public ChartDataDTO getChartData() {
        return dashboardService.obterGraficoMensal();
    }

    @GetMapping("/categorias")
    public List<TopCategoriaDTO> getTopCategorias() {
        return dashboardService.obterTopCategorias();
    }

    @GetMapping("/relatorios")
    public List<RelatorioDTO> getRelatorios() {
        return dashboardService.obterRelatorios();
    }

    @GetMapping("/notificacoes")
    public List<NotificacaoDTO> getNotificacoes() {
        return dashboardService.obterNotificacoes();
    }
}
