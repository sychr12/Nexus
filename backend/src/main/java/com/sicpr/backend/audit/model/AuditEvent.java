package com.sicpr.backend.audit.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "auditoria_eventos")
public class AuditEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ocorreu_em", nullable = false)
    private LocalDateTime ocorreuEm;

    @Column(name = "usuario", length = 120)
    private String usuario;

    @Column(name = "acao", nullable = false, length = 120)
    private String acao;

    @Column(name = "recurso_tipo", length = 80)
    private String recursoTipo;

    @Column(name = "recurso_id", length = 160)
    private String recursoId;

    @Column(name = "metodo_http", length = 12)
    private String metodoHttp;

    @Column(name = "caminho", length = 500)
    private String caminho;

    @Column(name = "status_http")
    private Integer statusHttp;

    @Column(name = "resultado", nullable = false, length = 40)
    private String resultado;

    @Column(name = "ip_origem", length = 80)
    private String ipOrigem;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "correlation_id", length = 120)
    private String correlationId;

    @Column(name = "detalhes", columnDefinition = "TEXT")
    private String detalhes;

    @PrePersist
    void prePersist() {
        if (ocorreuEm == null) {
            ocorreuEm = LocalDateTime.now();
        }
    }
}
