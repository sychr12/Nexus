package com.sicpr.backend.user.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;
    
    private String nomeCompleto;
    
    private String telefone;
    
    private Integer tentativasFalhas;
    
    private LocalDateTime bloqueadoAte;
    
    private LocalDateTime ultimoLogin;
    
    private String status;
    
    private String perfil;
    
    private LocalDateTime criadoEm;
    
    private LocalDateTime atualizadoEm;
    
    private LocalDateTime senhaAlteradaEm;

    @PrePersist
    protected void onCreate() {
        criadoEm = LocalDateTime.now();
        atualizadoEm = LocalDateTime.now();
        if (tentativasFalhas == null) tentativasFalhas = 0;
        if (status == null) status = "ATIVO";
        if (perfil == null) perfil = "USUARIO";
    }

    @PreUpdate
    protected void onUpdate() {
        atualizadoEm = LocalDateTime.now();
    }
}
