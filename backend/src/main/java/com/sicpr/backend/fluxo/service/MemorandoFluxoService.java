package com.sicpr.backend.fluxo.service;

import com.sicpr.backend.fluxo.model.GerenteUnidadeFluxo;
import com.sicpr.backend.fluxo.model.ProcessoFluxo;
import com.sicpr.backend.fluxo.repository.ProcessoFluxoRepository;
import com.sicpr.backend.security.CryptoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MemorandoFluxoService {

    private final ProcessoFluxoRepository processoRepository;
    private final CryptoService cryptoService;

    public MemorandoLote gerarLote(GerenteUnidadeFluxo gerente, List<ProcessoFluxo> processos) {
        String memorandoNumero = gerarNumeroMemorando();
        String loteId = "lote-" + UUID.randomUUID();
        String codigoValidacao = gerarCodigoValidacao(memorandoNumero);
        LocalDateTime criadoEm = LocalDateTime.now();
        List<Map<String, Object>> produtores = processos.stream().map(this::produtorMemorando).toList();
        Map<String, Object> assinatura = criarAssinatura(loteId, memorandoNumero, codigoValidacao, gerente, processos, produtores, criadoEm);
        Map<String, Object> memorando = criarMemorando(loteId, memorandoNumero, gerente, processos, produtores, assinatura, criadoEm);

        return new MemorandoLote(
                loteId,
                memorandoNumero,
                codigoValidacao,
                criadoEm,
                produtores,
                assinatura,
                memorando
        );
    }

    private String gerarNumeroMemorando() {
        String suffix = String.valueOf(LocalDateTime.now().getYear()).substring(2);
        long next = processoRepository.countByMemorandoNumeroEndingWith("/" + suffix) + 1;
        return String.format("%04d/%s", next, suffix);
    }

    private String gerarCodigoValidacao(String memorandoNumero) {
        String year = String.valueOf(LocalDateTime.now().getYear());
        String numero = memorandoNumero.split("/")[0].replaceAll("\\D", "");
        String random = UUID.randomUUID().toString().replace("-", "").substring(0, 4).toUpperCase();
        return "SICPR-" + year + "-" + numero + "-" + random;
    }

    private Map<String, Object> produtorMemorando(ProcessoFluxo processo) {
        Map<String, Object> produtor = new LinkedHashMap<>();
        produtor.put("id", processo.getId());
        produtor.put("produtor", processo.getProdutor());
        produtor.put("cpf", cpfPlain(processo));
        produtor.put("tipoProcesso", processo.getTipoProcesso());
        return produtor;
    }

    private Map<String, Object> criarAssinatura(
            String loteId,
            String memorandoNumero,
            String codigo,
            GerenteUnidadeFluxo gerente,
            List<ProcessoFluxo> processos,
            List<Map<String, Object>> produtores,
            LocalDateTime criadoEm
    ) {
        Map<String, Object> assinatura = new LinkedHashMap<>();
        assinatura.put("id", "ass-" + UUID.randomUUID());
        assinatura.put("loteId", loteId);
        assinatura.put("codigoValidacao", codigo);
        assinatura.put("assinadaEm", criadoEm.toString());
        assinatura.put("gerenteId", gerente.getId());
        assinatura.put("gerenteNome", gerente.getNome());
        assinatura.put("gerenteCargo", gerente.getCargo());
        assinatura.put("gerenteStatus", gerente.getStatus());
        assinatura.put("gerenteTelefoneCorporativo", gerente.getTelefoneCorporativo());
        assinatura.put("gerenteTelefonePessoal", gerente.getTelefonePessoal());
        assinatura.put("unidadeLocal", gerente.getUnidadeLocal());
        assinatura.put("memorandoNumero", memorandoNumero);
        assinatura.put("quantidadeProcessos", processos.size());
        assinatura.put("quantidadeProdutores", produtores.stream().map(item -> item.get("cpf")).distinct().count());
        assinatura.put("documentosAssinados", criarDocumentosAssinados(codigo, memorandoNumero, processos));
        return assinatura;
    }

    private Map<String, Object> criarMemorando(
            String loteId,
            String memorandoNumero,
            GerenteUnidadeFluxo gerente,
            List<ProcessoFluxo> processos,
            List<Map<String, Object>> produtores,
            Map<String, Object> assinatura,
            LocalDateTime criadoEm
    ) {
        Map<String, Object> memorando = new LinkedHashMap<>();
        memorando.put("loteId", loteId);
        memorando.put("numero", memorandoNumero);
        memorando.put("arquivo", memorandoArquivo(memorandoNumero));
        memorando.put("criadoEm", criadoEm.toString());
        memorando.put("gerenteResponsavel", gerente.getNome());
        memorando.put("unidadeLocal", processos.get(0).getUnidadeLocal());
        memorando.put("quantidade", processos.size());
        memorando.put("produtores", produtores);
        memorando.put("assinatura", assinatura);
        return memorando;
    }

    private List<Map<String, Object>> criarDocumentosAssinados(String codigo, String memorandoNumero, List<ProcessoFluxo> processos) {
        List<Map<String, Object>> docs = new ArrayList<>();
        Map<String, Object> memorando = new LinkedHashMap<>();
        memorando.put("tipo", "memorando");
        memorando.put("nome", "Memorando");
        memorando.put("arquivo", memorandoArquivo(memorandoNumero));
        memorando.put("codigoDocumento", codigoDocumento(codigo, "MEM"));
        docs.add(memorando);
        processos.forEach(processo -> {
            Map<String, Object> doc = new LinkedHashMap<>();
            doc.put("tipo", "declaracao_produtor");
            doc.put("nome", "Declaracao - " + processo.getProdutor());
            doc.put("arquivo", processo.getDeclaracaoProdutor());
            doc.put("codigoDocumento", codigoDocumento(codigo, "DEC"));
            docs.add(doc);
        });
        return docs;
    }

    private String codigoDocumento(String codigo, String tipo) {
        int last = codigo.lastIndexOf("-");
        if (last < 0) return codigo + "-" + tipo;
        return codigo.substring(0, last) + "-" + tipo + codigo.substring(last);
    }

    private String cpfPlain(ProcessoFluxo processo) {
        String value = processo.getCpf();
        return value == null || value.isBlank() ? "" : cryptoService.decrypt(value);
    }

    private static String memorandoArquivo(String memorandoNumero) {
        return "Memorando " + memorandoNumero + ".pdf";
    }

    public record MemorandoLote(
            String loteId,
            String numero,
            String codigoValidacao,
            LocalDateTime criadoEm,
            List<Map<String, Object>> produtores,
            Map<String, Object> assinatura,
            Map<String, Object> memorando
    ) {
        public String arquivo() {
            return memorandoArquivo(numero);
        }
    }
}
