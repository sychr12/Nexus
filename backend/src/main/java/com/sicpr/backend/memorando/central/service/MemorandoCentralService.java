package com.sicpr.backend.memorando.central.service;

import com.sicpr.backend.fluxo.dto.HistoricoFluxoResponse;
import com.sicpr.backend.fluxo.dto.ProcessoFluxoResponse;
import com.sicpr.backend.fluxo.mapper.ProcessoFluxoMapper;
import com.sicpr.backend.fluxo.model.ProcessoFluxo;
import com.sicpr.backend.fluxo.repository.ProcessoFluxoRepository;
import com.sicpr.backend.memorando.central.dto.MemorandoCentralItemResponse;
import com.sicpr.backend.memorando.central.dto.MemorandoCentralPageResponse;
import com.sicpr.backend.security.CurrentUserService;
import com.sicpr.backend.security.RoleUtils;
import com.sicpr.backend.user.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MemorandoCentralService {

    private static final int DEFAULT_PAGE_SIZE = 50;
    private static final int MAX_PAGE_SIZE = 100;
    private static final List<String> STATUS_ORDER = List.of(
            "em_elaboracao",
            "assinado",
            "em_analise",
            "devolvido",
            "reencaminhado",
            "aprovado",
            "lancado",
            "cancelado"
    );

    private final ProcessoFluxoRepository processoRepository;
    private final ProcessoFluxoMapper processoMapper;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public MemorandoCentralPageResponse listar(String search, String status, Integer page, Integer size) {
        User user = currentUserService.requireUser();
        String unidadeLocal = scopedUnidadeLocal(user);
        List<ProcessoFluxo> processos = unidadeLocal == null
                ? processoRepository.findByMemorandoLoteIdIsNotNullOrderByMemorandoCriadoEmDesc()
                : processoRepository.findByMemorandoLoteIdIsNotNullAndUnidadeLocalIgnoreCaseOrderByMemorandoCriadoEmDesc(unidadeLocal);

        List<MemorandoCentralItemResponse> memorandos = buildMemorandos(processos);
        Map<String, Long> counts = statusCounts(memorandos);

        String normalizedSearch = normalize(search);
        String normalizedStatus = normalizeStatus(status);
        List<MemorandoCentralItemResponse> filtered = memorandos.stream()
                .filter(item -> "todos".equals(normalizedStatus) || item.status().equals(normalizedStatus))
                .filter(item -> normalizedSearch.isBlank() || searchableText(item).contains(normalizedSearch))
                .toList();

        int pageSize = Math.max(1, Math.min(size == null ? DEFAULT_PAGE_SIZE : size, MAX_PAGE_SIZE));
        int totalPages = Math.max(1, (int) Math.ceil(filtered.size() / (double) pageSize));
        int currentPage = Math.min(Math.max(1, page == null ? 1 : page), totalPages);
        int start = Math.min((currentPage - 1) * pageSize, filtered.size());
        int end = Math.min(start + pageSize, filtered.size());

        return new MemorandoCentralPageResponse(
                filtered.subList(start, end),
                filtered.size(),
                currentPage,
                pageSize,
                totalPages,
                counts
        );
    }

    private List<MemorandoCentralItemResponse> buildMemorandos(List<ProcessoFluxo> processos) {
        Map<String, MutableMemorando> grupos = new LinkedHashMap<>();
        processos.stream()
                .map(processoMapper::toResponse)
                .forEach(processo -> memorandosDoProcesso(processo).forEach(memorando -> {
                    MutableMemorando current = grupos.computeIfAbsent(memorando.loteId(), ignored -> new MutableMemorando(memorando));
                    current.addProcesso(processo, memorando);
                }));

        List<MemorandoCentralItemResponse> memorandos = grupos.values().stream()
                .map(MutableMemorando::toResponse)
                .sorted(Comparator.comparing(MemorandoCentralItemResponse::criadoEm, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .toList();

        return memorandos.stream()
                .map(item -> withRelations(item, memorandos))
                .toList();
    }

    private List<MemorandoRecord> memorandosDoProcesso(ProcessoFluxoResponse processo) {
        if (processo.getMemorandos() != null && !processo.getMemorandos().isEmpty()) {
            return processo.getMemorandos().stream().map(item -> fromMap(item, processo)).toList();
        }
        if (isBlank(processo.getMemorandoLoteId()) || isBlank(processo.getMemorandoNumero())) {
            return List.of();
        }
        return List.of(new MemorandoRecord(
                processo.getMemorandoLoteId(),
                processo.getMemorandoNumero(),
                isBlank(processo.getMemorandoArquivo()) ? "Memorando " + processo.getMemorandoNumero() + ".pdf" : processo.getMemorandoArquivo(),
                firstDate(processo.getMemorandoCriadoEm(), processo.getGerenteAssinadoEm(), processo.getEnviadoAnaliseEm(), processo.getCriadoEm()),
                defaultText(processo.getGerenteResponsavel(), "-"),
                processo.getUnidadeLocal(),
                processo.getMemorandoQuantidade() == null ? 1 : processo.getMemorandoQuantidade(),
                produtores(processo),
                processo.getAssinaturaEletronica()
        ));
    }

    @SuppressWarnings("unchecked")
    private MemorandoRecord fromMap(Map<String, Object> item, ProcessoFluxoResponse processo) {
        String loteId = stringValue(item.get("loteId"));
        return new MemorandoRecord(
                loteId,
                stringValue(item.get("numero")),
                stringValue(item.get("arquivo")),
                dateValue(item.get("criadoEm"), processo.getMemorandoCriadoEm(), processo.getGerenteAssinadoEm(), processo.getCriadoEm()),
                defaultText(stringValue(item.get("gerenteResponsavel")), defaultText(processo.getGerenteResponsavel(), "-")),
                defaultText(stringValue(item.get("unidadeLocal")), processo.getUnidadeLocal()),
                intValue(item.get("quantidade"), processo.getMemorandoQuantidade() == null ? 1 : processo.getMemorandoQuantidade()),
                item.get("produtores") instanceof List<?> produtores ? (List<Map<String, Object>>) produtores : produtores(processo),
                item.get("assinatura") instanceof Map<?, ?> assinatura ? (Map<String, Object>) assinatura : processo.getAssinaturaEletronica()
        );
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> produtores(ProcessoFluxoResponse processo) {
        if (processo.getMemorandoProdutores() != null && !processo.getMemorandoProdutores().isEmpty()) {
            return (List<Map<String, Object>>) (List<?>) processo.getMemorandoProdutores();
        }
        Map<String, Object> produtor = new LinkedHashMap<>();
        produtor.put("id", processo.getId());
        produtor.put("produtor", processo.getProdutor());
        produtor.put("cpf", processo.getCpf());
        produtor.put("tipoProcesso", processo.getTipoProcesso());
        return List.of(produtor);
    }

    private MemorandoCentralItemResponse withRelations(MemorandoCentralItemResponse memorando, List<MemorandoCentralItemResponse> memorandos) {
        Set<String> producerIds = producerIds(memorando);
        String anterior = memorandos.stream()
                .filter(candidate -> !candidate.loteId().equals(memorando.loteId()))
                .filter(candidate -> isBefore(candidate.criadoEm(), memorando.criadoEm()))
                .filter(candidate -> sharesProducer(candidate, producerIds))
                .findFirst()
                .map(MemorandoCentralItemResponse::numero)
                .orElse(null);
        String sucessor = memorandos.stream()
                .filter(candidate -> !candidate.loteId().equals(memorando.loteId()))
                .filter(candidate -> isAfter(candidate.criadoEm(), memorando.criadoEm()))
                .filter(candidate -> sharesProducer(candidate, producerIds))
                .reduce((first, second) -> second)
                .map(MemorandoCentralItemResponse::numero)
                .orElse(null);
        List<String> cadeia = memorandos.stream()
                .filter(candidate -> candidate.loteId().equals(memorando.loteId()) || sharesProducer(candidate, producerIds))
                .sorted(Comparator.comparing(MemorandoCentralItemResponse::criadoEm, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(MemorandoCentralItemResponse::numero)
                .toList();

        return new MemorandoCentralItemResponse(
                memorando.loteId(),
                memorando.numero(),
                memorando.arquivo(),
                memorando.criadoEm(),
                memorando.gerenteResponsavel(),
                memorando.unidadeLocal(),
                memorando.quantidade(),
                memorando.produtores(),
                memorando.assinatura(),
                memorando.processos(),
                memorando.status(),
                memorando.ultimaMovimentacao(),
                memorando.tecnicos(),
                anterior,
                sucessor,
                cadeia.isEmpty() ? List.of(memorando.numero()) : cadeia
        );
    }

    private Map<String, Long> statusCounts(List<MemorandoCentralItemResponse> memorandos) {
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("todos", (long) memorandos.size());
        STATUS_ORDER.forEach(status -> counts.put(status, 0L));
        memorandos.forEach(item -> counts.computeIfPresent(item.status(), (key, value) -> value + 1));
        return counts;
    }

    private String centralStatus(List<ProcessoFluxoResponse> processos, Map<String, Object> assinatura) {
        Set<String> situacoes = processos.stream().map(ProcessoFluxoResponse::getSituacao).collect(Collectors.toSet());
        if (situacoes.contains("concluido")) return "lancado";
        if (situacoes.contains("aprovado_lancamento")) return "aprovado";
        if (situacoes.contains("devolvido_analise") || situacoes.contains("devolvido_gerente")) return "devolvido";
        if (situacoes.contains("em_analise")) return "em_analise";
        if (assinatura != null && !assinatura.isEmpty()) return "assinado";
        return "em_elaboracao";
    }

    private LocalDateTime lastMovement(List<ProcessoFluxoResponse> processos, LocalDateTime criadoEm) {
        return processos.stream()
                .flatMap(processo -> {
                    List<LocalDateTime> dates = new ArrayList<>();
                    dates.add(processo.getEncaminhadoGerenteEm());
                    dates.add(processo.getGerenteAssinadoEm());
                    dates.add(processo.getEnviadoAnaliseEm());
                    dates.add(processo.getAnalisadoEm());
                    dates.add(processo.getLancadoEm());
                    if (processo.getHistorico() != null) {
                        dates.addAll(processo.getHistorico().stream().map(HistoricoFluxoResponse::getDataHora).toList());
                    }
                    return dates.stream();
                })
                .filter(Objects::nonNull)
                .max(LocalDateTime::compareTo)
                .orElse(criadoEm);
    }

    private String searchableText(MemorandoCentralItemResponse memorando) {
        List<String> parts = new ArrayList<>();
        parts.add(memorando.numero());
        parts.add(memorando.unidadeLocal());
        parts.add(memorando.gerenteResponsavel());
        parts.addAll(memorando.tecnicos());
        parts.add(defaultText(memorando.relacionadoAnterior(), ""));
        parts.add(defaultText(memorando.sucessor(), ""));
        memorando.produtores().forEach(produtor -> {
            parts.add(stringValue(produtor.get("produtor")));
            parts.add(stringValue(produtor.get("cpf")));
            parts.add(stringValue(produtor.get("tipoProcesso")));
        });
        memorando.processos().forEach(processo -> {
            parts.add(processo.getProdutor());
            parts.add(processo.getCpf());
            parts.add(processo.getUnidadeLocal());
            parts.add(processo.getTecnicoResponsavel());
            parts.add(defaultText(processo.getGerenteResponsavel(), ""));
            if (processo.getDocumentosGerados() != null && processo.getDocumentosGerados().get("fac") != null) {
                parts.add(processo.getDocumentosGerados().get("fac").get("municipio"));
                parts.add(processo.getDocumentosGerados().get("fac").get("comunidade"));
            }
        });
        return normalize(String.join(" ", parts.stream().filter(Objects::nonNull).toList()));
    }

    private String scopedUnidadeLocal(User user) {
        String role = RoleUtils.normalizeRole(user.getPerfil());
        if ("ADMIN".equals(role)) {
            return null;
        }
        if (!"GERENTE".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Central de memorandos disponivel apenas para administradores e gerentes.");
        }
        if (user.getUnidadeLocal() == null || user.getUnidadeLocal().trim().isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Usuario sem unidade local vinculada.");
        }
        return user.getUnidadeLocal().trim();
    }

    private String normalizeStatus(String status) {
        if (isBlank(status) || "todos".equalsIgnoreCase(status)) {
            return "todos";
        }
        String normalized = normalize(status);
        if (!STATUS_ORDER.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status de memorando invalido.");
        }
        return normalized;
    }

    private static String normalize(String value) {
        if (value == null) return "";
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return normalized.toLowerCase(Locale.ROOT).trim();
    }

    private static boolean sharesProducer(MemorandoCentralItemResponse memorando, Set<String> producerIds) {
        return memorando.produtores().stream().map(item -> stringValue(item.get("id"))).anyMatch(producerIds::contains);
    }

    private static Set<String> producerIds(MemorandoCentralItemResponse memorando) {
        return memorando.produtores().stream()
                .map(item -> stringValue(item.get("id")))
                .filter(value -> !value.isBlank())
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private static boolean isBefore(LocalDateTime left, LocalDateTime right) {
        return left != null && right != null && left.isBefore(right);
    }

    private static boolean isAfter(LocalDateTime left, LocalDateTime right) {
        return left != null && right != null && left.isAfter(right);
    }

    private static LocalDateTime dateValue(Object value, LocalDateTime... fallbacks) {
        if (value instanceof LocalDateTime dateTime) return dateTime;
        if (value != null && !value.toString().isBlank()) {
            try {
                return LocalDateTime.parse(value.toString());
            } catch (DateTimeParseException ignored) {
            }
        }
        return firstDate(fallbacks);
    }

    private static LocalDateTime firstDate(LocalDateTime... values) {
        for (LocalDateTime value : values) {
            if (value != null) return value;
        }
        return null;
    }

    private static int intValue(Object value, int fallback) {
        if (value instanceof Number number) return number.intValue();
        if (value != null) {
            try {
                return Integer.parseInt(value.toString());
            } catch (NumberFormatException ignored) {
            }
        }
        return fallback;
    }

    private static String stringValue(Object value) {
        return value == null ? "" : value.toString();
    }

    private static String defaultText(String value, String fallback) {
        return isBlank(value) ? fallback : value;
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isBlank();
    }

    private record MemorandoRecord(
            String loteId,
            String numero,
            String arquivo,
            LocalDateTime criadoEm,
            String gerenteResponsavel,
            String unidadeLocal,
            Integer quantidade,
            List<Map<String, Object>> produtores,
            Map<String, Object> assinatura
    ) {
    }

    private class MutableMemorando {
        private final MemorandoRecord base;
        private final List<ProcessoFluxoResponse> processos = new ArrayList<>();
        private final List<Map<String, Object>> produtores = new ArrayList<>();

        MutableMemorando(MemorandoRecord base) {
            this.base = base;
            this.produtores.addAll(base.produtores());
        }

        void addProcesso(ProcessoFluxoResponse processo, MemorandoRecord memorando) {
            if (processos.stream().noneMatch(item -> item.getId().equals(processo.getId()))) {
                processos.add(processo);
            }
            memorando.produtores().forEach(produtor -> {
                String id = stringValue(produtor.get("id"));
                boolean exists = produtores.stream().anyMatch(item -> stringValue(item.get("id")).equals(id));
                if (!exists) {
                    produtores.add(produtor);
                }
            });
        }

        MemorandoCentralItemResponse toResponse() {
            List<String> tecnicos = processos.stream()
                    .map(ProcessoFluxoResponse::getTecnicoResponsavel)
                    .filter(value -> !isBlank(value))
                    .distinct()
                    .toList();
            String status = centralStatus(processos, base.assinatura());
            return new MemorandoCentralItemResponse(
                    base.loteId(),
                    base.numero(),
                    base.arquivo(),
                    base.criadoEm(),
                    base.gerenteResponsavel(),
                    base.unidadeLocal(),
                    base.quantidade(),
                    produtores,
                    base.assinatura(),
                    processos,
                    status,
                    lastMovement(processos, base.criadoEm()),
                    tecnicos,
                    null,
                    null,
                    List.of(base.numero())
            );
        }
    }
}
