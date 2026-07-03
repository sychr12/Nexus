package com.sicpr.backend.relatorio.service;

import com.sicpr.backend.carteira.model.CarteiraDigital;
import com.sicpr.backend.carteira.repository.CarteiraRepository;
import com.sicpr.backend.dashboard.dto.DashboardStatsDTO;
import com.sicpr.backend.dashboard.dto.TopCategoriaDTO;
import com.sicpr.backend.fluxo.model.ProcessoFluxo;
import com.sicpr.backend.fluxo.repository.ProcessoFluxoRepository;
import com.sicpr.backend.inscricao.model.Inscricao;
import com.sicpr.backend.inscricao.repository.InscricaoRepository;
import com.sicpr.backend.memorando.entity.Memorando;
import com.sicpr.backend.memorando.repository.MemorandoRepository;
import com.sicpr.backend.relatorio.dto.RelatorioResumoResponse;
import com.sicpr.backend.security.CurrentUserService;
import com.sicpr.backend.security.RoleUtils;
import com.sicpr.backend.user.model.User;
import com.sicpr.backend.user.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class RelatorioService {

    private static final DateTimeFormatter BR_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATA_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    private static final Set<String> STATUS_DEVOLVIDOS = Set.of("devolvido_gerente", "devolvido_analise");
    private static final Set<String> STATUS_EM_ELABORACAO = Set.of("em_elaboracao", "devolvido_gerente", "devolvido_analise");

    private final ProcessoFluxoRepository processoRepository;
    private final InscricaoRepository inscricaoRepository;
    private final MemorandoRepository memorandoRepository;
    private final CarteiraRepository carteiraRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;

    public RelatorioResumoResponse resumo(String periodo, String inicio, String fim, String escopo, String status) {
        User user = currentUserService.requireUser();
        String role = RoleUtils.normalizeRole(user.getPerfil());
        if (!"ADMIN".equals(role) && !"GERENTE".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Relatorios disponiveis apenas para administradores e gerentes.");
        }

        DateRange range = resolveRange(periodo, inicio, fim);
        String unidadeLocal = resolveEscopo(escopo, user);
        Set<String> statusFiltro = statusSet(status);

        long processosEmElaboracao = countProcessos(range, unidadeLocal, intersection(statusFiltro, STATUS_EM_ELABORACAO));
        long processosGerente = countProcessos(range, unidadeLocal, intersection(statusFiltro, Set.of("encaminhado_gerente")));
        long processosAnalise = countProcessos(range, unidadeLocal, intersection(statusFiltro, Set.of("em_analise")));
        long processosLancamento = countProcessos(range, unidadeLocal, intersection(statusFiltro, Set.of("aprovado_lancamento")));
        long processosConcluidos = countProcessos(range, unidadeLocal, intersection(statusFiltro, Set.of("concluido")));
        long processosDevolvidos = countProcessos(range, unidadeLocal, intersection(statusFiltro, STATUS_DEVOLVIDOS));
        long totalProcessos = countProcessos(range, unidadeLocal, statusFiltro);

        LocalDateTime inicioHoje = LocalDate.now().atStartOfDay();
        LocalDateTime fimHoje = inicioHoje.plusDays(1).minusNanos(1);
        DateRange hoje = new DateRange(LocalDate.now(), LocalDate.now(), inicioHoje, fimHoje);

        long totalUsuarios = unidadeLocal == null ? userRepository.count() : userRepository.countByUnidadeLocalIgnoreCase(unidadeLocal);
        long usuariosAtivos = unidadeLocal == null ? userRepository.countByStatus("ATIVO") : userRepository.countByStatusAndUnidadeLocalIgnoreCase("ATIVO", unidadeLocal);
        long usuariosBloqueados = unidadeLocal == null ? userRepository.countByStatus("BLOQUEADO") : userRepository.countByStatusAndUnidadeLocalIgnoreCase("BLOQUEADO", unidadeLocal);
        LocalDateTime cincoMinutosAtras = LocalDateTime.now().minusMinutes(5);
        long usuariosOnline = unidadeLocal == null
                ? userRepository.countByUltimoLoginAfter(cincoMinutosAtras)
                : userRepository.countByUltimoLoginAfterAndUnidadeLocalIgnoreCase(cincoMinutosAtras, unidadeLocal);

        List<User> usuariosComLogin = unidadeLocal == null
                ? userRepository.findTop5ByUltimoLoginIsNotNullOrderByUltimoLoginDesc()
                : userRepository.findTop5ByUnidadeLocalIgnoreCaseAndUltimoLoginIsNotNullOrderByUltimoLoginDesc(unidadeLocal);

        DashboardStatsDTO stats = DashboardStatsDTO.builder()
                .usuariosOnline(toInt(usuariosOnline))
                .usuariosOffline(toInt(Math.max(totalUsuarios - usuariosOnline, 0)))
                .totalUsuarios(toInt(totalUsuarios))
                .usuariosAtivos(toInt(usuariosAtivos))
                .usuariosBloqueados(toInt(usuariosBloqueados))
                .totalInscricoes(toInt(countInscricoes(range, unidadeLocal)))
                .inscricoesHoje(toInt(countInscricoes(hoje, unidadeLocal)))
                .totalLancamentos(toInt(processosLancamento))
                .totalMemorandos(toInt(countMemorandos(range, unidadeLocal)))
                .memorandosHoje(toInt(countMemorandos(hoje, unidadeLocal)))
                .totalCartoes(toInt(countCarteiras(range, unidadeLocal)))
                .cartoesHoje(toInt(countCarteiras(hoje, unidadeLocal)))
                .totalProcessosFluxo(toInt(totalProcessos))
                .processosEmElaboracao(toInt(processosEmElaboracao))
                .processosGerente(toInt(processosGerente))
                .processosAnalise(toInt(processosAnalise))
                .processosLancamento(toInt(processosLancamento))
                .processosConcluidos(toInt(processosConcluidos))
                .processosDevolvidos(toInt(processosDevolvidos))
                .ultimoAcesso(usuariosComLogin.stream()
                        .findFirst()
                        .map(User::getUltimoLogin)
                        .map(data -> data.format(DATA_HORA))
                        .orElse("Sem acessos registrados"))
                .build();

        return RelatorioResumoResponse.builder()
                .stats(stats)
                .categorias(buildCategorias(range, unidadeLocal, statusFiltro))
                .inicio(range.inicio())
                .fim(range.fim())
                .escopo(unidadeLocal == null ? "todas" : unidadeLocal)
                .status(status == null || status.isBlank() ? "todos" : status)
                .build();
    }

    private List<TopCategoriaDTO> buildCategorias(DateRange range, String unidadeLocal, Set<String> statusFiltro) {
        List<CategoryDef> defs = List.of(
                new CategoryDef("Em elaboracao", STATUS_EM_ELABORACAO),
                new CategoryDef("Aguardando gerente", Set.of("encaminhado_gerente")),
                new CategoryDef("Em analise", Set.of("em_analise")),
                new CategoryDef("Aguardando lancamento", Set.of("aprovado_lancamento")),
                new CategoryDef("Concluidos", Set.of("concluido")),
                new CategoryDef("Devolvidos", STATUS_DEVOLVIDOS)
        );

        return defs.stream()
                .filter(def -> statusFiltro == null || !intersection(statusFiltro, def.statuses()).isEmpty())
                .map(def -> TopCategoriaDTO.builder()
                        .nome(def.label())
                        .total(toInt(countProcessos(range, unidadeLocal, intersection(statusFiltro, def.statuses()))))
                        .build())
                .toList();
    }

    private long countProcessos(DateRange range, String unidadeLocal, Set<String> statuses) {
        if (statuses != null && statuses.isEmpty()) {
            return 0;
        }
        return processoRepository.count((root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.between(root.get("criadoEm"), range.inicioDataHora(), range.fimDataHora()));
            if (unidadeLocal != null) {
                predicates.add(cb.equal(cb.lower(root.get("unidadeLocal")), unidadeLocal.toLowerCase()));
            }
            if (statuses != null) {
                predicates.add(root.get("situacao").in(statuses));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        });
    }

    private long countInscricoes(DateRange range, String unidadeLocal) {
        return inscricaoRepository.count((root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.between(root.get("criadoEm"), range.inicioDataHora(), range.fimDataHora()));
            if (unidadeLocal != null) {
                predicates.add(cb.equal(cb.lower(root.get("municipio")), unidadeLocal.toLowerCase()));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        });
    }

    private long countMemorandos(DateRange range, String unidadeLocal) {
        return memorandoRepository.count((Specification<Memorando>) (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.between(root.get("criadoEm"), range.inicioDataHora(), range.fimDataHora()));
            if (unidadeLocal != null) {
                predicates.add(cb.or(
                        cb.equal(cb.lower(root.get("municipio")), unidadeLocal.toLowerCase()),
                        cb.equal(cb.lower(root.get("unloc")), unidadeLocal.toLowerCase())
                ));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        });
    }

    private long countCarteiras(DateRange range, String unidadeLocal) {
        return carteiraRepository.count((Specification<CarteiraDigital>) (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.between(root.get("criadoEm"), range.inicioDataHora(), range.fimDataHora()));
            if (unidadeLocal != null) {
                predicates.add(cb.equal(cb.lower(root.get("unloc")), unidadeLocal.toLowerCase()));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        });
    }

    private DateRange resolveRange(String periodo, String inicio, String fim) {
        LocalDate hoje = LocalDate.now();
        String normalized = periodo == null || periodo.isBlank() ? "30" : periodo.trim().toLowerCase();

        LocalDate start;
        LocalDate end;
        switch (normalized) {
            case "custom" -> {
                start = parseDate(inicio, "inicio");
                end = parseDate(fim, "fim");
                if (end.isBefore(start)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Data final nao pode ser menor que a data inicial.");
                }
            }
            case "90" -> {
                start = hoje.minusDays(89);
                end = hoje;
            }
            case "month" -> {
                start = hoje.withDayOfMonth(1);
                end = hoje;
            }
            default -> {
                start = hoje.minusDays(29);
                end = hoje;
            }
        }

        return new DateRange(start, end, start.atStartOfDay(), end.plusDays(1).atStartOfDay().minusNanos(1));
    }

    private LocalDate parseDate(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe a data de " + field + " do relatorio.");
        }
        String trimmed = value.trim();
        try {
            return trimmed.contains("/") ? LocalDate.parse(trimmed, BR_DATE) : LocalDate.parse(trimmed);
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Data de " + field + " invalida. Use dia/mes/ano.");
        }
    }

    private String resolveEscopo(String escopo, User user) {
        String role = RoleUtils.normalizeRole(user.getPerfil());
        if (!"ADMIN".equals(role)) {
            String unidadeLocal = user.getUnidadeLocal();
            if (unidadeLocal == null || unidadeLocal.trim().isBlank()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Usuario sem unidade local vinculada.");
            }
            if (escopo != null
                    && !escopo.isBlank()
                    && !"todas".equalsIgnoreCase(escopo)
                    && !"minha_unidade".equalsIgnoreCase(escopo)
                    && !escopo.trim().equalsIgnoreCase(unidadeLocal.trim())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Usuario nao tem acesso a esta unidade local.");
            }
            return unidadeLocal.trim();
        }

        if (escopo == null || escopo.isBlank() || "todas".equalsIgnoreCase(escopo) || "minha_unidade".equalsIgnoreCase(escopo)) {
            return null;
        }
        return escopo.trim();
    }

    private Set<String> statusSet(String status) {
        if (status == null || status.isBlank() || "todos".equalsIgnoreCase(status)) {
            return null;
        }
        return switch (status) {
            case "em_elaboracao" -> STATUS_EM_ELABORACAO;
            case "encaminhado_gerente" -> Set.of("encaminhado_gerente");
            case "em_analise" -> Set.of("em_analise");
            case "aprovado_lancamento" -> Set.of("aprovado_lancamento");
            case "concluido" -> Set.of("concluido");
            case "devolvidos" -> STATUS_DEVOLVIDOS;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Situacao de relatorio invalida.");
        };
    }

    private Set<String> intersection(Set<String> base, Set<String> target) {
        if (base == null) {
            return target;
        }
        Set<String> result = new java.util.HashSet<>(base);
        result.retainAll(target);
        return result;
    }

    private int toInt(long value) {
        return value > Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) value;
    }

    private record DateRange(LocalDate inicio, LocalDate fim, LocalDateTime inicioDataHora, LocalDateTime fimDataHora) {
    }

    private record CategoryDef(String label, Set<String> statuses) {
    }
}
