package com.sicpr.backend.fluxo.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sicpr.backend.fluxo.dto.AprovarLoteRequest;
import com.sicpr.backend.fluxo.dto.DocumentoFluxoRequest;
import com.sicpr.backend.fluxo.dto.DocumentoFluxoResponse;
import com.sicpr.backend.fluxo.dto.GerenteUnidadeRequest;
import com.sicpr.backend.fluxo.dto.GerenteUnidadeResponse;
import com.sicpr.backend.fluxo.dto.HistoricoFluxoResponse;
import com.sicpr.backend.fluxo.dto.ProcessoFluxoRequest;
import com.sicpr.backend.fluxo.dto.ProcessoFluxoResponse;
import com.sicpr.backend.fluxo.model.DocumentoFluxo;
import com.sicpr.backend.fluxo.model.GerenteUnidadeFluxo;
import com.sicpr.backend.fluxo.model.HistoricoFluxo;
import com.sicpr.backend.fluxo.model.ProcessoFluxo;
import com.sicpr.backend.fluxo.repository.GerenteUnidadeFluxoRepository;
import com.sicpr.backend.fluxo.repository.ProcessoFluxoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class FluxoService {

    private static final Pattern CPF_PATTERN = Pattern.compile("\\d{11}");
    private static final Set<String> TIPOS_PROCESSO = Set.of("inscricao", "renovacao", "alteracao");
    private static final Set<String> STATUS_EDITAVEIS_UNLOC = Set.of("em_elaboracao", "devolvido_gerente", "devolvido_analise");

    private final ProcessoFluxoRepository processoRepository;
    private final GerenteUnidadeFluxoRepository gerenteRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<ProcessoFluxoResponse> listarProcessos(String situacao, String unidadeLocal) {
        List<ProcessoFluxo> processos;
        if (situacao != null && !situacao.isBlank()) {
            processos = processoRepository.findBySituacaoOrderByCriadoEmDesc(situacao);
        } else if (unidadeLocal != null && !unidadeLocal.isBlank()) {
            processos = processoRepository.findByUnidadeLocalIgnoreCaseOrderByCriadoEmDesc(unidadeLocal);
        } else {
            processos = processoRepository.findAllByOrderByCriadoEmDesc();
        }
        return processos.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ProcessoFluxoResponse> listarPendentesGerente() {
        return processoRepository.findBySituacaoOrderByCriadoEmDesc("encaminhado_gerente")
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProcessoFluxoResponse> listarPendentesAnalise() {
        return processoRepository.findBySituacaoInOrderByCriadoEmDesc(List.of("em_analise", "aprovado_lancamento", "concluido"))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProcessoFluxoResponse buscarProcesso(String id) {
        return toResponse(findProcesso(id));
    }

    @Transactional
    public ProcessoFluxoResponse criarProcesso(ProcessoFluxoRequest request, String usuario) {
        validarProcessoRequest(request);
        String cpf = normalizarCpf(request.getCpf());
        LocalDateTime agora = LocalDateTime.now();

        ProcessoFluxo processo = ProcessoFluxo.builder()
                .produtor(request.getProdutor().trim())
                .cpf(cpf)
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

        return toResponse(processoRepository.save(processo));
    }

    @Transactional
    public ProcessoFluxoResponse atualizarProcesso(String id, ProcessoFluxoRequest request, String usuario) {
        validarProcessoRequest(request);
        ProcessoFluxo processo = findProcesso(id);
        requireSituacao(processo, STATUS_EDITAVEIS_UNLOC, "Processo nao pode ser editado nesta etapa.");

        boolean facJaGerada = hasGeneratedFac(readGeneratedDocs(processo));
        boolean facNovaGerada = !facJaGerada && hasGeneratedFac(request.getDocumentosGerados());
        DocumentoFluxo facAnterior = findFacAssinada(processo.getDocumentos());

        processo.setProdutor(request.getProdutor().trim());
        processo.setCpf(normalizarCpf(request.getCpf()));
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
        return toResponse(processoRepository.save(processo));
    }

    @Transactional
    public ProcessoFluxoResponse encaminharGerente(String id, String usuario) {
        ProcessoFluxo processo = findProcesso(id);
        requireSituacao(processo, STATUS_EDITAVEIS_UNLOC, "Somente processos em elaboracao/devolucao podem ser encaminhados.");
        if (!"assinada_anexada".equals(processo.getFacStatus())) {
            processo.setUltimaJustificativa("A FAC assinada pelo produtor ainda nao foi anexada ao processo.");
            addHistorico(processo, "Sistema", "Encaminhamento bloqueado", "FAC assinada pelo produtor obrigatoria");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, processo.getUltimaJustificativa());
        }
        processo.setSituacao("encaminhado_gerente");
        processo.setEncaminhadoGerenteEm(LocalDateTime.now());
        processo.setUltimaJustificativa(null);
        addHistorico(processo, usuario, "Encaminhado ao gerente", processo.getUnidadeLocal());
        return toResponse(processoRepository.save(processo));
    }

    @Transactional
    public List<ProcessoFluxoResponse> aprovarLoteGerente(AprovarLoteRequest request, String usuario) {
        if (request.getIds() == null || request.getIds().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecione ao menos um processo.");
        }
        List<ProcessoFluxo> processos = processoRepository.findAllById(request.getIds());
        if (processos.size() != request.getIds().size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Um ou mais processos nao foram encontrados.");
        }
        processos.forEach(processo -> requireSituacao(processo, Set.of("encaminhado_gerente"), "Todos os processos devem estar encaminhados ao gerente."));

        GerenteUnidadeFluxo gerente = resolveGerente(request.getGerenteId(), processos.get(0).getUnidadeLocal(), usuario);
        String memorandoNumero = gerarNumeroMemorando();
        String loteId = "lote-" + UUID.randomUUID();
        String codigoValidacao = gerarCodigoValidacao(memorandoNumero);
        LocalDateTime agora = LocalDateTime.now();
        List<Map<String, Object>> produtores = processos.stream().map(this::produtorMemorando).toList();
        Map<String, Object> assinatura = criarAssinatura(loteId, memorandoNumero, codigoValidacao, gerente, processos, produtores, agora);
        Map<String, Object> memorando = criarMemorando(loteId, memorandoNumero, gerente, processos, produtores, assinatura, agora);

        processos.forEach(processo -> {
            processo.setSituacao("em_analise");
            processo.setGerenteResponsavel(gerente.getNome());
            processo.setGerenteAssinadoEm(agora);
            processo.setAssinaturaEletronicaJson(toJsonObject(assinatura));
            processo.setMemorandoNumero(memorandoNumero);
            processo.setMemorandoLoteId(loteId);
            processo.setMemorandoArquivo("Memorando " + memorandoNumero + ".pdf");
            processo.setMemorandoCriadoEm(agora);
            processo.setMemorandoQuantidade(processos.size());
            processo.setMemorandoProdutoresJson(toJsonObject(produtores));
            processo.setMemorandosJson(toJsonObject(List.of(memorando)));
            processo.setEnviadoAnaliseEm(agora);
            processo.setUltimaJustificativa(null);
            addHistorico(processo, gerente.getNome(), "Aprovado e assinado pelo gerente", "Memorando " + memorandoNumero);
            addHistorico(processo, "Sistema", "Memorando de lote gerado", memorandoNumero + " com " + processos.size() + " processo(s)");
            addHistorico(processo, "Sistema", "Codigo de validacao gerado", codigoValidacao);
            addHistorico(processo, gerente.getNome(), "Encaminhado para analise", processo.getUnidadeLocal());
        });

        return processoRepository.saveAll(processos).stream().map(this::toResponse).toList();
    }

    @Transactional
    public ProcessoFluxoResponse devolverPeloGerente(String id, String justificativa, String usuario) {
        ProcessoFluxo processo = findProcesso(id);
        requireSituacao(processo, Set.of("encaminhado_gerente"), "Processo nao esta aguardando decisao do gerente.");
        processo.setSituacao("devolvido_gerente");
        processo.setGerenteResponsavel(usuario);
        processo.setUltimaJustificativa(requireText(justificativa, "Justificativa obrigatoria."));
        addHistorico(processo, usuario, "Devolvido pelo gerente", processo.getUltimaJustificativa());
        return toResponse(processoRepository.save(processo));
    }

    @Transactional
    public ProcessoFluxoResponse aprovarAnalise(String id, String usuario) {
        ProcessoFluxo processo = findProcesso(id);
        requireSituacao(processo, Set.of("em_analise"), "Processo nao esta em analise.");
        processo.setSituacao("aprovado_lancamento");
        processo.setAnalistaResponsavel(usuario);
        processo.setAnalisadoEm(LocalDateTime.now());
        processo.setUltimaJustificativa(null);
        addHistorico(processo, usuario, "Aprovado pela analise e encaminhado para lancamento", "Processo aguardando lancamento.");
        return toResponse(processoRepository.save(processo));
    }

    @Transactional
    public ProcessoFluxoResponse devolverAnalise(String id, String justificativa, String usuario) {
        ProcessoFluxo processo = findProcesso(id);
        requireSituacao(processo, Set.of("em_analise"), "Processo nao esta em analise.");
        processo.setSituacao("devolvido_analise");
        processo.setAnalistaResponsavel(usuario);
        processo.setAnalisadoEm(LocalDateTime.now());
        processo.setUltimaJustificativa(requireText(justificativa, "Justificativa obrigatoria."));
        addHistorico(processo, usuario, "Devolvido pela analise", processo.getUltimaJustificativa());
        return toResponse(processoRepository.save(processo));
    }

    @Transactional
    public ProcessoFluxoResponse concluirLancamento(String id, String usuario) {
        ProcessoFluxo processo = findProcesso(id);
        requireSituacao(processo, Set.of("aprovado_lancamento"), "Processo nao esta aprovado para lancamento.");
        processo.setSituacao("concluido");
        processo.setLancadoPor(usuario);
        processo.setLancadoEm(LocalDateTime.now());
        addHistorico(processo, usuario, "Lancamento concluido", "Carteira/processo finalizado");
        return toResponse(processoRepository.save(processo));
    }

    @Transactional(readOnly = true)
    public List<GerenteUnidadeResponse> listarGerentes() {
        return gerenteRepository.findAllByOrderByUnidadeLocalAscNomeAsc().stream().map(this::toGerenteResponse).toList();
    }

    @Transactional
    public GerenteUnidadeResponse salvarGerente(GerenteUnidadeRequest request) {
        GerenteUnidadeFluxo gerente = GerenteUnidadeFluxo.builder()
                .nome(requireText(request.getNome(), "Nome obrigatorio."))
                .unidadeLocal(requireText(request.getUnidadeLocal(), "Unidade obrigatoria."))
                .cargo(requireText(request.getCargo(), "Cargo obrigatorio."))
                .telefoneCorporativo(request.getTelefoneCorporativo())
                .telefonePessoal(request.getTelefonePessoal())
                .status(request.getStatus() == null || request.getStatus().isBlank() ? "ativo" : request.getStatus())
                .build();
        return toGerenteResponse(gerenteRepository.save(gerente));
    }

    @Transactional
    public GerenteUnidadeResponse inativarGerente(String id) {
        GerenteUnidadeFluxo gerente = gerenteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gerente nao encontrado."));
        gerente.setStatus("inativo");
        gerente.setEncerradoEm(LocalDateTime.now());
        return toGerenteResponse(gerenteRepository.save(gerente));
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
                    .conteudo(request.getConteudo())
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
                .observacao(observacao)
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

    private Map<String, Map<String, String>> readGeneratedDocs(ProcessoFluxo processo) {
        return fromJson(processo.getDocumentosGeradosJson(), new TypeReference<>() {});
    }

    private GerenteUnidadeFluxo resolveGerente(String gerenteId, String unidadeLocal, String usuario) {
        if (gerenteId != null && !gerenteId.isBlank()) {
            return gerenteRepository.findById(gerenteId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gerente nao encontrado."));
        }
        return gerenteRepository.findByUnidadeLocalIgnoreCaseAndStatusInOrderByNomeAsc(unidadeLocal, List.of("ativo", "respondendo"))
                .stream()
                .findFirst()
                .orElseGet(() -> GerenteUnidadeFluxo.builder()
                        .nome(usuario)
                        .unidadeLocal(unidadeLocal)
                        .cargo("Gerente da Unidade Local")
                        .status("ativo")
                        .build());
    }

    private String gerarNumeroMemorando() {
        String suffix = String.valueOf(LocalDateTime.now().getYear()).substring(2);
        long next = processoRepository.countByMemorandoNumeroEndingWith("/" + suffix) + 1;
        return String.format("%04d/%s", next, suffix);
    }

    private String gerarCodigoValidacao(String memorandoNumero) {
        String year = String.valueOf(LocalDateTime.now().getYear());
        String numero = memorandoNumero.split("/")[0].replaceAll("\\D", "");
        String random = UUID.randomUUID().toString().replace("-", "").substring(0, 4).toUpperCase();
        return "SICPR-" + year + "-" + numero + "-" + random;
    }

    private Map<String, Object> produtorMemorando(ProcessoFluxo processo) {
        Map<String, Object> produtor = new LinkedHashMap<>();
        produtor.put("id", processo.getId());
        produtor.put("produtor", processo.getProdutor());
        produtor.put("cpf", processo.getCpf());
        produtor.put("tipoProcesso", processo.getTipoProcesso());
        return produtor;
    }

    private Map<String, Object> criarAssinatura(String loteId, String memorandoNumero, String codigo, GerenteUnidadeFluxo gerente, List<ProcessoFluxo> processos, List<Map<String, Object>> produtores, LocalDateTime agora) {
        Map<String, Object> assinatura = new LinkedHashMap<>();
        assinatura.put("id", "ass-" + UUID.randomUUID());
        assinatura.put("loteId", loteId);
        assinatura.put("codigoValidacao", codigo);
        assinatura.put("assinadaEm", agora.toString());
        assinatura.put("gerenteId", gerente.getId());
        assinatura.put("gerenteNome", gerente.getNome());
        assinatura.put("gerenteCargo", gerente.getCargo());
        assinatura.put("gerenteStatus", gerente.getStatus());
        assinatura.put("gerenteTelefoneCorporativo", gerente.getTelefoneCorporativo());
        assinatura.put("gerenteTelefonePessoal", gerente.getTelefonePessoal());
        assinatura.put("unidadeLocal", gerente.getUnidadeLocal());
        assinatura.put("memorandoNumero", memorandoNumero);
        assinatura.put("quantidadeProcessos", processos.size());
        assinatura.put("quantidadeProdutores", produtores.stream().map(item -> item.get("cpf")).distinct().count());
        assinatura.put("documentosAssinados", criarDocumentosAssinados(codigo, memorandoNumero, processos));
        return assinatura;
    }

    private Map<String, Object> criarMemorando(String loteId, String memorandoNumero, GerenteUnidadeFluxo gerente, List<ProcessoFluxo> processos, List<Map<String, Object>> produtores, Map<String, Object> assinatura, LocalDateTime agora) {
        Map<String, Object> memorando = new LinkedHashMap<>();
        memorando.put("loteId", loteId);
        memorando.put("numero", memorandoNumero);
        memorando.put("arquivo", "Memorando " + memorandoNumero + ".pdf");
        memorando.put("criadoEm", agora.toString());
        memorando.put("gerenteResponsavel", gerente.getNome());
        memorando.put("unidadeLocal", processos.get(0).getUnidadeLocal());
        memorando.put("quantidade", processos.size());
        memorando.put("produtores", produtores);
        memorando.put("assinatura", assinatura);
        return memorando;
    }

    private List<Map<String, Object>> criarDocumentosAssinados(String codigo, String memorandoNumero, List<ProcessoFluxo> processos) {
        List<Map<String, Object>> docs = new ArrayList<>();
        Map<String, Object> memorando = new LinkedHashMap<>();
        memorando.put("tipo", "memorando");
        memorando.put("nome", "Memorando");
        memorando.put("arquivo", "Memorando " + memorandoNumero + ".pdf");
        memorando.put("codigoDocumento", codigoDocumento(codigo, "MEM"));
        docs.add(memorando);
        processos.forEach(processo -> {
            Map<String, Object> doc = new LinkedHashMap<>();
            doc.put("tipo", "declaracao_produtor");
            doc.put("nome", "Declaracao - " + processo.getProdutor());
            doc.put("arquivo", processo.getDeclaracaoProdutor());
            doc.put("codigoDocumento", codigoDocumento(codigo, "DEC"));
            docs.add(doc);
        });
        return docs;
    }

    private String codigoDocumento(String codigo, String tipo) {
        int last = codigo.lastIndexOf("-");
        if (last < 0) return codigo + "-" + tipo;
        return codigo.substring(0, last) + "-" + tipo + codigo.substring(last);
    }

    private String toJson(Map<String, Map<String, String>> value) {
        return toJsonObject(value == null ? Map.of() : value);
    }

    private String toJsonObject(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dados em formato invalido.");
        }
    }

    private <T> T fromJson(String json, TypeReference<T> typeReference) {
        try {
            String value = json == null || json.isBlank() ? "null" : json;
            T parsed = objectMapper.readValue(value, typeReference);
            if (parsed != null) return parsed;
            return objectMapper.readValue("{}", typeReference);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Falha ao ler dados persistidos do fluxo.");
        }
    }

    private List<Map<String, Object>> fromJsonList(String json) {
        if (json == null || json.isBlank()) return List.of();
        return fromJson(json, new TypeReference<>() {});
    }

    private Map<String, Object> fromJsonMap(String json) {
        if (json == null || json.isBlank()) return null;
        return fromJson(json, new TypeReference<>() {});
    }

    private ProcessoFluxoResponse toResponse(ProcessoFluxo processo) {
        return ProcessoFluxoResponse.builder()
                .id(processo.getId())
                .produtor(processo.getProdutor())
                .cpf(processo.getCpf())
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
                .ultimaJustificativa(processo.getUltimaJustificativa())
                .historico(processo.getHistorico().stream().map(this::toHistoricoResponse).toList())
                .build();
    }

    private DocumentoFluxoResponse toDocumentoResponse(DocumentoFluxo documento) {
        return DocumentoFluxoResponse.builder()
                .id(documento.getId())
                .nome(documento.getNome())
                .arquivo(documento.getArquivo())
                .obrigatorio(documento.getObrigatorio())
                .categoria(documento.getCategoria())
                .conteudo(documento.getConteudo())
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
                .observacao(historico.getObservacao())
                .build();
    }

    private GerenteUnidadeResponse toGerenteResponse(GerenteUnidadeFluxo gerente) {
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
}
