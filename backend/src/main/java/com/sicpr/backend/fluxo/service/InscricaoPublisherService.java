package com.sicpr.backend.fluxo.service;

import com.sicpr.backend.fluxo.model.ProcessoFluxo;
import com.sicpr.backend.inscricao.model.Inscricao;
import com.sicpr.backend.inscricao.repository.InscricaoRepository;
import com.sicpr.backend.security.CryptoService;
import com.sicpr.backend.security.SearchHashService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class InscricaoPublisherService {

    private static final String ORIGEM_FLUXO_LANCAMENTO = "fluxo_lancamento";
    private static final String VALOR_NAO_INFORMADO = "Nao informado";

    private final InscricaoRepository inscricaoRepository;
    private final CryptoService cryptoService;
    private final SearchHashService searchHashService;

    public void publishConcludedProcesso(ProcessoFluxo processo) {
        if (inscricaoRepository.existsByProcessoFluxoId(processo.getId())) {
            return;
        }

        String cpf = decryptCpf(processo);
        String memorando = processo.getMemorandoNumero() == null || processo.getMemorandoNumero().isBlank()
                ? processo.getId()
                : processo.getMemorandoNumero();

        Inscricao inscricao = Inscricao.builder()
                .nome(cryptoService.encrypt(processo.getProdutor()))
                .cpf(cryptoService.encrypt(cpf))
                .cpfHash(searchHashService.cpfHash(cpf))
                .municipio(processo.getUnidadeLocal())
                .memorando(cryptoService.encrypt(memorando))
                .latitude(cryptoService.encrypt(VALOR_NAO_INFORMADO))
                .longitude(cryptoService.encrypt(VALOR_NAO_INFORMADO))
                .tipo(processo.getTipoProcesso())
                .origem(ORIGEM_FLUXO_LANCAMENTO)
                .processoFluxoId(processo.getId())
                .lancadoEm(processo.getLancadoEm())
                .build();

        inscricaoRepository.save(inscricao);
    }

    private String decryptCpf(ProcessoFluxo processo) {
        String value = processo.getCpf();
        return value == null || value.isBlank() ? "" : cryptoService.decrypt(value);
    }
}
