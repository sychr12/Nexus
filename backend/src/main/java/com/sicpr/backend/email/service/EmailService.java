// backend/src/main/java/com/sicpr/backend/email/service/EmailService.java
package com.sicpr.backend.email.service;

import com.sicpr.backend.email.dto.EmailAnexoDTO;
import com.sicpr.backend.email.dto.EmailStatsDTO;
import com.sicpr.backend.email.model.EmailAnexo;
import com.sicpr.backend.email.repository.EmailAnexoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.mail.Message;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {
    
    private final EmailAnexoRepository repository;
    private final GmailService gmailService;
    
    public Page<EmailAnexoDTO> listarTodos(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("criadoEm").descending());
        return repository.findAllByOrderByCriadoEmDesc(pageable)
            .map(this::toDTO);
    }
    
    public Page<EmailAnexoDTO> buscarPorMunicipio(String municipio, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("criadoEm").descending());
        return repository.findByMunicipio(municipio, pageable)
            .map(this::toDTO);
    }
    
    public Page<EmailAnexoDTO> buscarPorTexto(String texto, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("criadoEm").descending());
        return repository.findByRemetenteContainingIgnoreCaseOrAssuntoContainingIgnoreCase(
            texto, texto, pageable).map(this::toDTO);
    }
    
    public Optional<EmailAnexo> buscarPorId(Long id) {
        return repository.findById(id);
    }
    
    public byte[] baixarPdfPorId(Long id) {
        return repository.findById(id)
            .map(EmailAnexo::getPdf)
            .orElse(null);
    }
    
    public EmailStatsDTO obterEstatisticas() {
        long total = repository.count();
        
        // Calcular estatísticas básicas
        long hoje = 0;
        long estaSemana = 0;
        long esteMes = 0;
        
        LocalDateTime agora = LocalDateTime.now();
        LocalDateTime inicioHoje = agora.withHour(0).withMinute(0).withSecond(0);
        LocalDateTime inicioSemana = agora.minusDays(7);
        LocalDateTime inicioMes = agora.withDayOfMonth(1);
        
        List<EmailAnexo> todos = repository.findAll();
        for (EmailAnexo email : todos) {
            if (email.getCriadoEm() != null) {
                if (email.getCriadoEm().isAfter(inicioHoje)) hoje++;
                if (email.getCriadoEm().isAfter(inicioSemana)) estaSemana++;
                if (email.getCriadoEm().isAfter(inicioMes)) esteMes++;
            }
        }
        
        List<Object[]> resultados = repository.countPorMunicipio();
        Map<String, Long> porMunicipio = resultados.stream()
            .collect(Collectors.toMap(
                r -> (String) r[0],
                r -> (Long) r[1]
            ));
        
        return EmailStatsDTO.builder()
            .total(total)
            .hoje(hoje)
            .estaSemana(estaSemana)
            .esteMes(esteMes)
            .porMunicipio(porMunicipio)
            .build();
    }
    
    @Transactional
    public int processarEmails(String email, String senha, boolean apenasNaoLidos) {
        List<Message> emails = gmailService.buscarEmailsComAnexos(email, senha, apenasNaoLidos);
        int processados = 0;
        
        for (Message msg : emails) {
            try {
                processarEmail(msg, email, senha);
                processados++;
            } catch (Exception e) {
                log.error("Erro ao processar email: {}", e.getMessage());
            }
        }
        
        log.info("Processados {} emails", processados);
        return processados;
    }
    
    private void processarEmail(Message message, String emailUser, String senha) throws Exception {
        String messageId = UUID.randomUUID().toString();
        String remetente = gmailService.extrairRemetente(message);
        String assunto = gmailService.extrairAssunto(message);
        String municipio = gmailService.obterMunicipioPorEmail(remetente);
        LocalDateTime dataEmail = gmailService.extrairData(message);
        
        byte[] pdfBytes = gmailService.extrairAnexoPDF(message);
        String nomeArquivo = sanitizarNome(message.getFileName() != null ? message.getFileName() : "anexo.pdf");
        
        if (pdfBytes != null && pdfBytes.length > 0) {
            EmailAnexo anexo = EmailAnexo.builder()
                .emailId(messageId)
                .remetente(remetente)
                .assunto(assunto)
                .municipio(municipio)
                .dataEmail(dataEmail)
                .nomeArquivo(nomeArquivo != null ? nomeArquivo : "anexo.pdf")
                .mimeType("application/pdf")
                .pdf(pdfBytes)
                .hashSha256(calcularHash(pdfBytes))
                .build();
            
            repository.save(anexo);
            log.info("PDF salvo: {} de {}", nomeArquivo, remetente);
        }
    }
    
    private String sanitizarNome(String nome) {
        if (nome == null) return "anexo.pdf";
        return nome.replaceAll("[\\\\/:*?\"<>|]", "_");
    }
    
    private String calcularHash(byte[] dados) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(dados);
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            return null;
        }
    }
    
    private EmailAnexoDTO toDTO(EmailAnexo entity) {
        return EmailAnexoDTO.builder()
            .id(entity.getId())
            .emailId(entity.getEmailId())
            .remetente(entity.getRemetente())
            .assunto(entity.getAssunto())
            .municipio(entity.getMunicipio())
            .dataEmail(entity.getDataEmail())
            .nomeArquivo(entity.getNomeArquivo())
            .mimeType(entity.getMimeType())
            .criadoEm(entity.getCriadoEm())
            .build();
    }
}