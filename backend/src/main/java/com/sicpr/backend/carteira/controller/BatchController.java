// controller/BatchController.java
package com.sicpr.backend.carteira.controller;

import com.sicpr.backend.carteira.dto.BatchResultDTO;
import com.sicpr.backend.carteira.dto.BatchStatusDTO;
import com.sicpr.backend.carteira.service.BatchCarteiraService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/carteira")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class BatchController {

    private final BatchCarteiraService batchService; // Agora será usado

    @PostMapping("/batch/upload")
    public ResponseEntity<BatchResultDTO> processarBatch(
            @RequestParam("files") List<MultipartFile> files,
            @AuthenticationPrincipal UserDetails userDetails) throws IOException {
        
        log.info("POST /api/carteira/batch/upload - Arquivos: {}", files.size());
        String usuario = userDetails != null ? userDetails.getUsername() : "SISTEMA";
        
        // USANDO O SERVICE
        BatchResultDTO resultado = batchService.processarBatch(files, usuario);
        
        return ResponseEntity.ok(resultado);
    }

    @PostMapping("/batch/zip")
    public ResponseEntity<BatchResultDTO> processarZip(
            @RequestParam("file") MultipartFile zipFile,
            @AuthenticationPrincipal UserDetails userDetails) throws IOException {
        
        log.info("POST /api/carteira/batch/zip - Arquivo: {}", zipFile.getOriginalFilename());
        String usuario = userDetails != null ? userDetails.getUsername() : "SISTEMA";
        
        // USANDO O SERVICE
        BatchResultDTO resultado = batchService.processarZip(zipFile, usuario);
        
        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/batch/status/{batchId}")
    public ResponseEntity<BatchStatusDTO> getStatus(@PathVariable String batchId) {
        // USANDO O SERVICE
        return ResponseEntity.ok(batchService.getStatus(batchId));
    }
}