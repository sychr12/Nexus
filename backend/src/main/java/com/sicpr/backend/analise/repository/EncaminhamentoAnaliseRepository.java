package com.sicpr.backend.analise.repository;

import com.sicpr.backend.analise.model.EncaminhamentoAnalise;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EncaminhamentoAnaliseRepository extends JpaRepository<EncaminhamentoAnalise, String> {

    List<EncaminhamentoAnalise> findByDestino(String destino);

    long countByDestino(String destino);

    List<EncaminhamentoAnalise> findByAnaliseId(Long analiseId);

    List<EncaminhamentoAnalise> findByProcessoId(Long processoId);

    void deleteByProcessoIdAndDestino(Long processoId, String destino);
}
