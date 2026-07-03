package com.sicpr.backend.fluxo.mapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sicpr.backend.fluxo.dto.DocumentoFluxoResponse;
import com.sicpr.backend.fluxo.dto.GerenteUnidadeResponse;
import com.sicpr.backend.fluxo.dto.HistoricoFluxoResponse;
import com.sicpr.backend.fluxo.dto.ProcessoFluxoResponse;
import com.sicpr.backend.fluxo.model.DocumentoFluxo;
import com.sicpr.backend.fluxo.model.GerenteUnidadeFluxo;
import com.sicpr.backend.fluxo.model.HistoricoFluxo;
import com.sicpr.backend.fluxo.model.ProcessoFluxo;
import com.sicpr.backend.security.CryptoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class ProcessoFluxoMapper {

    private final ObjectMapper objectMapper;
    private final CryptoService cryptoService;

    public ProcessoFluxoResponse toResponse(ProcessoFluxo processo) {
        return ProcessoFluxoResponse.builder()
                .id(processo.getId())
                .produtor(processo.getProdutor())
                .cpf(cpfPlain(processo))
                .tipoProcesso(processo.getTipoProcesso())
                .unidadeLocal(processo.getUnidadeLocal())
                .tecnicoResponsavel(processo.getTecnicoResponsavel())
                .formulario(processo.getFormulario())
                .fac(processo.getFac())
                .declaracaoProdutor(processo.getDeclaracaoProdutor())
                .declaracoes(processo.getDeclaracoes())
                .documentosGerados(readGeneratedDocs(processo))
                .facStatus(processo.getFacStatus())
                .facGeradaEm(processo.getFacGeradaEm())
                .facGeradaPor(processo.getFacGeradaPor())
                .facImpressaEm(processo.getFacImpressaEm())
                .facImpressaPor(processo.getFacImpressaPor())
                .facAssinadaAnexadaEm(processo.getFacAssinadaAnexadaEm())
                .facAssinadaAnexadaPor(processo.getFacAssinadaAnexadaPor())
                .facAssinadaDocumentoId(processo.getFacAssinadaDocumentoId())
                .facRejeitadaMotivo(processo.getFacRejeitadaMotivo())
                .documentos(processo.getDocumentos().stream().map(this::toDocumentoResponse).toList())
                .situacao(processo.getSituacao())
                .criadoEm(processo.getCriadoEm())
                .atualizadoEm(processo.getAtualizadoEm())
                .encaminhadoGerenteEm(processo.getEncaminhadoGerenteEm())
                .gerenteResponsavel(processo.getGerenteResponsavel())
                .gerenteAssinadoEm(processo.getGerenteAssinadoEm())
                .assinaturaEletronica(fromJsonMap(processo.getAssinaturaEletronicaJson()))
                .memorandoNumero(processo.getMemorandoNumero())
                .memorandoLoteId(processo.getMemorandoLoteId())
                .memorandoArquivo(processo.getMemorandoArquivo())
                .memorandoCriadoEm(processo.getMemorandoCriadoEm())
                .memorandoQuantidade(processo.getMemorandoQuantidade())
                .memorandoProdutores(fromJsonList(processo.getMemorandoProdutoresJson()))
                .memorandos(fromJsonList(processo.getMemorandosJson()))
                .enviadoAnaliseEm(processo.getEnviadoAnaliseEm())
                .analistaResponsavel(processo.getAnalistaResponsavel())
                .analisadoEm(processo.getAnalisadoEm())
                .lancadoPor(processo.getLancadoPor())
                .lancadoEm(processo.getLancadoEm())
                .ultimaJustificativa(decryptNullable(processo.getUltimaJustificativa()))
                .historico(processo.getHistorico().stream().map(this::toHistoricoResponse).toList())
                .build();
    }

    public Map<String, Map<String, String>> readGeneratedDocs(ProcessoFluxo processo) {
        return fromJson(processo.getDocumentosGeradosJson(), new TypeReference<>() {});
    }

    public GerenteUnidadeResponse toGerenteResponse(GerenteUnidadeFluxo gerente) {
        return GerenteUnidadeResponse.builder()
                .id(gerente.getId())
                .nome(gerente.getNome())
                .unidadeLocal(gerente.getUnidadeLocal())
                .cargo(gerente.getCargo())
                .telefoneCorporativo(gerente.getTelefoneCorporativo())
                .telefonePessoal(gerente.getTelefonePessoal())
                .status(gerente.getStatus())
                .cadastradoEm(gerente.getCadastradoEm())
                .encerradoEm(gerente.getEncerradoEm())
                .build();
    }

    private DocumentoFluxoResponse toDocumentoResponse(DocumentoFluxo documento) {
        return DocumentoFluxoResponse.builder()
                .id(documento.getId())
                .nome(documento.getNome())
                .arquivo(documento.getArquivo())
                .obrigatorio(documento.getObrigatorio())
                .categoria(documento.getCategoria())
                .conteudo(decryptNullable(documento.getConteudo()))
                .mimeType(documento.getMimeType())
                .tamanho(documento.getTamanho())
                .build();
    }

    private HistoricoFluxoResponse toHistoricoResponse(HistoricoFluxo historico) {
        return HistoricoFluxoResponse.builder()
                .id(historico.getId())
                .usuario(historico.getUsuario())
                .acao(historico.getAcao())
                .dataHora(historico.getDataHora())
                .observacao(decryptNullable(historico.getObservacao()))
                .build();
    }

    private List<Map<String, Object>> fromJsonList(String json) {
        if (json == null || json.isBlank()) return List.of();
        return fromJson(json, new TypeReference<>() {});
    }

    private Map<String, Object> fromJsonMap(String json) {
        if (json == null || json.isBlank()) return null;
        return fromJson(json, new TypeReference<>() {});
    }

    private <T> T fromJson(String json, TypeReference<T> typeReference) {
        try {
            String value = json == null || json.isBlank() ? "null" : cryptoService.decrypt(json);
            T parsed = objectMapper.readValue(value, typeReference);
            if (parsed != null) return parsed;
            return objectMapper.readValue("{}", typeReference);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Falha ao ler dados persistidos do fluxo.");
        }
    }

    private String decryptNullable(String value) {
        return value == null || value.isBlank() ? null : cryptoService.decrypt(value);
    }

    private String cpfPlain(ProcessoFluxo processo) {
        String value = processo.getCpf();
        return value == null || value.isBlank() ? "" : cryptoService.decrypt(value);
    }
}
