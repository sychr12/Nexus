package com.sicpr.backend.memorando.repository;

import com.sicpr.backend.memorando.entity.Memorando;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface MemorandoRepository
        extends JpaRepository<Memorando, Long> {
    @Query("""
            SELECT m FROM Memorando m
            WHERE EXTRACT(YEAR FROM m.dataEmissao) = :ano
            """)
    List<Memorando> findByAno(@Param("ano") Integer ano);

    @Query("""
            SELECT m FROM Memorando m
            WHERE EXTRACT(YEAR FROM m.dataEmissao) = :ano
              AND (
                LOWER(m.numero)    LIKE LOWER(CONCAT('%', :termo, '%'))
             OR LOWER(m.municipio) LIKE LOWER(CONCAT('%', :termo, '%'))
             OR LOWER(m.unloc)     LIKE LOWER(CONCAT('%', :termo, '%'))
              )
            """)
    List<Memorando> findByAnoAndTermo(
            @Param("ano")   Integer ano,
            @Param("termo") String  termo
    );

    List<Memorando>
    findByNumeroContainingIgnoreCaseOrMunicipioContainingIgnoreCase(
            String numero,
            String municipio
    );

    long countByCriadoEmBetween(LocalDateTime inicio, LocalDateTime fim);

    List<Memorando> findTop5ByOrderByCriadoEmDesc();
}
