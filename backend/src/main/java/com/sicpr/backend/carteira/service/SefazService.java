// service/SefazService.java
package com.sicpr.backend.carteira.service;

import com.sicpr.backend.carteira.dto.SefazDadosDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class SefazService {
    
    private static final Pattern CPF_PATTERN = Pattern.compile("\\d{11}");
    
    private static final Map<String, String> UNLOC_MAP = Map.ofEntries(
        Map.entry("BAE", "BAR"),
        Map.entry("MTS-ATZ", "ATZ-MTS"),
        Map.entry("MTS", "ATZ-MTS"),
        Map.entry("NRO-ITR", "ITR-NRO"),
        Map.entry("NRO", "ITR-NRO"),
        Map.entry("MTP-MNX", "MNX-MTP"),
        Map.entry("MTP", "MNX-MTP"),
        Map.entry("VE-LBR", "LBR-VE"),
        Map.entry("VE", "LBR-VE"),
        Map.entry("VRC-MPU", "MPU-VRC"),
        Map.entry("VRC", "MPU-VRC"),
        Map.entry("BNA-PRF", "PRF-BNA"),
        Map.entry("BNA", "PRF-BNA"),
        Map.entry("VDL-ITR", "ITR-VDL"),
        Map.entry("VDL", "ITR-VDL"),
        Map.entry("RLD-HIA", "HIA-RLD"),
        Map.entry("RLD", "HIA-RLD"),
        Map.entry("CAN-SUL", "SUL-CAN"),
        Map.entry("ZL-MAO", "MAO-ZL"),
        Map.entry("ZL", "MAO-ZL")
    );
    
    public SefazDadosDTO consultarPorCpf(String cpf) {
        String cpfLimpo = cpf.replaceAll("\\D", "");
        if (!CPF_PATTERN.matcher(cpfLimpo).matches()) {
            throw new IllegalArgumentException("CPF inválido para consulta SEFAZ");
        }
        
        log.info("Consultando SEFAZ para CPF: {}", mascararCpf(cpfLimpo));
        
        // TODO: Implementar integração real com SEFAZ quando disponível
        return simularConsultaSefaz(cpfLimpo);
    }
    
    private SefazDadosDTO simularConsultaSefaz(String cpf) {
        SefazDadosDTO dados = new SefazDadosDTO();
        dados.setCpf(cpf);
        dados.setNome("Produtor Exemplo");
        dados.setRp("123456789");
        dados.setPropriedade("Fazenda Exemplo");
        dados.setEndereco("Rodovia BR-319, Km 100");
        dados.setUnloc("PR-MAO/12345");
        dados.setLatitude("-3.1190");
        dados.setLongitude("-60.0217");
        dados.setAtv1("Cultivo de soja");
        dados.setAtv2("Pecuária de corte");
        dados.setInicioatv("2010");
        dados.setValidade("31/12/2025");
        dados.setCnae1("0115601");
        dados.setCnae2("0151201");
        dados.setNumcontrole("CTRL-001");
        return dados;
    }

    private String mascararCpf(String cpf) {
        if (cpf == null || cpf.length() != 11) {
            return "***";
        }

        return cpf.substring(0, 3) + ".***.***-" + cpf.substring(9);
    }
    
    // Método mantido para uso futuro quando integrar com SEFAZ real
    @SuppressWarnings("unused")
    private String normalizarUnloc(String unloc) {
        return UNLOC_MAP.getOrDefault(unloc, unloc);
    }
}
