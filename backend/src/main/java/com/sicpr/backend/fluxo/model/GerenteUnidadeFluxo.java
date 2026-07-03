package com.sicpr.backend.fluxo.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
@Entity
@Table(name = "fluxo_gerentes_unidade")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GerenteUnidadeFluxo {

    @Id
    @Column(length = 40)
    private String id;

    @Column(nullable = false, length = 160)
    private String nome;

    @Column(nullable = false, length = 120)
    private String unidadeLocal;

    @Column(nullable = false, length = 120)
    private String cargo;

    private String telefoneCorporativo;
    private String telefonePessoal;

    @Column(nullable = false, length = 30)
    private String status;

    private LocalDateTime cadastradoEm;
    private LocalDateTime encerradoEm;
    private LocalDateTime atualizadoEm;

    @PrePersist
    void onCreate() {
        if (id == null || id.isBlank()) {
            id = FluxoIdGenerator.generate("ger");
        }
        if (status == null) {
            status = "ativo";
        }
        cadastradoEm = LocalDateTime.now();
        atualizadoEm = cadastradoEm;
    }

    @PreUpdate
    void onUpdate() {
        atualizadoEm = LocalDateTime.now();
    }
}
