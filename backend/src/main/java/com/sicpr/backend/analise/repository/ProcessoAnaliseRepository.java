package com.sicpr.backend.analise.repository;

import com.sicpr.backend.analise.model.ProcessoAnalise;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProcessoAnaliseRepository extends JpaRepository<ProcessoAnalise, Long> {

    List<ProcessoAnalise> findByCpfContaining(String cpf);

    List<ProcessoAnalise> findByProdutorContainingIgnoreCase(String produtor);

    List<ProcessoAnalise> findByDecisao(String decisao);

    List<ProcessoAnalise> findByEncaminhadoPara(String encaminhadoPara);

    List<ProcessoAnalise> findByGccStatus(String gccStatus);

    List<ProcessoAnalise> findByChecklistIncompleto(Boolean checklistIncompleto);

    List<ProcessoAnalise> findByDeclaracaoVencida(Boolean declaracaoVencida);

    List<ProcessoAnalise> findByDeclaracaoFutura(Boolean declaracaoFutura);

    List<ProcessoAnalise> findByCpfDivergente(Boolean cpfDivergente);
}