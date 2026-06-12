package com.sicpr.backend.inscricao.controller;

import com.sicpr.backend.inscricao.dto.InscricaoRequest;
import com.sicpr.backend.inscricao.dto.InscricaoResponse;
import com.sicpr.backend.inscricao.service.InscricaoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inscricoes")
@RequiredArgsConstructor
// @CrossOrigin(origins = "*")  // REMOVIDO - CORS é configurado no WebConfig
public class InscricaoController {

    private final InscricaoService service;

    @PostMapping
    public InscricaoResponse salvar(@Valid @RequestBody InscricaoRequest request) {
        return service.salvar(request);
    }

    @GetMapping
    public List<InscricaoResponse> listar() {
        return service.listarPublico();
    }

    @GetMapping("/web")
    public List<InscricaoResponse> listarWeb() {
        return service.listarWeb();
    }
}
