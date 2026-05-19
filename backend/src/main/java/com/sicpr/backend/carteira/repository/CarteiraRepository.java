// repository/CarteiraRepository.java
package com.sicpr.backend.carteira.repository;

import com.sicpr.backend.carteira.model.CarteiraDigital;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CarteiraRepository extends JpaRepository<CarteiraDigital, Long> {
    
    Optional<CarteiraDigital> findByCpf(String cpf);
    
    // Consulta SIMPLES - sem parâmetros complexos
    @Query("SELECT c FROM CarteiraDigital c ORDER BY c.criadoEm DESC")
    Page<CarteiraDigital> findAllOrderByCriadoEmDesc(Pageable pageable);
    
    // Busca por termo - simplificada
    @Query("SELECT c FROM CarteiraDigital c WHERE " +
           "LOWER(c.nome) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
           "LOWER(c.cpf) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
           "LOWER(c.registro) LIKE LOWER(CONCAT('%', :termo, '%'))")
    Page<CarteiraDigital> buscarPorTermo(@Param("termo") String termo, Pageable pageable);
    
    @Query("SELECT DISTINCT c.usuario FROM CarteiraDigital c WHERE c.usuario IS NOT NULL AND c.usuario != ''")
    List<String> findUsuariosUnicos();
}