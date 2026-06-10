package com.sicpr.backend.fluxo.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "fluxo_processos")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessoFluxo {

    @Id
    @Column(length = 40)
    private String id;

    @Column(nullable = false, length = 180)
    private String produtor;

    @Column(nullable = false, length = 14)
    private String cpf;

    @Column(nullable = false, length = 30)
    private String tipoProcesso;

    @Column(nullable = false, length = 120)
    private String unidadeLocal;

    @Column(nullable = false, length = 120)
    private String tecnicoResponsavel;

    @Column(nullable = false, length = 40)
    private String situacao;

    private String formulario;
    private String fac;
    private String declaracaoProdutor;
    private String declaracoes;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String documentosGeradosJson;

    @Column(length = 40)
    private String facStatus;
    private LocalDateTime facGeradaEm;
    private String facGeradaPor;
    private LocalDateTime facImpressaEm;
    private String facImpressaPor;
    private LocalDateTime facAssinadaAnexadaEm;
    private String facAssinadaAnexadaPor;
    private String facAssinadaDocumentoId;
    @Lob
    @Column(columnDefinition = "TEXT")
    private String facRejeitadaMotivo;

    private String memorandoArquivo;
    private LocalDateTime memorandoCriadoEm;
    private Integer memorandoQuantidade;
    @Lob
    @Column(columnDefinition = "TEXT")
    private String memorandoProdutoresJson;
    @Lob
    @Column(columnDefinition = "TEXT")
    private String memorandosJson;
    private String memorandoNumero;
    private String memorandoLoteId;

    private String gerenteResponsavel;
    private LocalDateTime gerenteAssinadoEm;
    @Lob
    @Column(columnDefinition = "TEXT")
    private String assinaturaEletronicaJson;

    private LocalDateTime encaminhadoGerenteEm;
    private LocalDateTime enviadoAnaliseEm;
    private String analistaResponsavel;
    private LocalDateTime analisadoEm;
    private String lancadoPor;
    private LocalDateTime lancadoEm;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String ultimaJustificativa;

    private LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;

    @OneToMany(mappedBy = "processo", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("criadoEm ASC")
    @Builder.Default
    private List<DocumentoFluxo> documentos = new ArrayList<>();

    @OneToMany(mappedBy = "processo", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("dataHora ASC")
    @Builder.Default
    private List<HistoricoFluxo> historico = new ArrayList<>();

    @PrePersist
    void onCreate() {
        if (id == null || id.isBlank()) {
            id = "proc-" + UUID.randomUUID();
        }
        if (situacao == null) {
            situacao = "em_elaboracao";
        }
        if (facStatus == null) {
            facStatus = "nao_gerada";
        }
        criadoEm = LocalDateTime.now();
        atualizadoEm = criadoEm;
    }

    @PreUpdate
    void onUpdate() {
        atualizadoEm = LocalDateTime.now();
    }
}
