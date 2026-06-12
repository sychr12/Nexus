package com.sicpr.backend.inscricao.repository;

import com.sicpr.backend.inscricao.model.Inscricao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface InscricaoRepository extends JpaRepository<Inscricao, Long> {

    long countByCriadoEmBetween(LocalDateTime inicio, LocalDateTime fim);

    List<Inscricao> findTop5ByOrderByCriadoEmDesc();
}
