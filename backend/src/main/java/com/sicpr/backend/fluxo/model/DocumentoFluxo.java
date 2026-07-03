package com.sicpr.backend.fluxo.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
@Entity
@Table(name = "fluxo_documentos")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentoFluxo {

    @Id
    @Column(length = 40)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processo_id", nullable = false)
    private ProcessoFluxo processo;

    @Column(nullable = false, length = 160)
    private String nome;

    @Column(nullable = false, length = 240)
    private String arquivo;

    private Boolean obrigatorio;

    @Column(nullable = false, length = 40)
    private String categoria;

    private String mimeType;
    private Long tamanho;

    @Column(columnDefinition = "TEXT")
    private String conteudo;

    private LocalDateTime criadoEm;

    @PrePersist
    void onCreate() {
        if (id == null || id.isBlank()) {
            id = FluxoIdGenerator.generate("doc");
        }
        if (obrigatorio == null) {
            obrigatorio = false;
        }
        if (categoria == null) {
            categoria = "outros";
        }
        criadoEm = LocalDateTime.now();
    }
}
