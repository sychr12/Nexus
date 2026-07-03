package com.sicpr.backend.fluxo.repository;

import com.sicpr.backend.fluxo.model.GerenteUnidadeFluxo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GerenteUnidadeFluxoRepository extends JpaRepository<GerenteUnidadeFluxo, String> {

    List<GerenteUnidadeFluxo> findAllByOrderByUnidadeLocalAscNomeAsc();

    List<GerenteUnidadeFluxo> findByUnidadeLocalIgnoreCaseOrderByNomeAsc(String unidadeLocal);

    List<GerenteUnidadeFluxo> findByUnidadeLocalIgnoreCaseAndStatusInOrderByNomeAsc(String unidadeLocal, List<String> status);
}
