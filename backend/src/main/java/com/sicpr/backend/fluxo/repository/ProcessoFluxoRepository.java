package com.sicpr.backend.fluxo.repository;

import com.sicpr.backend.fluxo.model.ProcessoFluxo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface ProcessoFluxoRepository extends JpaRepository<ProcessoFluxo, String> {

    List<ProcessoFluxo> findAllByOrderByCriadoEmDesc();

    List<ProcessoFluxo> findBySituacaoOrderByCriadoEmDesc(String situacao);

    List<ProcessoFluxo> findBySituacaoInOrderByCriadoEmDesc(Collection<String> situacoes);

    List<ProcessoFluxo> findByUnidadeLocalIgnoreCaseOrderByCriadoEmDesc(String unidadeLocal);

    long countByMemorandoNumeroEndingWith(String sufixo);

    long countBySituacao(String situacao);

    long countBySituacaoIn(Collection<String> situacoes);

    long countByCriadoEmBetween(LocalDateTime inicio, LocalDateTime fim);

    List<ProcessoFluxo> findTop8ByOrderByAtualizadoEmDesc();
}
