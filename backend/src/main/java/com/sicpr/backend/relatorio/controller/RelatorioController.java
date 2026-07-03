package com.sicpr.backend.relatorio.controller;

import com.sicpr.backend.relatorio.dto.RelatorioResumoResponse;
import com.sicpr.backend.relatorio.service.RelatorioService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/relatorios")
@RequiredArgsConstructor
public class RelatorioController {

    private final RelatorioService service;

    @GetMapping("/resumo")
    public RelatorioResumoResponse resumo(
            @RequestParam(defaultValue = "30") String periodo,
            @RequestParam(required = false) String inicio,
            @RequestParam(required = false) String fim,
            @RequestParam(defaultValue = "todas") String escopo,
            @RequestParam(defaultValue = "todos") String status
    ) {
        return service.resumo(periodo, inicio, fim, escopo, status);
    }
}
