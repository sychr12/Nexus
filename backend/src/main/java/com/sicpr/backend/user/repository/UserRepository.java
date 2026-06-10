package com.sicpr.backend.user.repository;

import com.sicpr.backend.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByUsername(String username);
    
    // Métodos removidos porque os campos não existem no User
    // boolean existsByUsername(String username);
    // void incrementarTentativasFalhas(...)
}
