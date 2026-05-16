package com.sicpr.backend.memorando.service;

import com.sicpr.backend.memorando.dto.FilterMemorandoDTO;
import com.sicpr.backend.memorando.entity.Memorando;
import com.sicpr.backend.memorando.repository.MemorandoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HistoricoService {

    private final MemorandoRepository repository;

    public List<Memorando> filtrar(FilterMemorandoDTO dto) {

        List<Memorando> resultado;

        boolean temTermo     = dto.termo()     != null && !dto.termo().isBlank();
        boolean temAno       = dto.ano()       != null;
        boolean temMunicipio = dto.municipio() != null && !dto.municipio().isBlank();

        // ── Busca ─────────────────────────────────────────────────────────────

        if (temTermo && temAno) {
            resultado = repository.findByAnoAndTermo(dto.ano(), dto.termo());

        } else if (temTermo) {
            resultado = repository
                    .findByNumeroContainingIgnoreCaseOrMunicipioContainingIgnoreCase(
                            dto.termo(), dto.termo());

        } else if (temAno) {
            resultado = repository.findByAno(dto.ano());

        } else {
            resultado = repository.findAll();
        }

        // ── Filtro pós-query por município (campo independente do termo) ───────
        if (temMunicipio) {
            String municipioLower = dto.municipio().toLowerCase();
            resultado = resultado.stream()
                    .filter(m -> m.getMunicipio() != null
                            && m.getMunicipio().toLowerCase().contains(municipioLower))
                    .toList();
        }

        // ── Ordenação ─────────────────────────────────────────────────────────
        if (dto.ordem() != null) {
            resultado = switch (dto.ordem().toLowerCase()) {
                case "data_asc"   -> resultado.stream()
                        .sorted(Comparator.comparing(
                                Memorando::getDataEmissao,
                                Comparator.nullsLast(Comparator.naturalOrder())))
                        .toList();
                case "data_desc"  -> resultado.stream()
                        .sorted(Comparator.comparing(
                                Memorando::getDataEmissao,
                                Comparator.nullsLast(Comparator.reverseOrder())))
                        .toList();
                case "numero_asc" -> resultado.stream()
                        .sorted(Comparator.comparing(
                                Memorando::getNumero,
                                Comparator.nullsLast(Comparator.naturalOrder())))
                        .toList();
                case "numero_desc" -> resultado.stream()
                        .sorted(Comparator.comparing(
                                Memorando::getNumero,
                                Comparator.nullsLast(Comparator.reverseOrder())))
                        .toList();
                // Padrão: mais recente primeiro
                default -> resultado.stream()
                        .sorted(Comparator.comparing(
                                Memorando::getCriadoEm,
                                Comparator.nullsLast(Comparator.reverseOrder())))
                        .toList();
            };
        }

        return resultado;
    }
}