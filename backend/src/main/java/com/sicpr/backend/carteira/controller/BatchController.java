// controller/BatchController.java
package com.sicpr.backend.carteira.controller;

import com.sicpr.backend.carteira.dto.BatchResultDTO;
import com.sicpr.backend.carteira.dto.BatchStatusDTO;
import com.sicpr.backend.carteira.service.BatchCarteiraService;
import com.sicpr.backend.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/carteira")
@RequiredArgsConstructor
@Slf4j
// @CrossOrigin(origins = "*")  // REMOVIDO - CORS é configurado no WebConfig
public class BatchController {

    private final BatchCarteiraService batchService;
    private final CurrentUserService currentUser;

    @PostMapping("/batch/upload")
    public ResponseEntity<BatchResultDTO> processarBatch(
            @RequestParam("files") List<MultipartFile> files) throws IOException {
        
        log.info("POST /api/carteira/batch/upload - Arquivos: {}", files.size());
        BatchResultDTO resultado = batchService.processarBatch(files, currentUser.requireUsername());
        
        return ResponseEntity.ok(resultado);
    }

    @PostMapping("/batch/zip")
    public ResponseEntity<BatchResultDTO> processarZip(
            @RequestParam("file") MultipartFile zipFile) throws IOException {
        
        log.info("POST /api/carteira/batch/zip - Arquivo: {}", zipFile.getOriginalFilename());
        BatchResultDTO resultado = batchService.processarZip(zipFile, currentUser.requireUsername());
        
        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/batch/status/{batchId}")
    public ResponseEntity<BatchStatusDTO> getStatus(@PathVariable String batchId) {
        return ResponseEntity.ok(batchService.getStatus(batchId));
    }
}
