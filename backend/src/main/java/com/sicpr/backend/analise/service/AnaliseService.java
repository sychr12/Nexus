package com.sicpr.backend.analise.service;

import com.sicpr.backend.analise.dto.AnaliseRequest;
import com.sicpr.backend.analise.dto.AnaliseResponse;
import com.sicpr.backend.analise.dto.DecisaoProcessoRequest;
import com.sicpr.backend.analise.dto.EncaminhamentoAnaliseResponse;
import com.sicpr.backend.analise.dto.ProcessoAnaliseRequest;
import com.sicpr.backend.analise.dto.ProcessoAnaliseResponse;
import com.sicpr.backend.analise.model.Analise;
import com.sicpr.backend.analise.model.EncaminhamentoAnalise;
import com.sicpr.backend.analise.model.ProcessoAnalise;
import com.sicpr.backend.analise.repository.AnaliseRepository;
import com.sicpr.backend.analise.repository.EncaminhamentoAnaliseRepository;
import com.sicpr.backend.analise.repository.ProcessoAnaliseRepository;
import com.sicpr.backend.analise.validator.AnaliseValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnaliseService {

    private final AnaliseRepository analiseRepository;
    private final ProcessoAnaliseRepository processoRepository;
    private final EncaminhamentoAnaliseRepository encaminhamentoRepository;

    @Transactional
    public AnaliseResponse salvar(AnaliseRequest request) {

        AnaliseValidator.validarAnalise(request);

        Analise analise = Analise.builder()
                .numero(request.getNumero())
                .titulo(request.getTitulo())
                .motivo(request.getMotivo())
                .localidade(request.getLocalidade())
                .emailOrigem(request.getEmailOrigem())
                .prioridade(request.getPrioridade())
                .memorandoPdf(request.getMemorandoPdf())
                .status("recebido")
                .build();

        List<ProcessoAnalise> processos = request.getProcessos()
                .stream()
                .map(processoRequest -> converterProcessoRequest(processoRequest, analise))
                .toList();

        analise.setProcessos(processos);

        Analise salvo = analiseRepository.save(analise);

        return converterResponse(salvo);
    }

    public List<AnaliseResponse> listar() {

        return analiseRepository.findAllByOrderByRecebidoEmDesc()
                .stream()
                .map(this::converterResponse)
                .toList();
    }

    public AnaliseResponse buscar(Long id) {

        Analise analise = buscarAnalisePorId(id);

        return converterResponse(analise);
    }

    public AnaliseResponse abrir(Long id) {

        Analise analise = buscarAnalisePorId(id);

        if (analise.getAbertoEm() == null) {
            analise.setAbertoEm(LocalDateTime.now());
            analise.setAbertoPor("admin");
        }

        analise.setStatus("em_analise");

        Analise salvo = analiseRepository.save(analise);

        return converterResponse(salvo);
    }

    @Transactional
    public AnaliseResponse decidirProcesso(
            Long processoId,
            DecisaoProcessoRequest request
    ) {

        ProcessoAnalise processo = processoRepository.findById(processoId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Processo não encontrado."
                ));

        AnaliseValidator.validarDecisao(request);
        validarDecisaoProcesso(processo, request);

        LocalDateTime agora = LocalDateTime.now();

        processo.setDecisao(request.getDestino());
        processo.setEncaminhadoPara(request.getDestino());
        processo.setEncaminhadoEm(agora);
        processo.setDecisaoEm(agora);
        processo.setDecisaoResponsavel("admin");

        if (request.getObservacao() != null) {
            processo.setObservacao(request.getObservacao());
            processo.setObservacaoAtualizadaEm(agora);
        }

        if ("devolucao".equalsIgnoreCase(request.getDestino())) {
            processo.setMotivoDevolucao(request.getMotivo());
        } else {
            processo.setMotivoDevolucao(null);
        }

        processoRepository.save(processo);

        Analise analise = processo.getAnalise();
        salvarEncaminhamento(analise, processo, request, agora);
        atualizarStatusAnalise(analise);

        Analise salvo = analiseRepository.save(analise);

        return converterResponse(salvo);
    }

    public List<EncaminhamentoAnaliseResponse> listarEncaminhamentos(String destino) {

        List<EncaminhamentoAnalise> encaminhamentos;

        if (destino == null || destino.isBlank()) {
            encaminhamentos = encaminhamentoRepository.findAll();
        } else {
            encaminhamentos = encaminhamentoRepository.findByDestino(destino);
        }

        return encaminhamentos
                .stream()
                .map(this::converterEncaminhamentoResponse)
                .toList();
    }

    public EncaminhamentoAnaliseResponse buscarEncaminhamento(String id) {

        EncaminhamentoAnalise encaminhamento = encaminhamentoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Encaminhamento nao encontrado."
                ));

        return converterEncaminhamentoResponse(encaminhamento);
    }

    private void validarDecisaoProcesso(
            ProcessoAnalise processo,
            DecisaoProcessoRequest request
    ) {

        if (request.getDestino() == null || request.getDestino().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Destino é obrigatório."
            );
        }

        boolean destinoLancamento =
                "lancamento".equalsIgnoreCase(request.getDestino());

        boolean destinoDevolucao =
                "devolucao".equalsIgnoreCase(request.getDestino());

        if (!destinoLancamento && !destinoDevolucao) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Destino inválido. Use lancamento ou devolucao."
            );
        }

        if (destinoDevolucao) {

            if (request.getMotivo() == null || request.getMotivo().isBlank()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Motivo da devolução é obrigatório."
                );
            }

            if (request.getObservacao() == null || request.getObservacao().isBlank()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Observação da devolução é obrigatória."
                );
            }
        }

        if (destinoLancamento && !podeLancar(processo)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Este processo possui pendências e não pode ser encaminhado para lançamento."
            );
        }
    }

    private boolean podeLancar(ProcessoAnalise processo) {

        return !Boolean.TRUE.equals(processo.getChecklistIncompleto())
                && !Boolean.TRUE.equals(processo.getGccDivergente())
                && !Boolean.TRUE.equals(processo.getDeclaracaoVencida())
                && !Boolean.TRUE.equals(processo.getDeclaracaoFutura())
                && !Boolean.TRUE.equals(processo.getCpfDivergente());
    }

    private void salvarEncaminhamento(
            Analise analise,
            ProcessoAnalise processo,
            DecisaoProcessoRequest request,
            LocalDateTime encaminhadoEm
    ) {

        String destino = request.getDestino().toLowerCase();
        String destinoAnterior = "lancamento".equals(destino)
                ? "devolucao"
                : "lancamento";

        encaminhamentoRepository.deleteByProcessoIdAndDestino(
                processo.getId(),
                destinoAnterior
        );

        EncaminhamentoAnalise encaminhamento = EncaminhamentoAnalise.builder()
                .id(gerarEncaminhamentoId(analise, processo, destino))
                .analiseId(analise.getId())
                .memorandoNumero(analise.getNumero())
                .memorandoTitulo(analise.getTitulo())
                .memorandoPdf(analise.getMemorandoPdf())
                .processoId(processo.getId())
                .produtor(processo.getProdutor())
                .cpf(processo.getCpf())
                .localidade(analise.getLocalidade())
                .processoPdf(processo.getProcessoPdf())
                .declaracaoPdf(processo.getDeclaracaoPdf())
                .tipoIdentificado(processo.getTipoIdentificado())
                .resultadoConsulta(processo.getGccStatus())
                .dataDeclaracao(processo.getDataDeclaracao() == null
                        ? null
                        : processo.getDataDeclaracao().toString())
                .recebidoEm(analise.getRecebidoEm())
                .encaminhadoEm(encaminhadoEm)
                .destino(destino)
                .motivo("devolucao".equals(destino) ? request.getMotivo() : null)
                .observacao(processo.getObservacao())
                .build();

        encaminhamentoRepository.save(encaminhamento);
    }

    private String gerarEncaminhamentoId(
            Analise analise,
            ProcessoAnalise processo,
            String destino
    ) {

        return analise.getId() + "-" + processo.getId() + "-" + destino;
    }

    private void atualizarStatusAnalise(Analise analise) {

        boolean todosDecididos = analise.getProcessos()
                .stream()
                .allMatch(processo ->
                        processo.getDecisao() != null
                                && !processo.getDecisao().isBlank()
                );

        if (todosDecididos) {
            analise.setStatus("finalizado");
            analise.setFinalizadoEm(LocalDateTime.now());
        } else {
            analise.setStatus("em_analise");
        }
    }

    private ProcessoAnalise converterProcessoRequest(
            ProcessoAnaliseRequest request,
            Analise analise
    ) {

        return ProcessoAnalise.builder()
                .produtor(request.getProdutor())
                .cpf(request.getCpf())
                .processoPdf(request.getProcessoPdf())
                .declaracaoPdf(request.getDeclaracaoPdf())
                .dataDeclaracao(parseLocalDate(request.getDataDeclaracao()))
                .recebidoEm(parseLocalDate(request.getRecebidoEm()))
                .tipoIdentificado(valorOuPadrao(
                        request.getTipoIdentificado(),
                        "nao_definido"
                ))
                .gccStatus(valorOuPadrao(
                        request.getGccStatus(),
                        "nao_consultado"
                ))
                .dadosGccConferidos(Boolean.TRUE.equals(request.getDadosGccConferidos()))
                .observacao(request.getObservacao())
                .decisao(request.getDecisao())
                .motivoDevolucao(request.getMotivoDevolucao())
                .encaminhadoPara(request.getEncaminhadoPara())
                .encaminhadoEm(parseLocalDateTime(request.getEncaminhadoEm()))
                .checklistIncompleto(Boolean.TRUE.equals(request.getChecklistIncompleto()))
                .gccDivergente(Boolean.TRUE.equals(request.getGccDivergente()))
                .declaracaoVencida(Boolean.TRUE.equals(request.getDeclaracaoVencida()))
                .declaracaoFutura(Boolean.TRUE.equals(request.getDeclaracaoFutura()))
                .cpfDivergente(Boolean.TRUE.equals(request.getCpfDivergente()))
                .analise(analise)
                .build();
    }

    private AnaliseResponse converterResponse(Analise analise) {

        List<ProcessoAnaliseResponse> processos = analise.getProcessos()
                .stream()
                .map(this::converterProcessoResponse)
                .toList();

        return AnaliseResponse.builder()
                .id(analise.getId())
                .numero(analise.getNumero())
                .titulo(analise.getTitulo())
                .motivo(analise.getMotivo())
                .localidade(analise.getLocalidade())
                .emailOrigem(analise.getEmailOrigem())
                .prioridade(analise.getPrioridade())
                .status(analise.getStatus())
                .memorandoPdf(analise.getMemorandoPdf())
                .abertoPor(analise.getAbertoPor())
                .recebidoEm(analise.getRecebidoEm())
                .abertoEm(analise.getAbertoEm())
                .finalizadoEm(analise.getFinalizadoEm())
                .produtoresInformados(processos.size())
                .processos(processos)
                .build();
    }

    private ProcessoAnaliseResponse converterProcessoResponse(
            ProcessoAnalise processo
    ) {

        return ProcessoAnaliseResponse.builder()
                .id(processo.getId())
                .produtor(processo.getProdutor())
                .cpf(processo.getCpf())
                .processoPdf(processo.getProcessoPdf())
                .declaracaoPdf(processo.getDeclaracaoPdf())
                .dataDeclaracao(processo.getDataDeclaracao())
                .recebidoEm(processo.getRecebidoEm())
                .tipoIdentificado(processo.getTipoIdentificado())
                .gccStatus(processo.getGccStatus())
                .dadosGccConferidos(processo.getDadosGccConferidos())
                .observacao(processo.getObservacao())
                .observacaoAtualizadaEm(processo.getObservacaoAtualizadaEm())
                .decisao(processo.getDecisao())
                .motivoDevolucao(processo.getMotivoDevolucao())
                .decisaoResponsavel(processo.getDecisaoResponsavel())
                .decisaoEm(processo.getDecisaoEm())
                .encaminhadoPara(processo.getEncaminhadoPara())
                .encaminhadoEm(processo.getEncaminhadoEm())
                .checklistIncompleto(processo.getChecklistIncompleto())
                .gccDivergente(processo.getGccDivergente())
                .declaracaoVencida(processo.getDeclaracaoVencida())
                .declaracaoFutura(processo.getDeclaracaoFutura())
                .cpfDivergente(processo.getCpfDivergente())
                .build();
    }

    private EncaminhamentoAnaliseResponse converterEncaminhamentoResponse(
            EncaminhamentoAnalise encaminhamento
    ) {

        return EncaminhamentoAnaliseResponse.builder()
                .id(encaminhamento.getId())
                .analiseId(encaminhamento.getAnaliseId())
                .memorandoNumero(encaminhamento.getMemorandoNumero())
                .memorandoTitulo(encaminhamento.getMemorandoTitulo())
                .memorandoPdf(encaminhamento.getMemorandoPdf())
                .processoId(encaminhamento.getProcessoId())
                .produtor(encaminhamento.getProdutor())
                .cpf(encaminhamento.getCpf())
                .localidade(encaminhamento.getLocalidade())
                .processoPdf(encaminhamento.getProcessoPdf())
                .declaracaoPdf(encaminhamento.getDeclaracaoPdf())
                .tipoIdentificado(encaminhamento.getTipoIdentificado())
                .resultadoConsulta(encaminhamento.getResultadoConsulta())
                .dataDeclaracao(encaminhamento.getDataDeclaracao())
                .recebidoEm(encaminhamento.getRecebidoEm())
                .encaminhadoEm(encaminhamento.getEncaminhadoEm())
                .destino(encaminhamento.getDestino())
                .motivo(encaminhamento.getMotivo())
                .observacao(encaminhamento.getObservacao())
                .build();
    }

    private Analise buscarAnalisePorId(Long id) {

        return analiseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Análise não encontrada."
                ));
    }

    private LocalDate parseLocalDate(String valor) {

        if (valor == null || valor.isBlank()) {
            return null;
        }

        return LocalDate.parse(valor);
    }

    private LocalDateTime parseLocalDateTime(String valor) {

        if (valor == null || valor.isBlank()) {
            return null;
        }

        return LocalDateTime.parse(valor);
    }

    private String valorOuPadrao(
            String valor,
            String padrao
    ) {

        if (valor == null || valor.isBlank()) {
            return padrao;
        }

        return valor;
    }
}
