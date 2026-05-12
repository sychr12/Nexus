package com.sicpr.backend.inscricao.service;

import com.sicpr.backend.inscricao.dto.InscricaoRequest;
import com.sicpr.backend.inscricao.dto.InscricaoResponse;
import com.sicpr.backend.inscricao.model.Inscricao;
import com.sicpr.backend.inscricao.repository.InscricaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InscricaoService {

    private final InscricaoRepository repository;

    private String criptografar(String valor) {

        if (valor == null || valor.isBlank()) {
            return "";
        }

        return Base64.getEncoder()
                .encodeToString(
                        valor.getBytes(StandardCharsets.UTF_8)
                );
    }

    private String descriptografar(String valor) {

        if (valor == null || valor.isBlank()) {
            return "";
        }

        try {

            return new String(
                    Base64.getDecoder().decode(valor),
                    StandardCharsets.UTF_8
            );

        } catch (Exception e) {

            return valor;
        }
    }

    public InscricaoResponse salvar(
            InscricaoRequest request
    ) {

        Inscricao inscricao = Inscricao.builder()
                .nome(
                        criptografar(
                                request.getNome()
                        )
                )
                .cpf(
                        criptografar(
                                request.getCpf()
                        )
                )
                .municipio(
                        request.getMunicipio()
                )
                .memorando(
                        criptografar(
                                request.getMemorando()
                        )
                )
                .tipo(
                        request.getTipo()
                )
                .build();

        Inscricao salvo =
                repository.save(inscricao);

        return converterWeb(salvo);
    }

    // API SEGURA
    public List<InscricaoResponse> listarPublico() {

        return repository.findAll()
                .stream()
                .map(this::converterPublico)
                .toList();
    }

    // WEB ADMIN
    public List<InscricaoResponse> listarWeb() {

        return repository.findAll()
                .stream()
                .map(this::converterWeb)
                .toList();
    }

    private InscricaoResponse converterPublico(
            Inscricao inscricao
    ) {

        return InscricaoResponse.builder()
                .id(
                        inscricao.getId()
                )
                .nome(
                        "PROTEGIDO"
                )
                .cpf(
                        "PROTEGIDO"
                )
                .municipio(
                        inscricao.getMunicipio()
                )
                .memorando(
                        "PROTEGIDO"
                )
                .tipo(
                        inscricao.getTipo()
                )
                .criadoEm(
                        inscricao.getCriadoEm()
                )
                .build();
    }

    private InscricaoResponse converterWeb(
            Inscricao inscricao
    ) {

        return InscricaoResponse.builder()
                .id(
                        inscricao.getId()
                )
                .nome(
                        descriptografar(
                                inscricao.getNome()
                        )
                )
                .cpf(
                        descriptografar(
                                inscricao.getCpf()
                        )
                )
                .municipio(
                        inscricao.getMunicipio()
                )
                .memorando(
                        descriptografar(
                                inscricao.getMemorando()
                        )
                )
                .tipo(
                        inscricao.getTipo()
                )
                .criadoEm(
                        inscricao.getCriadoEm()
                )
                .build();
    }
}
