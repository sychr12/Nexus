package com.sicpr.backend.fluxo.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sicpr.backend.fluxo.dto.DocumentoFluxoRequest;
import com.sicpr.backend.fluxo.dto.ProcessoFluxoRequest;
import com.sicpr.backend.fluxo.dto.ProcessoFluxoResponse;
import com.sicpr.backend.fluxo.model.DocumentoFluxo;
import com.sicpr.backend.fluxo.model.HistoricoFluxo;
import com.sicpr.backend.fluxo.model.ProcessoFluxo;
import com.sicpr.backend.fluxo.mapper.ProcessoFluxoMapper;
import com.sicpr.backend.fluxo.repository.ProcessoFluxoRepository;
import com.sicpr.backend.security.CryptoService;
import com.sicpr.backend.security.CurrentUserService;
import com.sicpr.backend.security.SearchHashService;
import com.sicpr.backend.user.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class FluxoService {

    private static final Pattern CPF_PATTERN = Pattern.compile("\\d{11}");
    private static final Set<String> TIPOS_PROCESSO = Set.of("inscricao", "renovacao", "alteracao");
    private static final Set<String> STATUS_EDITAVEIS_UNLOC = Set.of("em_elaboracao", "devolvido_gerente", "devolvido_analise");

    private final ProcessoFluxoRepository processoRepository;
    private final FluxoAccessPolicy accessPolicy;
    private final ProcessoFluxoMapper processoMapper;
    private final ObjectMapper objectMapper;
    private final CryptoService cryptoService;
    private final SearchHashService searchHashService;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public List<ProcessoFluxoResponse> listarProcessos(String situacao, String unidadeLocal) {
        User user = currentUserService.requireUser();
        List<ProcessoFluxo> processos;
        if (!accessPolicy.hasGlobalAccess(user)) {
            String unidadePermitida = accessPolicy.requireScopedUnidadeLocal(user);
            if (unidadeLocal != null && !unidadeLocal.isBlank() && !accessPolicy.sameUnidadeLocal(unidadePermitida, unidadeLocal)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Usuario nao tem acesso a esta unidade local.");
            }
            if (situacao != null && !situacao.isBlank()) {
                processos = processoRepository.findBySituacaoAndUnidadeLocalIgnoreCaseOrderByCriadoEmDesc(situacao, unidadePermitida);
            } else {
                processos = processoRepository.findByUnidadeLocalIgnoreCaseOrderByCriadoEmDesc(unidadePermitida);
            }
        } else if (situacao != null && !situacao.isBlank()) {
            processos = processoRepository.findBySituacaoOrderByCriadoEmDesc(situacao);
        } else if (unidadeLocal != null && !unidadeLocal.isBlank()) {
            processos = processoRepository.findByUnidadeLocalIgnoreCaseOrderByCriadoEmDesc(unidadeLocal);
        } else {
            processos = processoRepository.findAllByOrderByCriadoEmDesc();
        }
        return processos.stream().map(processoMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ProcessoFluxoResponse> listarPendentesGerente() {
        User user = currentUserService.requireUser();
        List<ProcessoFluxo> processos = accessPolicy.isAdmin(user)
                ? processoRepository.findBySituacaoOrderByCriadoEmDesc("encaminhado_gerente")
                : processoRepository.findBySituacaoAndUnidadeLocalIgnoreCaseOrderByCriadoEmDesc("encaminhado_gerente", accessPolicy.requireScopedUnidadeLocal(user));
        return processos
                .stream()
                .map(processoMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProcessoFluxoResponse> listarPendentesAnalise() {
        User user = currentUserService.requireUser();
        List<String> situacoes = List.of("em_analise", "aprovado_lancamento", "concluido");
        List<ProcessoFluxo> processos = accessPolicy.isAdmin(user)
                ? processoRepository.findBySituacaoInOrderByCriadoEmDesc(situacoes)
                : processoRepository.findBySituacaoInAndUnidadeLocalIgnoreCaseOrderByCriadoEmDesc(situacoes, accessPolicy.requireScopedUnidadeLocal(user));
        return processos
                .stream()
                .map(processoMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProcessoFluxoResponse buscarProcesso(String id) {
        ProcessoFluxo processo = findProcesso(id);
        accessPolicy.requireAccessToProcesso(currentUserService.requireUser(), processo);
        return processoMapper.toResponse(processo);
    }

    @Transactional
    public ProcessoFluxoResponse criarProcesso(ProcessoFluxoRequest request, String usuario) {
        validarProcessoRequest(request);
        accessPolicy.requireAccessToUnidadeLocal(currentUserService.requireUser(), request.getUnidadeLocal());
        String cpf = normalizarCpf(request.getCpf());
        LocalDateTime agora = LocalDateTime.now();

        ProcessoFluxo processo = ProcessoFluxo.builder()
                .produtor(request.getProdutor().trim())
                .cpf(cryptoService.encrypt(cpf))
                .cpfHash(searchHashService.cpfHash(cpf))
                .tipoProcesso(request.getTipoProcesso())
                .unidadeLocal(request.getUnidadeLocal().trim())
                .tecnicoResponsavel(usuario)
                .situacao("em_elaboracao")
                .formulario("Formulario cadastral - " + request.getProdutor().trim() + ".pdf")
                .fac("FAC - " + request.getProdutor().trim() + ".pdf")
                .declaracaoProdutor("Declaracao do produtor rural - " + request.getProdutor().trim() + ".pdf")
                .declaracoes("")
                .documentosGeradosJson(toJson(request.getDocumentosGerados()))
                .facStatus(calcularFacStatus(request.getDocumentosGerados(), request.getDocumentos()))
                .facGeradaEm(hasGeneratedFac(request.getDocumentosGerados()) ? agora : null)
                .facGeradaPor(hasGeneratedFac(request.getDocumentosGerados()) ? usuario : null)
                .build();

        adicionarDocumentos(processo, request.getDocumentos());
        DocumentoFluxo facAssinada = findFacAssinada(processo.getDocumentos());
        if (facAssinada != null) {
            processo.setFacAssinadaAnexadaEm(agora);
            processo.setFacAssinadaAnexadaPor(usuario);
            processo.setFacAssinadaDocumentoId(facAssinada.getId());
        }
        addHistorico(processo, usuario, "Processo criado", request.getTipoProcesso());
        if (hasGeneratedFac(request.getDocumentosGerados())) {
            addHistorico(processo, usuario, "FAC gerada", "Documento preenchido automaticamente pelo SICPR");
        }
        if (facAssinada != null) {
            addHistorico(processo, usuario, "FAC assinada anexada", facAssinada.getArquivo());
        }

        return processoMapper.toResponse(processoRepository.save(processo));
    }

    @Transactional
    public ProcessoFluxoResponse atualizarProcesso(String id, ProcessoFluxoRequest request, String usuario) {
        validarProcessoRequest(request);
        ProcessoFluxo processo = findProcesso(id);
        User user = currentUserService.requireUser();
        accessPolicy.requireAccessToProcesso(user, processo);
        accessPolicy.requireAccessToUnidadeLocal(user, request.getUnidadeLocal());
        requireSituacao(processo, STATUS_EDITAVEIS_UNLOC, "Processo nao pode ser editado nesta etapa.");

        boolean facJaGerada = hasGeneratedFac(processoMapper.readGeneratedDocs(processo));
        boolean facNovaGerada = !facJaGerada && hasGeneratedFac(request.getDocumentosGerados());
        DocumentoFluxo facAnterior = findFacAssinada(processo.getDocumentos());

        processo.setProdutor(request.getProdutor().trim());
        String cpf = normalizarCpf(request.getCpf());
        processo.setCpf(cryptoService.encrypt(cpf));
        processo.setCpfHash(searchHashService.cpfHash(cpf));
        processo.setTipoProcesso(request.getTipoProcesso());
        processo.setUnidadeLocal(request.getUnidadeLocal().trim());
        processo.setTecnicoResponsavel(processo.getTecnicoResponsavel() != null ? processo.getTecnicoResponsavel() : usuario);
        processo.setFormulario("Formulario cadastral - " + processo.getProdutor() + ".pdf");
        processo.setFac("FAC - " + processo.getProdutor() + ".pdf");
        processo.setDeclaracaoProdutor("Declaracao do produtor rural - " + processo.getProdutor() + ".pdf");
        processo.setDocumentosGeradosJson(toJson(request.getDocumentosGerados()));
        processo.getDocumentos().clear();
        adicionarDocumentos(processo, request.getDocumentos());
        processo.setFacStatus(calcularFacStatus(request.getDocumentosGerados(), request.getDocumentos()));

        if (facNovaGerada) {
            processo.setFacGeradaEm(LocalDateTime.now());
            processo.setFacGeradaPor(usuario);
            addHistorico(processo, usuario, "FAC gerada", "Documento preenchido automaticamente pelo SICPR");
        }

        DocumentoFluxo facAtual = findFacAssinada(processo.getDocumentos());
        if (facAtual != null && (facAnterior == null || !facAtual.getId().equals(facAnterior.getId()))) {
            processo.setFacAssinadaAnexadaEm(LocalDateTime.now());
            processo.setFacAssinadaAnexadaPor(usuario);
            processo.setFacAssinadaDocumentoId(facAtual.getId());
            addHistorico(processo, usuario, facAnterior == null ? "FAC assinada anexada" : "FAC substituida", facAtual.getArquivo());
        }

        addHistorico(processo, usuario, "Correcao salva pela UNLOC", processo.getUnidadeLocal());
        return processoMapper.toResponse(processoRepository.save(processo));
    }

    private ProcessoFluxo findProcesso(String id) {
        return processoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Processo nao encontrado."));
    }

    private void validarProcessoRequest(ProcessoFluxoRequest request) {
        requireText(request.getProdutor(), "Produtor obrigatorio.");
        requireText(request.getCpf(), "CPF obrigatorio.");
        requireText(request.getUnidadeLocal(), "Unidade Local obrigatoria.");
        if (!TIPOS_PROCESSO.contains(request.getTipoProcesso())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de processo invalido.");
        }
        normalizarCpf(request.getCpf());
    }

    private String normalizarCpf(String cpf) {
        String value = cpf == null ? "" : cpf.replaceAll("\\D", "");
        if (!CPF_PATTERN.matcher(value).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CPF invalido.");
        }
        return value;
    }

    private String requireText(String value, String message) {
        if (value == null || value.trim().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return value.trim();
    }

    private void requireSituacao(ProcessoFluxo processo, Set<String> allowed, String message) {
        if (!allowed.contains(processo.getSituacao())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, message);
        }
    }

    private void adicionarDocumentos(ProcessoFluxo processo, List<DocumentoFluxoRequest> documentos) {
        if (documentos == null) return;
        documentos.forEach(request -> {
            DocumentoFluxo documento = DocumentoFluxo.builder()
                    .id(request.getId())
                    .processo(processo)
                    .nome(request.getNome() == null || request.getNome().isBlank() ? request.getArquivo() : request.getNome())
                    .arquivo(requireText(request.getArquivo(), "Arquivo do documento obrigatorio."))
                    .obrigatorio(Boolean.TRUE.equals(request.getObrigatorio()) || "fac_assinada".equals(request.getCategoria()))
                    .categoria(request.getCategoria() == null || request.getCategoria().isBlank() ? "outros" : request.getCategoria())
                    .conteudo(encryptNullable(request.getConteudo()))
                    .mimeType(request.getMimeType())
                    .tamanho(request.getTamanho())
                    .build();
            processo.getDocumentos().add(documento);
        });
    }

    private void addHistorico(ProcessoFluxo processo, String usuario, String acao, String observacao) {
        processo.getHistorico().add(HistoricoFluxo.builder()
                .processo(processo)
                .usuario(usuario == null || usuario.isBlank() ? "Sistema" : usuario)
                .acao(acao)
                .observacao(encryptNullable(observacao))
                .dataHora(LocalDateTime.now())
                .build());
    }

    private String calcularFacStatus(Map<String, Map<String, String>> gerados, List<DocumentoFluxoRequest> documentos) {
        boolean facAssinada = documentos != null && documentos.stream().anyMatch(doc -> "fac_assinada".equals(doc.getCategoria()));
        if (facAssinada) return "assinada_anexada";
        if (hasGeneratedFac(gerados)) return "gerada";
        return "nao_gerada";
    }

    private boolean hasGeneratedFac(Map<String, Map<String, String>> gerados) {
        return gerados != null && gerados.containsKey("fac");
    }

    private boolean hasGeneratedFac(Map<String, Map<String, String>> gerados, String unused) {
        return hasGeneratedFac(gerados);
    }

    private DocumentoFluxo findFacAssinada(List<DocumentoFluxo> documentos) {
        return documentos.stream().filter(doc -> "fac_assinada".equals(doc.getCategoria())).findFirst().orElse(null);
    }

    private String toJson(Map<String, Map<String, String>> value) {
        return toJsonObject(value == null ? Map.of() : value);
    }

    private String toJsonObject(Object value) {
        try {
            return cryptoService.encrypt(objectMapper.writeValueAsString(value));
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dados em formato invalido.");
        }
    }

    private String encryptNullable(String value) {
        return value == null || value.isBlank() ? null : cryptoService.encrypt(value);
    }
}
