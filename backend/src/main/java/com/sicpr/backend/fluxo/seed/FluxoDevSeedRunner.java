package com.sicpr.backend.fluxo.seed;

import com.sicpr.backend.fluxo.dto.AprovarLoteRequest;
import com.sicpr.backend.fluxo.dto.DocumentoFluxoRequest;
import com.sicpr.backend.fluxo.dto.GerenteUnidadeRequest;
import com.sicpr.backend.fluxo.dto.GerenteUnidadeResponse;
import com.sicpr.backend.fluxo.dto.ProcessoFluxoRequest;
import com.sicpr.backend.fluxo.dto.ProcessoFluxoResponse;
import com.sicpr.backend.fluxo.repository.GerenteUnidadeFluxoRepository;
import com.sicpr.backend.fluxo.repository.ProcessoFluxoRepository;
import com.sicpr.backend.fluxo.service.FluxoService;
import com.sicpr.backend.fluxo.service.FluxoTransitionService;
import com.sicpr.backend.fluxo.service.GerenteAprovacaoFluxoService;
import com.sicpr.backend.fluxo.service.GerenteUnidadeFluxoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "sicpr.fluxo.seed", name = "enabled", havingValue = "true")
public class FluxoDevSeedRunner implements ApplicationRunner {

    private static final String TECNICO = "Tecnico da Unidade Local";
    private static final String ANALISTA = "Analista";
    private static final String LANCAMENTO = "Lancamento";

    private final FluxoService fluxoService;
    private final FluxoTransitionService transitionService;
    private final GerenteAprovacaoFluxoService gerenteAprovacaoService;
    private final GerenteUnidadeFluxoService gerenteService;
    private final ProcessoFluxoRepository processoRepository;
    private final GerenteUnidadeFluxoRepository gerenteRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (processoRepository.count() > 0 || gerenteRepository.count() > 0) {
            log.info("Seed do fluxo ignorado: ja existem processos ou gerentes persistidos.");
            return;
        }

        GerenteUnidadeResponse gerente = criarGerentePadrao();

        criarProcesso("Maria do Socorro Lima", "01876543210", "Iranduba", "inscricao");

        ProcessoFluxoResponse aguardandoGerente = criarProcesso("Joao Pedro Nascimento", "12345678901", "Manacapuru", "renovacao");
        transitionService.encaminharGerente(aguardandoGerente.getId(), TECNICO);

        ProcessoFluxoResponse emAnalise = criarProcesso("Ana Clara Souza", "98765432100", "Manacapuru", "inscricao");
        transitionService.encaminharGerente(emAnalise.getId(), TECNICO);
        gerenteAprovacaoService.aprovarLote(aprovarLoteRequest(List.of(emAnalise.getId()), gerente.getId()), gerente.getNome());

        ProcessoFluxoResponse aguardandoLancamento = criarProcesso("Carlos Eduardo Alves", "11122233344", "Manacapuru", "alteracao");
        transitionService.encaminharGerente(aguardandoLancamento.getId(), TECNICO);
        gerenteAprovacaoService.aprovarLote(aprovarLoteRequest(List.of(aguardandoLancamento.getId()), gerente.getId()), gerente.getNome());
        transitionService.aprovarAnalise(aguardandoLancamento.getId(), ANALISTA);

        ProcessoFluxoResponse concluido = criarProcesso("Sofia Martins Ribeiro", "22233344455", "Manacapuru", "inscricao");
        transitionService.encaminharGerente(concluido.getId(), TECNICO);
        gerenteAprovacaoService.aprovarLote(aprovarLoteRequest(List.of(concluido.getId()), gerente.getId()), gerente.getNome());
        transitionService.aprovarAnalise(concluido.getId(), ANALISTA);
        transitionService.concluirLancamento(concluido.getId(), LANCAMENTO);

        log.info("Seed do fluxo concluido com dados demonstrativos de desenvolvimento.");
    }

    private GerenteUnidadeResponse criarGerentePadrao() {
        GerenteUnidadeRequest request = new GerenteUnidadeRequest();
        request.setNome("Gerente de Unidade Local");
        request.setUnidadeLocal("Manacapuru");
        request.setCargo("Gerente da Unidade Local");
        request.setTelefoneCorporativo("(92) 0000-0000");
        request.setTelefonePessoal("");
        request.setStatus("ativo");
        return gerenteService.salvarGerente(request);
    }

    private ProcessoFluxoResponse criarProcesso(String produtor, String cpf, String unidadeLocal, String tipoProcesso) {
        ProcessoFluxoRequest request = new ProcessoFluxoRequest();
        request.setProdutor(produtor);
        request.setCpf(cpf);
        request.setUnidadeLocal(unidadeLocal);
        request.setTipoProcesso(tipoProcesso);
        request.setDocumentosGerados(Map.of(
                "fac", Map.of(
                        "endereco", "Comunidade rural cadastrada",
                        "propriedade", "Sitio demonstrativo",
                        "atividade", "Producao familiar"
                ),
                "declaracao_produtor", Map.of(
                        "atividadePrincipal", "Producao familiar",
                        "area", "1,0 ha"
                )
        ));
        request.setDocumentos(List.of(
                documento("FAC assinada pelo produtor", "fac-assinada-" + cpf + ".pdf", true, "fac_assinada"),
                documento("Croqui da propriedade", "croqui-" + cpf + ".pdf", false, "outros")
        ));
        return fluxoService.criarProcesso(request, TECNICO);
    }

    private DocumentoFluxoRequest documento(String nome, String arquivo, boolean obrigatorio, String categoria) {
        DocumentoFluxoRequest request = new DocumentoFluxoRequest();
        request.setNome(nome);
        request.setArquivo(arquivo);
        request.setObrigatorio(obrigatorio);
        request.setCategoria(categoria);
        request.setMimeType("application/pdf");
        request.setTamanho(128_000L);
        return request;
    }

    private AprovarLoteRequest aprovarLoteRequest(List<String> ids, String gerenteId) {
        AprovarLoteRequest request = new AprovarLoteRequest();
        request.setIds(ids);
        request.setGerenteId(gerenteId);
        return request;
    }
}
