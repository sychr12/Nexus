// backend/src/main/java/com/sicpr/backend/email/repository/EmailAnexoRepository.java
package com.sicpr.backend.email.repository;

import com.sicpr.backend.email.model.EmailAnexo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmailAnexoRepository extends JpaRepository<EmailAnexo, Long> {
    
    Optional<EmailAnexo> findByEmailId(String emailId);
    
    Page<EmailAnexo> findAllByOrderByCriadoEmDesc(Pageable pageable);
    
    Page<EmailAnexo> findByRemetenteContainingIgnoreCaseOrAssuntoContainingIgnoreCase(
        String remetente, String assunto, Pageable pageable);
    
    Page<EmailAnexo> findByMunicipio(String municipio, Pageable pageable);
    
    @Query("SELECT e.municipio, COUNT(e) FROM EmailAnexo e GROUP BY e.municipio")
    List<Object[]> countPorMunicipio();
}