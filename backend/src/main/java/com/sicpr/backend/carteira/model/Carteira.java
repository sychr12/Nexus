// model/Carteira.java
package com.sicpr.backend.carteira.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "carteira_digital")
@Data
public class Carteira {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false, length = 20)
    private String registro;
    
    @Column(nullable = false, length = 11)
    private String cpf;
    
    @Column(nullable = false, length = 200)
    private String nome;
    
    @Column(nullable = false, length = 255)
    private String propriedade;
    
    @Column(length = 10)
    private String unloc;
    
    private LocalDateTime inicioAtividade;
    private LocalDateTime validade;
    
    @Column(length = 500)
    private String endereco;
    
    private String atividadePrimaria;
    private String atividadeSecundaria;
    private String georeferenciamento;
    
    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] pdfConteudo;
    
    @Column(length = 100)
    private String usuario;
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "carteira", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Foto> fotos = new ArrayList<>();
}