package com.sicpr.backend.inscricao.repository;

import com.sicpr.backend.inscricao.model.Inscricao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.List;

public interface InscricaoRepository extends JpaRepository<Inscricao, Long>, JpaSpecificationExecutor<Inscricao> {

    List<Inscricao> findAllByOrderByCriadoEmDesc();

    List<Inscricao> findByMunicipioIgnoreCaseOrderByCriadoEmDesc(String municipio);

    Page<Inscricao> findAllByOrderByCriadoEmDesc(Pageable pageable);

    Page<Inscricao> findByMunicipioIgnoreCaseOrderByCriadoEmDesc(String municipio, Pageable pageable);

    boolean existsByProcessoFluxoId(String processoFluxoId);

    long countByCriadoEmBetween(LocalDateTime inicio, LocalDateTime fim);

    List<Inscricao> findTop5ByOrderByCriadoEmDesc();

    List<Inscricao> findTop25ByOrderByCriadoEmDesc();
}
