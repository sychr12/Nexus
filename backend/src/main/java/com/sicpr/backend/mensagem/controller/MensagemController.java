package com.sicpr.backend.mensagem.controller;

import com.sicpr.backend.mensagem.dto.MensagemRequest;
import com.sicpr.backend.mensagem.dto.MensagemResponse;
import com.sicpr.backend.mensagem.service.MensagemService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/mensagens")
@RequiredArgsConstructor
public class MensagemController {

    private final MensagemService service;

    @GetMapping
    public List<MensagemResponse> listar() {
        return service.listarMinhasMensagens();
    }

    @GetMapping("/usuarios")
    public List<MensagemService.MensagemUsuarioResponse> listarUsuarios() {
        return service.listarUsuariosDisponiveis();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public MensagemResponse enviar(
            @RequestParam Long destinatarioId,
            @RequestParam(required = false) String texto,
            @RequestPart(required = false) MultipartFile anexo
    ) {
        MensagemRequest request = new MensagemRequest();
        request.setDestinatarioId(destinatarioId);
        request.setTexto(texto);
        return service.enviar(request, anexo);
    }

    @GetMapping("/anexos/{nomeArquivo}")
    public ResponseEntity<Resource> carregarAnexo(@PathVariable String nomeArquivo) {
        MensagemService.AnexoDownload download = service.carregarAnexo(nomeArquivo);
        MediaType contentType = download.contentType() == null
                ? MediaType.APPLICATION_OCTET_STREAM
                : MediaType.parseMediaType(download.contentType());
        return ResponseEntity.ok()
                .contentType(contentType)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline()
                        .filename(download.nomeArquivo(), StandardCharsets.UTF_8)
                        .build()
                        .toString())
                .body(download.resource());
    }
}
