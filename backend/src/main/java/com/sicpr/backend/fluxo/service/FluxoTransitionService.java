package com.sicpr.backend.fluxo.service;

import com.sicpr.backend.fluxo.dto.ProcessoFluxoResponse;
import com.sicpr.backend.fluxo.mapper.ProcessoFluxoMapper;
import com.sicpr.backend.fluxo.model.HistoricoFluxo;
import com.sicpr.backend.fluxo.model.ProcessoFluxo;
import com.sicpr.backend.fluxo.repository.ProcessoFluxoRepository;
import com.sicpr.backend.security.CryptoService;
import com.sicpr.backend.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class FluxoTransitionService {

    private static final Set<String> STATUS_EDITAVEIS_UNLOC = Set.of("em_elaboracao", "devolvido_gerente", "devolvido_analise");

    private final ProcessoFluxoRepository processoRepository;
    private final FluxoAccessPolicy accessPolicy;
    private final InscricaoPublisherService inscricaoPublisher;
    private final ProcessoFluxoMapper processoMapper;
    private final CryptoService cryptoService;
    private final CurrentUserService currentUserService;

    @Transactional
    public ProcessoFluxoResponse encaminharGerente(String id, String usuario) {
        ProcessoFluxo processo = findProcesso(id);
        accessPolicy.requireAccessToProcesso(currentUserService.requireUser(), processo);
        requireSituacao(processo, STATUS_EDITAVEIS_UNLOC, "Somente processos em elaboração/devolução podem ser encaminhados.");
        if (!"assinada_anexada".equals(processo.getFacStatus())) {
            String motivo = "A FAC assinada pelo produtor ainda não foi anexada ao processo.";
            processo.setUltimaJustificativa(encryptNullable(motivo));
            addHistorico(processo, "Sistema", "Encaminhamento bloqueado", "FAC assinada pelo produtor obrigatória");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, motivo);
        }
        processo.setSituacao("encaminhado_gerente");
        processo.setEncaminhadoGerenteEm(LocalDateTime.now());
        processo.setUltimaJustificativa(null);
        addHistorico(processo, usuario, "Encaminhado ao gerente", processo.getUnidadeLocal());
        return processoMapper.toResponse(processoRepository.save(processo));
    }

    @Transactional
    public ProcessoFluxoResponse devolverPeloGerente(String id, String justificativa, String usuario) {
        ProcessoFluxo processo = findProcesso(id);
        accessPolicy.requireAccessToProcesso(currentUserService.requireUser(), processo);
        requireSituacao(processo, Set.of("encaminhado_gerente"), "Processo não está aguardando decisão do gerente.");
        processo.setSituacao("devolvido_gerente");
        processo.setGerenteResponsavel(usuario);
        String motivo = requireText(justificativa, "Justificativa obrigatória.");
        processo.setUltimaJustificativa(encryptNullable(motivo));
        addHistorico(processo, usuario, "Devolvido pelo gerente", motivo);
        return processoMapper.toResponse(processoRepository.save(processo));
    }

    @Transactional
    public ProcessoFluxoResponse aprovarAnalise(String id, String usuario) {
        ProcessoFluxo processo = findProcesso(id);
        accessPolicy.requireAccessToProcesso(currentUserService.requireUser(), processo);
        requireSituacao(processo, Set.of("em_analise"), "Processo não está em análise.");
        processo.setSituacao("aprovado_lancamento");
        processo.setAnalistaResponsavel(usuario);
        processo.setAnalisadoEm(LocalDateTime.now());
        processo.setUltimaJustificativa(null);
        addHistorico(processo, usuario, "Aprovado pela análise e encaminhado para lançamento", "Processo aguardando lançamento.");
        return processoMapper.toResponse(processoRepository.save(processo));
    }

    @Transactional
    public ProcessoFluxoResponse devolverAnalise(String id, String justificativa, String usuario) {
        ProcessoFluxo processo = findProcesso(id);
        accessPolicy.requireAccessToProcesso(currentUserService.requireUser(), processo);
        requireSituacao(processo, Set.of("em_analise"), "Processo não está em análise.");
        processo.setSituacao("devolvido_analise");
        processo.setAnalistaResponsavel(usuario);
        processo.setAnalisadoEm(LocalDateTime.now());
        String motivo = requireText(justificativa, "Justificativa obrigatória.");
        processo.setUltimaJustificativa(encryptNullable(motivo));
        addHistorico(processo, usuario, "Devolvido pela análise", motivo);
        return processoMapper.toResponse(processoRepository.save(processo));
    }

    @Transactional
    public ProcessoFluxoResponse concluirLancamento(String id, String usuario) {
        ProcessoFluxo processo = findProcesso(id);
        accessPolicy.requireAccessToProcesso(currentUserService.requireUser(), processo);
        requireSituacao(processo, Set.of("aprovado_lancamento"), "Processo não está aprovado para lançamento.");
        processo.setSituacao("concluido");
        processo.setLancadoPor(usuario);
        processo.setLancadoEm(LocalDateTime.now());
        inscricaoPublisher.publishConcludedProcesso(processo);
        addHistorico(processo, usuario, "Lançamento concluído", "Carteira/processo finalizado");
        return processoMapper.toResponse(processoRepository.save(processo));
    }

    @Transactional
    public ProcessoFluxoResponse devolverLancamento(String id, String justificativa, String usuario) {
        ProcessoFluxo processo = findProcesso(id);
        accessPolicy.requireAccessToProcesso(currentUserService.requireUser(), processo);
        requireSituacao(processo, Set.of("aprovado_lancamento"), "Processo não está aprovado para lançamento.");
        processo.setSituacao("em_analise");
        processo.setAnalistaResponsavel(null);
        processo.setAnalisadoEm(null);
        String motivo = requireText(justificativa, "Justificativa obrigatória.");
        processo.setUltimaJustificativa(encryptNullable(motivo));
        addHistorico(processo, usuario, "Devolvido pelo lançamento para análise", motivo);
        addHistorico(processo, "Sistema", "Processo retornou para análise", "Devolução registrada na etapa de lançamentos.");
        return processoMapper.toResponse(processoRepository.save(processo));
    }

    private ProcessoFluxo findProcesso(String id) {
        return processoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Processo não encontrado."));
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

    private void addHistorico(ProcessoFluxo processo, String usuario, String acao, String observacao) {
        processo.getHistorico().add(HistoricoFluxo.builder()
                .processo(processo)
                .usuario(usuario == null || usuario.isBlank() ? "Sistema" : usuario)
                .acao(acao)
                .observacao(encryptNullable(observacao))
                .dataHora(LocalDateTime.now())
                .build());
    }

    private String encryptNullable(String value) {
        return value == null || value.isBlank() ? null : cryptoService.encrypt(value);
    }
}
