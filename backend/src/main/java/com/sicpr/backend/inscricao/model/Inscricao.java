package com.sicpr.backend.inscricao.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;


@Entity
@Table(name = "inscricoes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inscricao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nome;
    private String cpf;
    @Column(name = "cpf_hash", length = 64)
    private String cpfHash;
    private String municipio;
    private String memorando;
    private String latitude;
    private String longitude;
    private String tipo;
    private String origem;
    @Column(name = "processo_fluxo_id", length = 40)
    private String processoFluxoId;
    @Column(name = "lancado_em")
    private LocalDateTime lancadoEm;
    @Column(name = "criado_em", updatable = false)
    private LocalDateTime criadoEm;

    @PrePersist
    protected void onCreate() {
        if (criadoEm == null) {
            criadoEm = LocalDateTime.now();
        }
    }
}
