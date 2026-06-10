package com.sicpr.backend.fluxo.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class ProcessoFluxoResponse {
    private String id;
    private String produtor;
    private String cpf;
    private String tipoProcesso;
    private String unidadeLocal;
    private String tecnicoResponsavel;
    private String formulario;
    private String fac;
    private String declaracaoProdutor;
    private String declaracoes;
    private Map<String, Map<String, String>> documentosGerados;
    private String facStatus;
    private LocalDateTime facGeradaEm;
    private String facGeradaPor;
    private LocalDateTime facImpressaEm;
    private String facImpressaPor;
    private LocalDateTime facAssinadaAnexadaEm;
    private String facAssinadaAnexadaPor;
    private String facAssinadaDocumentoId;
    private String facRejeitadaMotivo;
    private List<DocumentoFluxoResponse> documentos;
    private String situacao;
    private LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;
    private LocalDateTime encaminhadoGerenteEm;
    private String gerenteResponsavel;
    private LocalDateTime gerenteAssinadoEm;
    private Map<String, Object> assinaturaEletronica;
    private String memorandoNumero;
    private String memorandoLoteId;
    private String memorandoArquivo;
    private LocalDateTime memorandoCriadoEm;
    private Integer memorandoQuantidade;
    private List<Map<String, Object>> memorandoProdutores;
    private List<Map<String, Object>> memorandos;
    private LocalDateTime enviadoAnaliseEm;
    private String analistaResponsavel;
    private LocalDateTime analisadoEm;
    private String lancadoPor;
    private LocalDateTime lancadoEm;
    private String ultimaJustificativa;
    private List<HistoricoFluxoResponse> historico;
}
