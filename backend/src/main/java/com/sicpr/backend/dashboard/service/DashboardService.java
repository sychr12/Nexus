package com.sicpr.backend.dashboard.service;

import com.sicpr.backend.carteira.model.CarteiraDigital;
import com.sicpr.backend.carteira.repository.CarteiraRepository;
import com.sicpr.backend.dashboard.dto.AtividadeRecenteDTO;
import com.sicpr.backend.dashboard.dto.ChartDataDTO;
import com.sicpr.backend.dashboard.dto.DashboardStatsDTO;
import com.sicpr.backend.dashboard.dto.NotificacaoDTO;
import com.sicpr.backend.dashboard.dto.RelatorioDTO;
import com.sicpr.backend.dashboard.dto.TopCategoriaDTO;
import com.sicpr.backend.dashboard.dto.UsuarioAtivoDTO;
import com.sicpr.backend.fluxo.model.ProcessoFluxo;
import com.sicpr.backend.fluxo.repository.ProcessoFluxoRepository;
import com.sicpr.backend.inscricao.model.Inscricao;
import com.sicpr.backend.inscricao.repository.InscricaoRepository;
import com.sicpr.backend.memorando.entity.Memorando;
import com.sicpr.backend.memorando.repository.MemorandoRepository;
import com.sicpr.backend.security.CryptoService;
import com.sicpr.backend.user.model.User;
import com.sicpr.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final DateTimeFormatter DATA_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    private static final DateTimeFormatter DIA_MES = DateTimeFormatter.ofPattern("dd/MM");
    private static final Set<String> STATUS_DEVOLVIDOS = Set.of("devolvido_gerente", "devolvido_analise");
    private static final Set<String> STATUS_EM_ELABORACAO = Set.of("em_elaboracao", "devolvido_gerente", "devolvido_analise");

    private final UserRepository userRepository;
    private final InscricaoRepository inscricaoRepository;
    private final MemorandoRepository memorandoRepository;
    private final CarteiraRepository carteiraRepository;
    private final ProcessoFluxoRepository processoFluxoRepository;
    private final CryptoService cryptoService;

    public DashboardStatsDTO obterEstatisticas() {
        LocalDateTime agora = LocalDateTime.now();
        LocalDateTime cincoMinutosAtras = agora.minusMinutes(5);
        LocalDateTime inicioHoje = LocalDate.now().atStartOfDay();
        LocalDateTime fimHoje = inicioHoje.plusDays(1);

        long totalUsuarios = userRepository.count();
        long usuariosOnline = userRepository.countByUltimoLoginAfter(cincoMinutosAtras);

        long processosEmElaboracao = processoFluxoRepository.countBySituacaoIn(STATUS_EM_ELABORACAO);
        long processosGerente = processoFluxoRepository.countBySituacao("encaminhado_gerente");
        long processosAnalise = processoFluxoRepository.countBySituacao("em_analise");
        long processosLancamento = processoFluxoRepository.countBySituacao("aprovado_lancamento");
        long processosConcluidos = processoFluxoRepository.countBySituacao("concluido");
        long processosDevolvidos = processoFluxoRepository.countBySituacaoIn(STATUS_DEVOLVIDOS);

        String ultimoAcesso = userRepository.findTop5ByUltimoLoginIsNotNullOrderByUltimoLoginDesc().stream()
                .findFirst()
                .map(User::getUltimoLogin)
                .map(data -> data.format(DATA_HORA))
                .orElse("Sem acessos registrados");

        return DashboardStatsDTO.builder()
                .usuariosOnline(toInt(usuariosOnline))
                .usuariosOffline(toInt(Math.max(totalUsuarios - usuariosOnline, 0)))
                .totalUsuarios(toInt(totalUsuarios))
                .usuariosAtivos(toInt(userRepository.countByStatus("ATIVO")))
                .usuariosBloqueados(toInt(userRepository.countByStatus("BLOQUEADO")))
                .totalInscricoes(toInt(inscricaoRepository.count()))
                .inscricoesHoje(toInt(inscricaoRepository.countByCriadoEmBetween(inicioHoje, fimHoje)))
                .totalLancamentos(toInt(processosLancamento))
                .totalMemorandos(toInt(memorandoRepository.count()))
                .memorandosHoje(toInt(memorandoRepository.countByCriadoEmBetween(inicioHoje, fimHoje)))
                .totalCartoes(toInt(carteiraRepository.count()))
                .cartoesHoje(toInt(carteiraRepository.countByCriadoEmBetween(inicioHoje, fimHoje)))
                .totalProcessosFluxo(toInt(processoFluxoRepository.count()))
                .processosEmElaboracao(toInt(processosEmElaboracao))
                .processosGerente(toInt(processosGerente))
                .processosAnalise(toInt(processosAnalise))
                .processosLancamento(toInt(processosLancamento))
                .processosConcluidos(toInt(processosConcluidos))
                .processosDevolvidos(toInt(processosDevolvidos))
                .ultimoAcesso(ultimoAcesso)
                .build();
    }

    public List<TopCategoriaDTO> obterTopCategorias() {
        return List.of(
                categoria("Em elaboracao", processoFluxoRepository.countBySituacao("em_elaboracao")),
                categoria("Aguardando gerente", processoFluxoRepository.countBySituacao("encaminhado_gerente")),
                categoria("Em analise", processoFluxoRepository.countBySituacao("em_analise")),
                categoria("Aguardando lancamento", processoFluxoRepository.countBySituacao("aprovado_lancamento")),
                categoria("Concluidos", processoFluxoRepository.countBySituacao("concluido")),
                categoria("Devolvidos", processoFluxoRepository.countBySituacaoIn(STATUS_DEVOLVIDOS))
        );
    }

    public List<RelatorioDTO> obterRelatorios() {
        return List.of(
                RelatorioDTO.builder().nome("Inscricoes por periodo").descricao("Volume de inscricoes cadastradas no sistema").rota("/tabela").build(),
                RelatorioDTO.builder().nome("Carteiras emitidas").descricao("Carteiras digitais emitidas por periodo").rota("/carteira").build(),
                RelatorioDTO.builder().nome("Memorandos emitidos").descricao("Memorandos criados e movimentados").rota("/memorando").build(),
                RelatorioDTO.builder().nome("Processos por situacao").descricao("Acompanhamento do fluxo operacional").rota("/analises").build(),
                RelatorioDTO.builder().nome("Usuarios e acessos").descricao("Usuarios ativos, bloqueados e ultimo acesso").rota("/users").build()
        );
    }

    public List<NotificacaoDTO> obterNotificacoes() {
        List<NotificacaoDTO> notificacoes = new ArrayList<>();
        long gerente = processoFluxoRepository.countBySituacao("encaminhado_gerente");
        long analise = processoFluxoRepository.countBySituacao("em_analise");
        long lancamento = processoFluxoRepository.countBySituacao("aprovado_lancamento");
        long devolvidos = processoFluxoRepository.countBySituacaoIn(STATUS_DEVOLVIDOS);
        long bloqueados = userRepository.countByStatus("BLOQUEADO");

        adicionarNotificacao(notificacoes, gerente, "Aguardando gerente", "processo(s) pendente(s) de aprovacao gerencial");
        adicionarNotificacao(notificacoes, analise, "Em analise", "processo(s) em analise tecnica");
        adicionarNotificacao(notificacoes, lancamento, "Aguardando lancamento", "processo(s) pronto(s) para lancamento");
        adicionarNotificacao(notificacoes, devolvidos, "Processos devolvidos", "processo(s) precisam de correcao");
        adicionarNotificacao(notificacoes, bloqueados, "Usuarios bloqueados", "usuario(s) bloqueado(s) no sistema");

        return notificacoes;
    }

    public List<UsuarioAtivoDTO> obterUsuariosAtivos() {
        LocalDateTime cincoMinutosAtras = LocalDateTime.now().minusMinutes(5);

        return userRepository.findTop5ByUltimoLoginIsNotNullOrderByUltimoLoginDesc().stream()
                .filter(user -> user.getUltimoLogin() != null && user.getUltimoLogin().isAfter(cincoMinutosAtras))
                .map(this::toUsuarioAtivo)
                .toList();
    }

    public List<AtividadeRecenteDTO> obterAtividadesRecentes() {
        List<AtividadeRecenteDTO> atividades = new ArrayList<>();

        processoFluxoRepository.findTop8ByOrderByAtualizadoEmDesc().forEach(processo ->
                atividades.add(AtividadeRecenteDTO.builder()
                        .tipo("PROCESSO")
                        .usuario(usuarioProcesso(processo))
                        .descricao("Processo de " + valorOuPadrao(processo.getProdutor(), "produtor") + ": " + labelSituacao(processo.getSituacao()))
                        .dataHora(primeiraData(processo.getAtualizadoEm(), processo.getCriadoEm()))
                        .icone("processo")
                        .build())
        );

        carteiraRepository.findTop5ByOrderByCriadoEmDesc().forEach(carteira ->
                atividades.add(AtividadeRecenteDTO.builder()
                        .tipo("CARTEIRA")
                        .usuario(valorOuPadrao(carteira.getUsuario(), "sistema"))
                        .descricao("Carteira emitida para " + valorOuPadrao(carteira.getNome(), "produtor"))
                        .dataHora(carteira.getCriadoEm())
                        .icone("carteira")
                        .build())
        );

        memorandoRepository.findTop5ByOrderByCriadoEmDesc().forEach(memorando ->
                atividades.add(AtividadeRecenteDTO.builder()
                        .tipo("MEMORANDO")
                        .usuario(valorOuPadrao(memorando.getUsuario(), "sistema"))
                        .descricao("Memorando " + valorOuPadrao(memorando.getNumero(), "sem numero") + " criado")
                        .dataHora(memorando.getCriadoEm())
                        .icone("memorando")
                        .build())
        );

        inscricaoRepository.findTop5ByOrderByCriadoEmDesc().forEach(inscricao ->
                atividades.add(AtividadeRecenteDTO.builder()
                        .tipo("INSCRICAO")
                        .usuario("publico")
                        .descricao(descricaoInscricao(inscricao))
                        .dataHora(inscricao.getCriadoEm())
                        .icone("inscricao")
                        .build())
        );

        userRepository.findTop5ByUltimoLoginIsNotNullOrderByUltimoLoginDesc().forEach(user ->
                atividades.add(AtividadeRecenteDTO.builder()
                        .tipo("LOGIN")
                        .usuario(user.getUsername())
                        .descricao("Login realizado por " + valorOuPadrao(user.getNomeCompleto(), user.getUsername()))
                        .dataHora(user.getUltimoLogin())
                        .icone("login")
                        .build())
        );

        return atividades.stream()
                .filter(atividade -> atividade.getDataHora() != null)
                .sorted(Comparator.comparing(AtividadeRecenteDTO::getDataHora).reversed())
                .limit(10)
                .toList();
    }

    public ChartDataDTO obterGraficoMensal() {
        List<String> dias = new ArrayList<>();
        List<Integer> valores = new ArrayList<>();
        LocalDate hoje = LocalDate.now();

        for (int i = 29; i >= 0; i--) {
            LocalDate dia = hoje.minusDays(i);
            LocalDateTime inicio = dia.atStartOfDay();
            LocalDateTime fim = inicio.plusDays(1);
            long totalDia = inscricaoRepository.countByCriadoEmBetween(inicio, fim)
                    + carteiraRepository.countByCriadoEmBetween(inicio, fim)
                    + memorandoRepository.countByCriadoEmBetween(inicio, fim)
                    + processoFluxoRepository.countByCriadoEmBetween(inicio, fim);

            dias.add(dia.format(DIA_MES));
            valores.add(toInt(totalDia));
        }

        return ChartDataDTO.builder().dias(dias).valores(valores).build();
    }

    private TopCategoriaDTO categoria(String nome, long total) {
        return TopCategoriaDTO.builder().nome(nome).total(toInt(total)).build();
    }

    private void adicionarNotificacao(List<NotificacaoDTO> notificacoes, long total, String titulo, String mensagem) {
        if (total <= 0) {
            return;
        }

        notificacoes.add(NotificacaoDTO.builder()
                .titulo(titulo)
                .mensagem(total + " " + mensagem)
                .dataHora("Agora")
                .lida(false)
                .build());
    }

    private UsuarioAtivoDTO toUsuarioAtivo(User user) {
        return UsuarioAtivoDTO.builder()
                .username(user.getUsername())
                .nome(valorOuPadrao(user.getNomeCompleto(), user.getUsername()))
                .perfil(valorOuPadrao(user.getPerfil(), "USUARIO"))
                .ultimoAcesso(user.getUltimoLogin())
                .tempoOnline(tempoDesde(user.getUltimoLogin()))
                .build();
    }

    private String tempoDesde(LocalDateTime dataHora) {
        if (dataHora == null) {
            return "-";
        }

        long minutos = Duration.between(dataHora, LocalDateTime.now()).toMinutes();
        if (minutos < 1) {
            return "Agora";
        }
        if (minutos < 60) {
            return minutos + " min";
        }

        long horas = minutos / 60;
        return horas + " h";
    }

    private String usuarioProcesso(ProcessoFluxo processo) {
        return valorOuPadrao(
                primeiroTexto(processo.getLancadoPor(), processo.getAnalistaResponsavel(), processo.getGerenteResponsavel(), processo.getTecnicoResponsavel()),
                "sistema"
        );
    }

    private String descricaoInscricao(Inscricao inscricao) {
        String nome = descriptografarLegivel(inscricao.getNome());
        if (nome == null) {
            return "Inscricao cadastrada";
        }

        return "Inscricao cadastrada para " + nome;
    }

    private String descriptografarLegivel(String valor) {
        try {
            String descriptografado = cryptoService.decrypt(valor);
            if (ehTextoLegivel(descriptografado)) {
                return descriptografado.trim();
            }
        } catch (Exception ignored) {
            return null;
        }

        return null;
    }

    private boolean ehTextoLegivel(String valor) {
        if (valor == null || valor.isBlank()) {
            return false;
        }

        String trimmed = valor.trim();
        if (trimmed.length() > 120) {
            return false;
        }

        long letrasOuEspacos = trimmed.chars()
                .filter(ch -> Character.isLetter(ch) || Character.isSpaceChar(ch))
                .count();

        return letrasOuEspacos >= Math.max(3, trimmed.length() / 2);
    }

    private LocalDateTime primeiraData(LocalDateTime primeira, LocalDateTime segunda) {
        return primeira != null ? primeira : segunda;
    }

    private String primeiroTexto(String... valores) {
        for (String valor : valores) {
            if (valor != null && !valor.isBlank()) {
                return valor;
            }
        }
        return null;
    }

    private String valorOuPadrao(String valor, String padrao) {
        return valor == null || valor.isBlank() ? padrao : valor;
    }

    private String labelSituacao(String situacao) {
        if (situacao == null || situacao.isBlank()) {
            return "Situacao nao informada";
        }

        return switch (situacao) {
            case "em_elaboracao" -> "Em elaboracao";
            case "encaminhado_gerente" -> "Encaminhado para gerente";
            case "devolvido_gerente" -> "Devolvido pelo gerente";
            case "aprovado_gerente" -> "Aprovado pelo gerente";
            case "em_analise" -> "Em analise";
            case "devolvido_analise" -> "Devolvido pela analise";
            case "aprovado_lancamento" -> "Aguardando lancamento";
            case "concluido" -> "Concluido";
            default -> situacao.replace('_', ' ');
        };
    }

    private int toInt(long value) {
        return value > Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) value;
    }
}
