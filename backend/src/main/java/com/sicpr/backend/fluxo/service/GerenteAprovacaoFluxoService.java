package com.sicpr.backend.fluxo.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sicpr.backend.fluxo.dto.AprovarLoteRequest;
import com.sicpr.backend.fluxo.dto.ProcessoFluxoResponse;
import com.sicpr.backend.fluxo.mapper.ProcessoFluxoMapper;
import com.sicpr.backend.fluxo.model.GerenteUnidadeFluxo;
import com.sicpr.backend.fluxo.model.HistoricoFluxo;
import com.sicpr.backend.fluxo.model.ProcessoFluxo;
import com.sicpr.backend.fluxo.repository.ProcessoFluxoRepository;
import com.sicpr.backend.security.CryptoService;
import com.sicpr.backend.security.CurrentUserService;
import com.sicpr.backend.user.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class GerenteAprovacaoFluxoService {

    private final ProcessoFluxoRepository processoRepository;
    private final FluxoAccessPolicy accessPolicy;
    private final MemorandoFluxoService memorandoFluxoService;
    private final GerenteUnidadeFluxoService gerenteService;
    private final ProcessoFluxoMapper processoMapper;
    private final ObjectMapper objectMapper;
    private final CryptoService cryptoService;
    private final CurrentUserService currentUserService;

    @Transactional
    public List<ProcessoFluxoResponse> aprovarLote(AprovarLoteRequest request, String usuario) {
        if (request.getIds() == null || request.getIds().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecione ao menos um processo.");
        }

        List<ProcessoFluxo> processos = processoRepository.findAllById(request.getIds());
        if (processos.size() != request.getIds().size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Um ou mais processos não foram encontrados.");
        }

        validarUnidadeUnica(processos);

        User user = currentUserService.requireUser();
        processos.forEach(processo -> accessPolicy.requireAccessToProcesso(user, processo));
        processos.forEach(processo -> requireSituacao(processo, Set.of("encaminhado_gerente"), "Todos os processos devem estar encaminhados ao gerente."));

        GerenteUnidadeFluxo gerente = gerenteService.resolveGerente(request.getGerenteId(), processos.get(0).getUnidadeLocal(), usuario);
        MemorandoFluxoService.MemorandoLote lote = memorandoFluxoService.gerarLote(gerente, processos);

        processos.forEach(processo -> aplicarAprovacao(processo, gerente, lote, processos.size()));

        return processoRepository.saveAll(processos).stream().map(processoMapper::toResponse).toList();
    }

    private void validarUnidadeUnica(List<ProcessoFluxo> processos) {
        long unidades = processos.stream()
                .map(ProcessoFluxo::getUnidadeLocal)
                .map(accessPolicy::normalizeUnidadeLocal)
                .distinct()
                .count();
        if (unidades != 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Todos os processos do lote devem ser da mesma unidade local.");
        }
    }

    private void aplicarAprovacao(
            ProcessoFluxo processo,
            GerenteUnidadeFluxo gerente,
            MemorandoFluxoService.MemorandoLote lote,
            int quantidadeProcessos
    ) {
        processo.setSituacao("em_analise");
        processo.setGerenteResponsavel(gerente.getNome());
        processo.setGerenteAssinadoEm(lote.criadoEm());
        processo.setAssinaturaEletronicaJson(toJsonObject(lote.assinatura()));
        processo.setMemorandoNumero(lote.numero());
        processo.setMemorandoLoteId(lote.loteId());
        processo.setMemorandoArquivo(lote.arquivo());
        processo.setMemorandoCriadoEm(lote.criadoEm());
        processo.setMemorandoQuantidade(quantidadeProcessos);
        processo.setMemorandoProdutoresJson(toJsonObject(lote.produtores()));
        processo.setMemorandosJson(toJsonObject(List.of(lote.memorando())));
        processo.setEnviadoAnaliseEm(lote.criadoEm());
        processo.setUltimaJustificativa(null);

        addHistorico(processo, gerente.getNome(), "Aprovado e assinado pelo gerente", "Memorando " + lote.numero());
        addHistorico(processo, "Sistema", "Memorando de lote gerado", lote.numero() + " com " + quantidadeProcessos + " processo(s)");
        addHistorico(processo, "Sistema", "Codigo de validacao gerado", lote.codigoValidacao());
        addHistorico(processo, gerente.getNome(), "Encaminhado para análise", processo.getUnidadeLocal());
    }

    private void requireSituacao(ProcessoFluxo processo, Set<String> allowed, String message) {
        if (!allowed.contains(processo.getSituacao())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, message);
        }
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
