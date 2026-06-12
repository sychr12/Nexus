package com.sicpr.backend.user.repository;

import com.sicpr.backend.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByUsername(String username);

    long countByStatus(String status);

    long countByUltimoLoginAfter(LocalDateTime dataHora);

    List<User> findTop5ByUltimoLoginIsNotNullOrderByUltimoLoginDesc();
    
    // Métodos removidos porque os campos não existem no User
    // boolean existsByUsername(String username);
    // void incrementarTentativasFalhas(...)
}
