package com.sicpr.backend.analise.repository;

import com.sicpr.backend.analise.model.Analise;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AnaliseRepository extends JpaRepository<Analise, Long> {

    List<Analise> findByStatusOrderByRecebidoEmDesc(String status);

    List<Analise> findAllByOrderByRecebidoEmDesc();

    List<Analise> findByLocalidadeContainingIgnoreCase(String localidade);

    List<Analise> findByNumeroContainingIgnoreCase(String numero);
    
}