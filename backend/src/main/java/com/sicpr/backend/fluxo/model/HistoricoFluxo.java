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
@Table(name = "fluxo_historico")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoricoFluxo {

    @Id
    @Column(length = 40)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processo_id", nullable = false)
    private ProcessoFluxo processo;

    @Column(nullable = false, length = 120)
    private String usuario;

    @Column(nullable = false, length = 180)
    private String acao;

    private LocalDateTime dataHora;

    @Column(columnDefinition = "TEXT")
    private String observacao;

    @PrePersist
    void onCreate() {
        if (id == null || id.isBlank()) {
            id = FluxoIdGenerator.generate("hist");
        }
        if (dataHora == null) {
            dataHora = LocalDateTime.now();
        }
    }
}
