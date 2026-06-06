package com.sicpr.backend.mensagem.model;

import com.sicpr.backend.user.model.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "mensagens")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mensagem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "remetente_id", nullable = false)
    private User remetente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "destinatario_id", nullable = false)
    private User destinatario;

    @Column(columnDefinition = "TEXT")
    private String texto;

    private String anexoNomeOriginal;

    private String anexoNomeArquivo;

    private String anexoContentType;

    private Long anexoTamanho;

    private Boolean lida;

    private LocalDateTime criadoEm;

    private LocalDateTime expiraEm;

    @PrePersist
    protected void onCreate() {
        criadoEm = LocalDateTime.now();
        expiraEm = criadoEm.plusHours(24);
        if (lida == null) lida = false;
    }
}
