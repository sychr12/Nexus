// backend/src/main/java/com/sicpr/backend/email/model/EmailAnexo.java
package com.sicpr.backend.email.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.time.LocalDateTime;

@Entity
@Table(name = "emails_anexos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailAnexo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "email_id", nullable = false, length = 255)
    private String emailId;

    @Column(length = 500)
    private String remetente;

    @Column(length = 500)
    private String assunto;

    @Column(length = 100)
    private String municipio;

    @Column(name = "data_email")
    private LocalDateTime dataEmail;

    @Column(name = "nome_arquivo", nullable = false, length = 500)
    private String nomeArquivo;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Lob
    @Column(name = "pdf", columnDefinition = "BYTEA") 
    private byte[] pdf;

    @Column(name = "hash_sha256", length = 100)
    private String hashSha256;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    @PrePersist
    protected void onCreate() {
        criadoEm = LocalDateTime.now();
    }
}