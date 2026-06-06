package com.sicpr.backend.mensagem.controller;

import com.sicpr.backend.mensagem.dto.MensagemRequest;
import com.sicpr.backend.mensagem.dto.MensagemResponse;
import com.sicpr.backend.mensagem.service.MensagemService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.util.List;

@RestController
@RequestMapping("/api/mensagens")
@RequiredArgsConstructor
public class MensagemController {

    private final MensagemService service;

    @GetMapping
    public List<MensagemResponse> listar(Authentication authentication) {
        return service.listarMinhasMensagens(authentication);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public MensagemResponse enviar(
            Authentication authentication,
            @RequestParam Long destinatarioId,
            @RequestParam(required = false) String texto,
            @RequestPart(required = false) MultipartFile anexo
    ) {
        MensagemRequest request = new MensagemRequest();
        request.setDestinatarioId(destinatarioId);
        request.setTexto(texto);
        return service.enviar(authentication, request, anexo);
    }

    @GetMapping("/anexos/{nomeArquivo}")
    public ResponseEntity<Resource> carregarAnexo(@PathVariable String nomeArquivo) throws IOException {
        Resource resource = service.carregarAnexo(nomeArquivo);
        String contentType = Files.probeContentType(resource.getFile().toPath());
        return ResponseEntity.ok()
                .contentType(contentType == null ? MediaType.APPLICATION_OCTET_STREAM : MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}
