// model/Foto.java
package com.sicpr.backend.carteira.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "carteira_fotos")
@Data
public class Foto {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "carteira_id")
    private Carteira carteira;
    
    private Integer ordem; // 1, 2, 3
    
    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] conteudo;
    
    private String nomeArquivo;
    private String contentType;
}