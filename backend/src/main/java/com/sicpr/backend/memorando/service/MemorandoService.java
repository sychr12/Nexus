package com.sicpr.backend.memorando.service;

import com.sicpr.backend.memorando.dto.CreateMemorandoDTO;
import com.sicpr.backend.memorando.dto.MemorandoResponseDTO;
import com.sicpr.backend.memorando.dto.UpdateMemorandoDTO;
import com.sicpr.backend.memorando.entity.Memorando;
import com.sicpr.backend.memorando.repository.MemorandoRepository;
import com.sicpr.backend.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MemorandoService {

    private static final DateTimeFormatter BR_DATE =
            DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final MemorandoRepository repository;
    private final CurrentUserService currentUser;

    // ─── Criar ───────────────────────────────────────────────────────────────

    public MemorandoResponseDTO criar(CreateMemorandoDTO dto) {

        Memorando memorando = Memorando.builder()
                .numero(dto.numero())
                .descricao(
                        dto.descricao() != null && !dto.descricao().isBlank()
                                ? dto.descricao()
                                : "Memorando " + dto.numero()
                )
                .unloc(dto.unloc())
                .municipio(
                        dto.municipio() != null && !dto.municipio().isBlank()
                                ? dto.municipio()
                                : dto.unloc()
                )
                .memoEntrada(dto.memoEntrada())
                .dataEmissao(
                        dto.data() != null && !dto.data().isBlank()
                                ? LocalDate.parse(dto.data(), BR_DATE)
                                : LocalDate.now()
                )
                .quantidade(0)
                .usuario(currentUser.requireUsername())
                .criadoEm(LocalDateTime.now())
                .build();

        Memorando saved = repository.save(memorando);

        return toDTO(saved);
    }

    // ─── Listar ───────────────────────────────────────────────────────────────

    public List<Memorando> listar() {
        return repository.findAll();
    }

    // ─── Buscar por ID ────────────────────────────────────────────────────────

    public Memorando buscarPorId(Long id) {

        return repository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Memorando não encontrado: id=" + id
                        )
                );
    }

    // ─── Atualizar ────────────────────────────────────────────────────────────

    public MemorandoResponseDTO atualizar(
            Long id,
            UpdateMemorandoDTO dto
    ) {

        Memorando memorando = buscarPorId(id);

        if (dto.numero() != null && !dto.numero().isBlank()) {
            memorando.setNumero(dto.numero());
        }

        if (dto.descricao() != null && !dto.descricao().isBlank()) {
            memorando.setDescricao(dto.descricao());
        }

        if (dto.unloc() != null && !dto.unloc().isBlank()) {
            memorando.setUnloc(dto.unloc());
        }

        if (dto.municipio() != null && !dto.municipio().isBlank()) {
            memorando.setMunicipio(dto.municipio());
        }

        if (dto.memoEntrada() != null) {
            memorando.setMemoEntrada(dto.memoEntrada());
        }

        if (dto.data() != null && !dto.data().isBlank()) {
            memorando.setDataEmissao(
                    LocalDate.parse(dto.data(), BR_DATE)
            );
        }

        Memorando updated = repository.save(memorando);

        return toDTO(updated);
    }

    // ─── Deletar ──────────────────────────────────────────────────────────────

    public void deletar(Long id) {

        Memorando memorando = buscarPorId(id);

        repository.delete(memorando);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private MemorandoResponseDTO toDTO(Memorando m) {

        return new MemorandoResponseDTO(
                m.getId(),
                m.getNumero(),
                m.getDescricao(),
                m.getUnloc(),
                m.getMunicipio(),
                m.getMemoEntrada(),
                m.getDataEmissao() != null
                        ? m.getDataEmissao().format(BR_DATE)
                        : null,
                m.getUsuario(),
                m.getCriadoEm() != null
                        ? m.getCriadoEm().toString()
                        : null
        );
    }
}
