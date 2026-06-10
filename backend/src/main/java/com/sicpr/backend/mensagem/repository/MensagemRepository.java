package com.sicpr.backend.mensagem.repository;

import com.sicpr.backend.mensagem.model.Mensagem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface MensagemRepository extends JpaRepository<Mensagem, Long> {

    @Query("""
            select m from Mensagem m
            join fetch m.remetente
            join fetch m.destinatario
            where m.expiraEm > :agora
              and (m.remetente.id = :userId or m.destinatario.id = :userId)
            order by m.criadoEm asc
            """)
    List<Mensagem> findAtivasDoUsuario(@Param("userId") Long userId, @Param("agora") LocalDateTime agora);

    Optional<Mensagem> findByAnexoNomeArquivoAndExpiraEmAfter(String anexoNomeArquivo, LocalDateTime agora);

    List<Mensagem> findByExpiraEmLessThanEqualAndAnexoNomeArquivoIsNotNull(LocalDateTime agora);

    @Modifying
    @Query("delete from Mensagem m where m.expiraEm <= :agora")
    void deleteExpiradas(@Param("agora") LocalDateTime agora);
}
