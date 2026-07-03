package com.sicpr.backend.fluxo.repository;

import com.sicpr.backend.fluxo.model.ProcessoFluxo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface ProcessoFluxoRepository extends JpaRepository<ProcessoFluxo, String>, JpaSpecificationExecutor<ProcessoFluxo> {

    List<ProcessoFluxo> findAllByOrderByCriadoEmDesc();

    List<ProcessoFluxo> findByMemorandoLoteIdIsNotNullOrderByMemorandoCriadoEmDesc();

    List<ProcessoFluxo> findByMemorandoLoteIdIsNotNullAndUnidadeLocalIgnoreCaseOrderByMemorandoCriadoEmDesc(String unidadeLocal);

    List<ProcessoFluxo> findBySituacaoOrderByCriadoEmDesc(String situacao);

    List<ProcessoFluxo> findBySituacaoAndUnidadeLocalIgnoreCaseOrderByCriadoEmDesc(String situacao, String unidadeLocal);

    List<ProcessoFluxo> findBySituacaoInOrderByCriadoEmDesc(Collection<String> situacoes);

    List<ProcessoFluxo> findBySituacaoInAndUnidadeLocalIgnoreCaseOrderByCriadoEmDesc(Collection<String> situacoes, String unidadeLocal);

    List<ProcessoFluxo> findByUnidadeLocalIgnoreCaseOrderByCriadoEmDesc(String unidadeLocal);

    long countByMemorandoNumeroEndingWith(String sufixo);

    long countBySituacao(String situacao);

    long countBySituacaoAndUnidadeLocalIgnoreCase(String situacao, String unidadeLocal);

    long countBySituacaoIn(Collection<String> situacoes);

    long countBySituacaoInAndUnidadeLocalIgnoreCase(Collection<String> situacoes, String unidadeLocal);

    long countByCriadoEmBetween(LocalDateTime inicio, LocalDateTime fim);

    long countByCriadoEmBetweenAndUnidadeLocalIgnoreCase(LocalDateTime inicio, LocalDateTime fim, String unidadeLocal);

    long countByUnidadeLocalIgnoreCase(String unidadeLocal);

    List<ProcessoFluxo> findTop8ByOrderByAtualizadoEmDesc();

    List<ProcessoFluxo> findTop8ByUnidadeLocalIgnoreCaseOrderByAtualizadoEmDesc(String unidadeLocal);

    List<ProcessoFluxo> findTop100ByOrderByAtualizadoEmDesc();

    List<ProcessoFluxo> findTop100ByUnidadeLocalIgnoreCaseOrderByAtualizadoEmDesc(String unidadeLocal);
}
