package com.sicpr.backend.inscricao.repository;

import com.sicpr.backend.inscricao.model.Inscricao;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InscricaoRepository extends JpaRepository<Inscricao, Long> {
    
}
