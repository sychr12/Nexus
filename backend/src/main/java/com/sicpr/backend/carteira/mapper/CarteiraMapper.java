// mapper/CarteiraMapper.java
package com.sicpr.backend.carteira.mapper;

import com.sicpr.backend.carteira.dto.CarteiraResponseDTO;
import com.sicpr.backend.carteira.model.Carteira;
import com.sicpr.backend.carteira.model.Foto;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.stream.Collectors;

@Component
public class CarteiraMapper {
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    
    public CarteiraResponseDTO toResponseDTO(Carteira carteira) {
        if (carteira == null) return null;
        
        CarteiraResponseDTO dto = new CarteiraResponseDTO();
        dto.setId(carteira.getId());
        dto.setRegistro(carteira.getRegistro());
        dto.setCpf(carteira.getCpf());
        dto.setNome(carteira.getNome());
        dto.setPropriedade(carteira.getPropriedade());
        dto.setUnloc(carteira.getUnloc());
        
        // Converter LocalDateTime para String
        if (carteira.getInicioAtividade() != null) {
            dto.setInicio(carteira.getInicioAtividade().format(DATE_FORMATTER));
        }
        if (carteira.getValidade() != null) {
            dto.setValidade(carteira.getValidade().format(DATE_FORMATTER));
        }
        
        dto.setEndereco(carteira.getEndereco());
        dto.setAtividade1(carteira.getAtividadePrimaria());
        dto.setAtividade2(carteira.getAtividadeSecundaria());
        dto.setGeoref(carteira.getGeoreferenciamento());
        dto.setUsuario(carteira.getUsuario());
        dto.setCreatedAt(carteira.getCreatedAt());
        
        if (carteira.getFotos() != null && !carteira.getFotos().isEmpty()) {
            dto.setFotosBase64(carteira.getFotos().stream()
                .map(Foto::getConteudo)
                .filter(bytes -> bytes != null && bytes.length > 0)
                .map(Base64.getEncoder()::encodeToString)
                .collect(Collectors.toList()));
        }
        
        return dto;
    }
}