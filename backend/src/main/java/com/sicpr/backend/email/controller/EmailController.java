// backend/src/main/java/com/sicpr/backend/email/controller/EmailController.java
package com.sicpr.backend.email.controller;

import com.sicpr.backend.email.dto.EmailAnexoDTO;
import com.sicpr.backend.email.dto.EmailStatsDTO;
import com.sicpr.backend.email.dto.DownloadRequestDTO;
import com.sicpr.backend.email.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/email")
@RequiredArgsConstructor
public class EmailController {
    
    private final EmailService emailService;
    
    @GetMapping("/listar")
    public ResponseEntity<Page<EmailAnexoDTO>> listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(emailService.listarTodos(page, size));
    }
    
    @GetMapping("/buscar")
    public ResponseEntity<Page<EmailAnexoDTO>> buscar(
            @RequestParam String texto,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(emailService.buscarPorTexto(texto, page, size));
    }
    
    @GetMapping("/municipio/{municipio}")
    public ResponseEntity<Page<EmailAnexoDTO>> buscarPorMunicipio(
            @PathVariable String municipio,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(emailService.buscarPorMunicipio(municipio, page, size));
    }
    
    @GetMapping("/download/{id}")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long id) {
        byte[] pdf = emailService.baixarPdfPorId(id);
        
        if (pdf == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"anexo.pdf\"")
            .contentType(MediaType.APPLICATION_PDF)
            .body(pdf);
    }
    
    @GetMapping("/stats")
    public ResponseEntity<EmailStatsDTO> estatisticas() {
        return ResponseEntity.ok(emailService.obterEstatisticas());
    }
    
    @PostMapping("/processar")
    public ResponseEntity<?> processarEmails(@RequestBody DownloadRequestDTO request) {
        try {
            int processados = emailService.processarEmails(
                request.getEmail(), 
                request.getSenha(), 
                request.isApenasNaoLidos()
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("processados", processados);
            response.put("message", "Processamento concluído: " + processados + " emails processados");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}