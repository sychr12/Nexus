package com.sicpr.backend.analise.controller;

import com.sicpr.backend.analise.dto.AnaliseRequest;
import com.sicpr.backend.analise.dto.AnaliseResponse;
import com.sicpr.backend.analise.dto.DecisaoProcessoRequest;
import com.sicpr.backend.analise.dto.EncaminhamentoAnaliseResponse;
import com.sicpr.backend.analise.service.AnaliseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analises")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AnaliseController {

    private final AnaliseService service;

    @PostMapping
    public AnaliseResponse salvar(
            @RequestBody AnaliseRequest request
    ) {

        return service.salvar(request);
    }

    @GetMapping
    public List<AnaliseResponse> listar() {

        return service.listar();
    }

    @GetMapping("/encaminhamentos")
    public List<EncaminhamentoAnaliseResponse> listarEncaminhamentos(
            @RequestParam(required = false) String destino
    ) {

        return service.listarEncaminhamentos(destino);
    }

    @GetMapping("/encaminhamentos/{id}")
    public EncaminhamentoAnaliseResponse buscarEncaminhamento(
            @PathVariable String id
    ) {

        return service.buscarEncaminhamento(id);
    }

    @GetMapping("/{id}")
    public AnaliseResponse buscar(
            @PathVariable Long id
    ) {

        return service.buscar(id);
    }

    @PostMapping("/{id}/abrir")
    public AnaliseResponse abrir(
            @PathVariable Long id
    ) {

        return service.abrir(id);
    }

    @PostMapping("/processos/{processoId}/decisao")
    public AnaliseResponse decidirProcesso(
            @PathVariable Long processoId,
            @RequestBody DecisaoProcessoRequest request
    ) {

        return service.decidirProcesso(
                processoId,
                request
        );
    }
}
