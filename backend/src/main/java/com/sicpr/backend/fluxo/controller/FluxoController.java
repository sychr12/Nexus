package com.sicpr.backend.fluxo.controller;

import com.sicpr.backend.fluxo.dto.AprovarLoteRequest;
import com.sicpr.backend.fluxo.dto.GerenteUnidadeRequest;
import com.sicpr.backend.fluxo.dto.GerenteUnidadeResponse;
import com.sicpr.backend.fluxo.dto.JustificativaRequest;
import com.sicpr.backend.fluxo.dto.ProcessoFluxoRequest;
import com.sicpr.backend.fluxo.dto.ProcessoFluxoResponse;
import com.sicpr.backend.fluxo.service.FluxoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
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
            @Valid @RequestBody ProcessoFluxoRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return service.criarProcesso(request, username(userDetails));
    }

    @PutMapping("/processos/{id}")
    public ProcessoFluxoResponse atualizarProcesso(
            @PathVariable String id,
            @Valid @RequestBody ProcessoFluxoRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return service.atualizarProcesso(id, request, username(userDetails));
    }

    @PostMapping("/processos/{id}/encaminhar-gerente")
    public ProcessoFluxoResponse encaminharGerente(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return service.encaminharGerente(id, username(userDetails));
    }

    @PostMapping("/gerente/aprovar-lote")
    public List<ProcessoFluxoResponse> aprovarLoteGerente(
            @Valid @RequestBody AprovarLoteRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return service.aprovarLoteGerente(request, username(userDetails));
    }

    @PostMapping("/processos/{id}/devolver-gerente")
    public ProcessoFluxoResponse devolverPeloGerente(
            @PathVariable String id,
            @Valid @RequestBody JustificativaRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return service.devolverPeloGerente(id, request.getJustificativa(), username(userDetails));
    }

    @PostMapping("/processos/{id}/analise/aprovar")
    public ProcessoFluxoResponse aprovarAnalise(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return service.aprovarAnalise(id, username(userDetails));
    }

    @PostMapping("/processos/{id}/analise/devolver")
    public ProcessoFluxoResponse devolverAnalise(
            @PathVariable String id,
            @Valid @RequestBody JustificativaRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return service.devolverAnalise(id, request.getJustificativa(), username(userDetails));
    }

    @PostMapping("/processos/{id}/lancamento/concluir")
    public ProcessoFluxoResponse concluirLancamento(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return service.concluirLancamento(id, username(userDetails));
    }

    @GetMapping("/gerentes")
    public List<GerenteUnidadeResponse> listarGerentes() {
        return service.listarGerentes();
    }

    @PostMapping("/gerentes")
    public GerenteUnidadeResponse salvarGerente(@Valid @RequestBody GerenteUnidadeRequest request) {
        return service.salvarGerente(request);
    }

    @PostMapping("/gerentes/{id}/inativar")
    public GerenteUnidadeResponse inativarGerente(@PathVariable String id) {
        return service.inativarGerente(id);
    }

    private String username(UserDetails userDetails) {
        return userDetails != null ? userDetails.getUsername() : "Sistema";
    }
}
