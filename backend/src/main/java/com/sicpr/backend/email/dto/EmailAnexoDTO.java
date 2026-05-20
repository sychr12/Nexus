// backend/src/main/java/com/sicpr/backend/email/dto/EmailAnexoDTO.java
package com.sicpr.backend.email.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailAnexoDTO {
    private Long id;
    private String emailId;
    private String remetente;
    private String assunto;
    private String municipio;
    private LocalDateTime dataEmail;
    private String nomeArquivo;
    private String mimeType;
    private LocalDateTime criadoEm;
}