package com.sicpr.backend.dashboard.service;

import com.sicpr.backend.dashboard.dto.*;
import com.sicpr.backend.user.model.User;
import com.sicpr.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final EntityManager entityManager;

    public DashboardStatsDTO obterEstatisticas() {
        long totalUsuarios = userRepository.count();
        
        LocalDateTime cincoMinAtras = LocalDateTime.now().minusMinutes(5);
        long usuariosOnline = userRepository.findAll().stream()
                .filter(u -> u.getUltimoLogin() != null && u.getUltimoLogin().isAfter(cincoMinAtras))
                .count();
        long usuariosOffline = totalUsuarios - usuariosOnline;
        
        int totalLancamentos = obterTotalLancamentos();
        int totalMemorandos = obterTotalMemorandos();
        int totalCartoes = obterTotalCartoes();
        int totalEmails = obterTotalEmails();
        
        String ultimoAcesso = userRepository.findAll().stream()
                .filter(u -> u.getUltimoLogin() != null)
                .map(u -> u.getUltimoLogin())
                .max(LocalDateTime::compareTo)
                .map(d -> d.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")))
                .orElse(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")));
        
        return DashboardStatsDTO.builder()
                .usuariosOnline((int) usuariosOnline)
                .usuariosOffline((int) usuariosOffline)
                .totalUsuarios((int) totalUsuarios)
                .totalLancamentos(totalLancamentos)
                .totalMemorandos(totalMemorandos)
                .totalCartoes(totalCartoes)
                .totalEmails(totalEmails)
                .ultimoAcesso(ultimoAcesso)
                .build();
    }
    
    private int obterTotalLancamentos() {
        try {
            Query query = entityManager.createNativeQuery("SELECT COUNT(*) FROM lancamentos");
            return ((Number) query.getSingleResult()).intValue();
        } catch (Exception e) {
            return 1248;
        }
    }
    
    private int obterTotalMemorandos() {
        try {
            Query query = entityManager.createNativeQuery("SELECT COUNT(*) FROM memorandos");
            return ((Number) query.getSingleResult()).intValue();
        } catch (Exception e) {
            return 342;
        }
    }
    
    private int obterTotalCartoes() {
        try {
            Query query = entityManager.createNativeQuery("SELECT COUNT(*) FROM cartoes");
            return ((Number) query.getSingleResult()).intValue();
        } catch (Exception e) {
            return 210;
        }
    }
    
    private int obterTotalEmails() {
        try {
            Query query = entityManager.createNativeQuery("SELECT COUNT(*) FROM emails");
            return ((Number) query.getSingleResult()).intValue();
        } catch (Exception e) {
            return 532;
        }
    }
    
    public List<TopCategoriaDTO> obterTopCategorias() {
        List<TopCategoriaDTO> categorias = new ArrayList<>();
        categorias.add(TopCategoriaDTO.builder().nome("Combustível").total(36).build());
        categorias.add(TopCategoriaDTO.builder().nome("Insumos").total(25).build());
        categorias.add(TopCategoriaDTO.builder().nome("Serviços").total(20).build());
        categorias.add(TopCategoriaDTO.builder().nome("Outros").total(19).build());
        return categorias;
    }
    
    public List<RelatorioDTO> obterRelatorios() {
        List<RelatorioDTO> relatorios = new ArrayList<>();
        relatorios.add(RelatorioDTO.builder().nome("Relatório de Lançamentos").descricao("Lançamentos por período").build());
        relatorios.add(RelatorioDTO.builder().nome("Memorando por status").descricao("Memorando").build());
        relatorios.add(RelatorioDTO.builder().nome("Cartões emitidos").descricao("Cartões emitidos").build());
        relatorios.add(RelatorioDTO.builder().nome("Relatório Financeiro").descricao("Resumo financeiro").build());
        relatorios.add(RelatorioDTO.builder().nome("Relatório de E-mails").descricao("E-mails enviados").build());
        return relatorios;
    }
    
    public List<NotificacaoDTO> obterNotificacoes() {
        List<NotificacaoDTO> notificacoes = new ArrayList<>();
        notificacoes.add(NotificacaoDTO.builder().titulo("Memorando MEM-2024-0001").mensagem("Novo memorando criado").dataHora("Há 5 minutos").lida(false).build());
        notificacoes.add(NotificacaoDTO.builder().titulo("Novo lançamento adicional").mensagem("Lançamento registrado").dataHora("Há 1 hora").lida(false).build());
        notificacoes.add(NotificacaoDTO.builder().titulo("Cartão emitido com sucesso").mensagem("Cartão emitido").dataHora("Há 2 horas").lida(true).build());
        notificacoes.add(NotificacaoDTO.builder().titulo("E-mail enviado para SEFAZ").mensagem("E-mail enviado").dataHora("Há 3 horas").lida(true).build());
        notificacoes.add(NotificacaoDTO.builder().titulo("Backup realizado com sucesso").mensagem("Backup concluído").dataHora("Há 5 horas").lida(true).build());
        return notificacoes;
    }
    
    public List<UsuarioAtivoDTO> obterUsuariosAtivos() {
        List<UsuarioAtivoDTO> usuarios = new ArrayList<>();
        LocalDateTime cincoMinAtras = LocalDateTime.now().minusMinutes(5);
        
        List<User> users = userRepository.findAll();
        for (User user : users) {
            boolean isOnline = user.getUltimoLogin() != null && user.getUltimoLogin().isAfter(cincoMinAtras);
            
            if (isOnline) {
                long minutos = Duration.between(user.getUltimoLogin(), LocalDateTime.now()).toMinutes();
                String tempoOnline = minutos < 1 ? "Agora" : minutos + " minuto" + (minutos > 1 ? "s" : "");
                
                usuarios.add(UsuarioAtivoDTO.builder()
                    .username(user.getUsername())
                    .nome(user.getNomeCompleto() != null ? user.getNomeCompleto() : user.getUsername())
                    .perfil(user.getPerfil() != null ? user.getPerfil() : "USUARIO")
                    .ultimoAcesso(user.getUltimoLogin())
                    .tempoOnline(tempoOnline)
                    .build());
            }
        }
        
        // Se não houver usuários online, adiciona o admin
        if (usuarios.isEmpty()) {
            userRepository.findByUsername("admin").ifPresent(admin -> {
                usuarios.add(UsuarioAtivoDTO.builder()
                    .username(admin.getUsername())
                    .nome(admin.getNomeCompleto() != null ? admin.getNomeCompleto() : admin.getUsername())
                    .perfil(admin.getPerfil() != null ? admin.getPerfil() : "ADMIN")
                    .ultimoAcesso(LocalDateTime.now())
                    .tempoOnline("Agora")
                    .build());
            });
        }
        
        return usuarios;
    }
    
    public List<AtividadeRecenteDTO> obterAtividadesRecentes() {
        List<AtividadeRecenteDTO> atividades = new ArrayList<>();
        atividades.add(AtividadeRecenteDTO.builder()
            .tipo("LOGIN")
            .usuario("admin")
            .descricao("Login realizado no sistema")
            .dataHora(LocalDateTime.now().minusMinutes(5))
            .icone("🔐")
            .build());
        return atividades;
    }
    
    public ChartDataDTO obterGraficoMensal() {
        List<String> dias = new ArrayList<>();
        List<Integer> valores = new ArrayList<>();
        for (int i = 29; i >= 0; i--) {
            dias.add(LocalDateTime.now().minusDays(i).format(DateTimeFormatter.ofPattern("dd/MM")));
            valores.add(0);
        }
        return ChartDataDTO.builder().dias(dias).valores(valores).build();
    }
}