package com.sicpr.backend.memorando.controller;

import com.sicpr.backend.memorando.entity.Memorando;
import com.sicpr.backend.memorando.service.MemorandoService;
import com.sicpr.backend.memorando.word.WordGeneratorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/memorandos")
@RequiredArgsConstructor
public class DownloadMemorandoController {

    private final WordGeneratorService wordService;
    private final MemorandoService memorandoService;

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]>
    download(
            @PathVariable Long id
    ) {

        Memorando memorando =
                memorandoService.buscarPorId(id);

        byte[] arquivo =
                wordService.gerarDocumento(
                        memorando
                );

        @SuppressWarnings("null")
        var contentType = MediaType.APPLICATION_OCTET_STREAM;
        
        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=memorando.docx"
                )
                .contentType(contentType)
                .body(arquivo);
    }
}