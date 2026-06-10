package com.sicpr.backend.inscricao.service;

import com.sicpr.backend.inscricao.dto.InscricaoRequest;
import com.sicpr.backend.inscricao.dto.InscricaoResponse;
import com.sicpr.backend.inscricao.model.Inscricao;
import com.sicpr.backend.inscricao.repository.InscricaoRepository;
import com.sicpr.backend.inscricao.validation.DmsCoordinateValidator;
import com.sicpr.backend.security.CryptoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InscricaoService {

    private final InscricaoRepository repository;
    private final CryptoService cryptoService;

    private String criptografar(String valor) {
        return cryptoService.encrypt(valor);
    }

    private String descriptografar(String valor) {
        return cryptoService.decrypt(valor);
    }

    public InscricaoResponse salvar(
            InscricaoRequest request
    ) {

        String latitude =
                DmsCoordinateValidator.normalizarLatitude(
                        request.getLatitude()
                );

        String longitude =
                DmsCoordinateValidator.normalizarLongitude(
                        request.getLongitude()
                );

        validarCoordenadas(latitude, longitude);

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
                .latitude(
                        criptografar(
                                latitude
                        )
                )
                .longitude(
                        criptografar(
                                longitude
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
                        "*****"
                )
                .cpf(
                        "*****"
                )
                .municipio(
                        inscricao.getMunicipio()
                )
                .memorando(
                        "*****"
                )
                .latitude(
                        "*****"
                )
                .longitude(
                        "*****"
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
                .latitude(
                        descriptografar(
                                inscricao.getLatitude()
                        )
                )
                .longitude(
                        descriptografar(
                                inscricao.getLongitude()
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

    private void validarCoordenadas(
            String latitude,
            String longitude
    ) {

        String latitudeErro =
                DmsCoordinateValidator.validarLatitude(
                        latitude
                );

        if (!latitudeErro.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    latitudeErro
            );
        }

        String longitudeErro =
                DmsCoordinateValidator.validarLongitude(
                        longitude
                );

        if (!longitudeErro.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    longitudeErro
            );
        }
    }
}
