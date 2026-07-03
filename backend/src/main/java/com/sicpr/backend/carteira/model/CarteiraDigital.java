// model/CarteiraDigital.java
package com.sicpr.backend.carteira.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "carteiras_digitais")
@Data
public class CarteiraDigital {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(length = 50)
    private String registro;
    
    @Column(nullable = false, length = 512)
    private String cpf;

    @Column(name = "cpf_hash", length = 64)
    private String cpfHash;
    
    @Column(nullable = false, length = 200)
    private String nome;
    
    @Column(length = 255)
    private String propriedade;
    
    @Column(length = 20)
    private String unloc;
    
    @Column(length = 10)
    private String inicio;
    
    @Column(length = 10)
    private String validade;
    
    @Column(length = 500)
    private String endereco;
    
    @Column(columnDefinition = "TEXT")
    private String atividade1;
    
    @Column(columnDefinition = "TEXT")
    private String atividade2;
    
    @Column(columnDefinition = "TEXT")
    private String georef;
    
    @Column(columnDefinition = "bytea")
    private byte[] pdfConteudo;
    
    @Column(columnDefinition = "bytea")
    private byte[] foto1;
    
    @Column(columnDefinition = "bytea")
    private byte[] foto2;
    
    @Column(columnDefinition = "bytea")
    private byte[] foto3;
    
    @Column(length = 100)
    private String usuario;
    
    @CreationTimestamp
    @Column(name = "criado_em")
    private LocalDateTime criadoEm;
    
    @UpdateTimestamp
    @Column(name = "atualizado_em")
    private LocalDateTime atualizadoEm;
}
