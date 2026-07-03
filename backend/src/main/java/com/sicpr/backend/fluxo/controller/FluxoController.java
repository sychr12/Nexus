package com.sicpr.backend.fluxo.controller;

import com.sicpr.backend.fluxo.dto.AprovarLoteRequest;
import com.sicpr.backend.fluxo.dto.GerenteUnidadeRequest;
import com.sicpr.backend.fluxo.dto.GerenteUnidadeResponse;
import com.sicpr.backend.fluxo.dto.JustificativaRequest;
import com.sicpr.backend.fluxo.dto.ProcessoFluxoRequest;
import com.sicpr.backend.fluxo.dto.ProcessoFluxoResponse;
import com.sicpr.backend.fluxo.service.FluxoService;
import com.sicpr.backend.fluxo.service.FluxoTransitionService;
import com.sicpr.backend.fluxo.service.GerenteAprovacaoFluxoService;
import com.sicpr.backend.fluxo.service.GerenteUnidadeFluxoService;
import com.sicpr.backend.security.CurrentUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/fluxo")
@RequiredArgsConstructor
public class FluxoController {

    private final FluxoService service;
    private final FluxoTransitionService transitionService;
    private final GerenteAprovacaoFluxoService gerenteAprovacaoService;
    private final GerenteUnidadeFluxoService gerenteService;
    private final CurrentUserService currentUser;

    @GetMapping("/processos")
    public List<ProcessoFluxoResponse> listarProcessos(
            @RequestParam(required = false) String situacao,
            @RequestParam(required = false) String unidadeLocal
    ) {
        return service.listarProcessos(situacao, unidadeLocal);
    }

    @GetMapping("/processos/gerente")
    public List<ProcessoFluxoResponse> listarPendentesGerente() {
        return service.listarPendentesGerente();
    }

    @GetMapping("/processos/analise")
    public List<ProcessoFluxoResponse> listarPendentesAnalise() {
        return service.listarPendentesAnalise();
    }

    @GetMapping("/processos/{id}")
    public ProcessoFluxoResponse buscarProcesso(@PathVariable String id) {
        return service.buscarProcesso(id);
    }

    @PostMapping("/processos")
    public ProcessoFluxoResponse criarProcesso(
            @Valid @RequestBody ProcessoFluxoRequest request
    ) {
        return service.criarProcesso(request, currentUser.requireUsername());
    }

    @PutMapping("/processos/{id}")
    public ProcessoFluxoResponse atualizarProcesso(
            @PathVariable String id,
            @Valid @RequestBody ProcessoFluxoRequest request
    ) {
        return service.atualizarProcesso(id, request, currentUser.requireUsername());
    }

    @PostMapping("/processos/{id}/encaminhar-gerente")
    public ProcessoFluxoResponse encaminharGerente(
            @PathVariable String id
    ) {
        return transitionService.encaminharGerente(id, currentUser.requireUsername());
    }

    @PostMapping("/gerente/aprovar-lote")
    public List<ProcessoFluxoResponse> aprovarLoteGerente(
            @Valid @RequestBody AprovarLoteRequest request
    ) {
        return gerenteAprovacaoService.aprovarLote(request, currentUser.requireUsername());
    }

    @PostMapping("/processos/{id}/devolver-gerente")
    public ProcessoFluxoResponse devolverPeloGerente(
            @PathVariable String id,
            @Valid @RequestBody JustificativaRequest request
    ) {
        return transitionService.devolverPeloGerente(id, request.getJustificativa(), currentUser.requireUsername());
    }

    @PostMapping("/processos/{id}/analise/aprovar")
    public ProcessoFluxoResponse aprovarAnalise(
            @PathVariable String id
    ) {
        return transitionService.aprovarAnalise(id, currentUser.requireUsername());
    }

    @PostMapping("/processos/{id}/analise/devolver")
    public ProcessoFluxoResponse devolverAnalise(
            @PathVariable String id,
            @Valid @RequestBody JustificativaRequest request
    ) {
        return transitionService.devolverAnalise(id, request.getJustificativa(), currentUser.requireUsername());
    }

    @PostMapping("/processos/{id}/lancamento/concluir")
    public ProcessoFluxoResponse concluirLancamento(
            @PathVariable String id
    ) {
        return transitionService.concluirLancamento(id, currentUser.requireUsername());
    }

    @PostMapping("/processos/{id}/lancamento/devolver")
    public ProcessoFluxoResponse devolverLancamento(
            @PathVariable String id,
            @Valid @RequestBody JustificativaRequest request
    ) {
        return transitionService.devolverLancamento(id, request.getJustificativa(), currentUser.requireUsername());
    }

    @GetMapping("/gerentes")
    public List<GerenteUnidadeResponse> listarGerentes() {
        return gerenteService.listarGerentes();
    }

    @PostMapping("/gerentes")
    public GerenteUnidadeResponse salvarGerente(@Valid @RequestBody GerenteUnidadeRequest request) {
        return gerenteService.salvarGerente(request);
    }

    @PutMapping("/gerentes/{id}")
    public GerenteUnidadeResponse atualizarGerente(
            @PathVariable String id,
            @Valid @RequestBody GerenteUnidadeRequest request
    ) {
        return gerenteService.atualizarGerente(id, request);
    }

    @PostMapping("/gerentes/{id}/inativar")
    public GerenteUnidadeResponse inativarGerente(@PathVariable String id) {
        return gerenteService.inativarGerente(id);
    }

}
