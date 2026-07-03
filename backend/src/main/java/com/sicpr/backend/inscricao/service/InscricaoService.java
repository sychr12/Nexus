package com.sicpr.backend.inscricao.service;

import com.sicpr.backend.inscricao.dto.InscricaoRequest;
import com.sicpr.backend.inscricao.dto.InscricaoResponse;
import com.sicpr.backend.inscricao.model.Inscricao;
import com.sicpr.backend.inscricao.repository.InscricaoRepository;
import com.sicpr.backend.inscricao.validation.DmsCoordinateValidator;
import com.sicpr.backend.security.CurrentUserService;
import com.sicpr.backend.security.CryptoService;
import com.sicpr.backend.security.RoleUtils;
import com.sicpr.backend.security.SearchHashService;
import com.sicpr.backend.user.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InscricaoService {

    private static final int DEFAULT_LIST_LIMIT = 500;

    private final InscricaoRepository repository;
    private final CryptoService cryptoService;
    private final SearchHashService searchHashService;
    private final CurrentUserService currentUserService;

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
                .cpfHash(
                        searchHashService.cpfHash(
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

        return repository.findAllByOrderByCriadoEmDesc(PageRequest.of(0, DEFAULT_LIST_LIMIT))
                .getContent()
                .stream()
                .map(this::converterPublico)
                .toList();
    }

    // WEB ADMIN
    public List<InscricaoResponse> listarWeb() {
        User user = currentUserService.requireUser();
        List<Inscricao> inscricoes = "ADMIN".equals(RoleUtils.normalizeRole(user.getPerfil()))
                ? repository.findAllByOrderByCriadoEmDesc(PageRequest.of(0, DEFAULT_LIST_LIMIT)).getContent()
                : repository.findByMunicipioIgnoreCaseOrderByCriadoEmDesc(requireUnidadeLocal(user), PageRequest.of(0, DEFAULT_LIST_LIMIT)).getContent();

        return inscricoes.stream()
                .map(this::converterWeb)
                .toList();
    }

    private String requireUnidadeLocal(User user) {
        if (user.getUnidadeLocal() == null || user.getUnidadeLocal().trim().isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Usuario sem unidade local vinculada.");
        }
        return user.getUnidadeLocal().trim();
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
