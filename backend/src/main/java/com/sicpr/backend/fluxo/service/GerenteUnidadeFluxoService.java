package com.sicpr.backend.fluxo.service;

import com.sicpr.backend.fluxo.dto.GerenteUnidadeRequest;
import com.sicpr.backend.fluxo.dto.GerenteUnidadeResponse;
import com.sicpr.backend.fluxo.mapper.ProcessoFluxoMapper;
import com.sicpr.backend.fluxo.model.GerenteUnidadeFluxo;
import com.sicpr.backend.fluxo.repository.GerenteUnidadeFluxoRepository;
import com.sicpr.backend.security.CurrentUserService;
import com.sicpr.backend.user.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GerenteUnidadeFluxoService {

    private final GerenteUnidadeFluxoRepository gerenteRepository;
    private final FluxoAccessPolicy accessPolicy;
    private final ProcessoFluxoMapper processoMapper;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public List<GerenteUnidadeResponse> listarGerentes() {
        User user = currentUserService.requireUser();
        List<GerenteUnidadeFluxo> gerentes = accessPolicy.isAdmin(user)
                ? gerenteRepository.findAllByOrderByUnidadeLocalAscNomeAsc()
                : gerenteRepository.findByUnidadeLocalIgnoreCaseOrderByNomeAsc(accessPolicy.requireScopedUnidadeLocal(user));
        return gerentes.stream().map(processoMapper::toGerenteResponse).toList();
    }

    @Transactional
    public GerenteUnidadeResponse salvarGerente(GerenteUnidadeRequest request) {
        GerenteUnidadeFluxo gerente = GerenteUnidadeFluxo.builder()
                .nome(requireText(request.getNome(), "Nome obrigatorio."))
                .unidadeLocal(requireText(request.getUnidadeLocal(), "Unidade obrigatoria."))
                .cargo(requireText(request.getCargo(), "Cargo obrigatorio."))
                .telefoneCorporativo(request.getTelefoneCorporativo())
                .telefonePessoal(request.getTelefonePessoal())
                .status(normalizeStatus(request.getStatus()))
                .build();
        return processoMapper.toGerenteResponse(gerenteRepository.save(gerente));
    }

    @Transactional
    public GerenteUnidadeResponse atualizarGerente(String id, GerenteUnidadeRequest request) {
        GerenteUnidadeFluxo gerente = findGerente(id);
        gerente.setNome(requireText(request.getNome(), "Nome obrigatorio."));
        gerente.setUnidadeLocal(requireText(request.getUnidadeLocal(), "Unidade obrigatoria."));
        gerente.setCargo(requireText(request.getCargo(), "Cargo obrigatorio."));
        gerente.setTelefoneCorporativo(request.getTelefoneCorporativo());
        gerente.setTelefonePessoal(request.getTelefonePessoal());
        gerente.setStatus(normalizeStatus(request.getStatus()));
        if (!"inativo".equals(gerente.getStatus())) {
            gerente.setEncerradoEm(null);
        } else if (gerente.getEncerradoEm() == null) {
            gerente.setEncerradoEm(LocalDateTime.now());
        }
        return processoMapper.toGerenteResponse(gerenteRepository.save(gerente));
    }

    @Transactional
    public GerenteUnidadeResponse inativarGerente(String id) {
        GerenteUnidadeFluxo gerente = findGerente(id);
        gerente.setStatus("inativo");
        gerente.setEncerradoEm(LocalDateTime.now());
        return processoMapper.toGerenteResponse(gerenteRepository.save(gerente));
    }

    @Transactional(readOnly = true)
    public GerenteUnidadeFluxo resolveGerente(String gerenteId, String unidadeLocal, String usuario) {
        if (gerenteId != null && !gerenteId.isBlank()) {
            GerenteUnidadeFluxo gerente = findGerente(gerenteId);
            if (!accessPolicy.sameUnidadeLocal(unidadeLocal, gerente.getUnidadeLocal())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Gerente selecionado nao pertence a unidade local do lote.");
            }
            return gerente;
        }
        return gerenteRepository.findByUnidadeLocalIgnoreCaseAndStatusInOrderByNomeAsc(unidadeLocal, List.of("ativo", "respondendo"))
                .stream()
                .findFirst()
                .orElseGet(() -> GerenteUnidadeFluxo.builder()
                        .nome(usuario)
                        .unidadeLocal(unidadeLocal)
                        .cargo("Gerente da Unidade Local")
                        .status("ativo")
                        .build());
    }

    private GerenteUnidadeFluxo findGerente(String id) {
        return gerenteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gerente nao encontrado."));
    }

    private String normalizeStatus(String status) {
        return status == null || status.isBlank() ? "ativo" : status;
    }

    private String requireText(String value, String message) {
        if (value == null || value.trim().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return value.trim();
    }
}
