// mapper/CarteiraDigitalMapper.java
package com.sicpr.backend.carteira.mapper;

import com.sicpr.backend.carteira.dto.CarteiraResponseDTO;
import com.sicpr.backend.carteira.model.CarteiraDigital;
import org.springframework.stereotype.Component;

// Remove a linha do DATE_FORMATTER se não estiver usando
// private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

@Component
public class CarteiraDigitalMapper {
    
    public CarteiraResponseDTO toResponseDTO(CarteiraDigital carteira) {
        if (carteira == null) return null;
        
        CarteiraResponseDTO dto = new CarteiraResponseDTO();
        dto.setId(carteira.getId());
        dto.setRegistro(carteira.getRegistro());
        dto.setCpf(carteira.getCpf());
        dto.setNome(carteira.getNome());
        dto.setPropriedade(carteira.getPropriedade());
        dto.setUnloc(carteira.getUnloc());
        dto.setInicio(carteira.getInicio());
        dto.setValidade(carteira.getValidade());
        dto.setEndereco(carteira.getEndereco());
        dto.setAtividade1(carteira.getAtividade1());
        dto.setAtividade2(carteira.getAtividade2());
        dto.setGeoref(carteira.getGeoref());
        dto.setUsuario(carteira.getUsuario());
        dto.setCreatedAt(carteira.getCriadoEm());
        
        // Se precisar formatar data, use assim:
        // if (carteira.getCriadoEm() != null) {
        //     dto.setCreatedAt(carteira.getCriadoEm().format(DATE_FORMATTER));
        // }
        
        return dto;
    }
}