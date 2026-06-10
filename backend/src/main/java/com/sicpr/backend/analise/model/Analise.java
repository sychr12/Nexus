package com.sicpr.backend.analise.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "analises")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Analise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // N° memorando
    private String numero;

    // Título do memorando
    private String titulo;

    // RENOVACAO / INSCRICAO / DEVOLUCAO
    private String motivo;

    // Município/localidade
    private String localidade;

    // urgente / normal
    private String prioridade;

    // recebido / em_analise / finalizado
    private String status;

    // caminho ou base64 do PDF
    @Column(columnDefinition = "TEXT")
    private String memorandoPdf;

    // quem abriu análise
    private String abertoPor;

    // timestamps
    @Column(name = "recebido_em", updatable = false)
    private LocalDateTime recebidoEm;

    private LocalDateTime abertoEm;

    private LocalDateTime finalizadoEm;

    // processos vinculados
    @OneToMany(
            mappedBy = "analise",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<ProcessoAnalise> processos;

    @PrePersist
    protected void onCreate() {

        if (recebidoEm == null) {
            recebidoEm = LocalDateTime.now();
        }

        if (status == null || status.isBlank()) {
            status = "recebido";
        }
    }
}
