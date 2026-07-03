package com.sicpr.backend.carteira.service;

import com.sicpr.backend.carteira.dto.BatchResultDTO;
import com.sicpr.backend.carteira.dto.BatchStatusDTO;
import com.sicpr.backend.carteira.model.CarteiraDigital;
import com.sicpr.backend.carteira.repository.CarteiraRepository;
import com.sicpr.backend.carteira.support.InMemoryMultipartFile;
import com.sicpr.backend.security.CryptoService;
import com.sicpr.backend.security.SearchHashService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

// REMOVA estas linhas se existirem:
// import java.time.LocalDateTime;
// import java.util.concurrent.CompletableFuture;
@Service
@RequiredArgsConstructor
@Slf4j
public class BatchCarteiraService {

    private final CarteiraRepository carteiraRepository;
    private final SefazService sefazService;
    private final PdfGenerationService pdfGenerationService;
    private final BatchUploadValidator uploadValidator;
    private final CryptoService cryptoService;
    private final SearchHashService searchHashService;
    
    private static final Pattern CPF_PATTERN = Pattern.compile("\\d{11}");
    private static final Path TEMP_DIR = Paths.get(System.getProperty("java.io.tmpdir"), "carteira_batch");
    
    // Cache para status dos batches em memória
    private final Map<String, BatchStatusDTO> batchStatusMap = new ConcurrentHashMap<>();
    
    /**
     * Processa múltiplos arquivos PDF em lote
     */
    @Transactional
    public BatchResultDTO processarBatch(List<MultipartFile> files, String usuario) throws IOException {
        uploadValidator.validarListaArquivos(files);

        String batchId = UUID.randomUUID().toString();
        log.info("Iniciando processamento em lote: {} com {} arquivos", batchId, files.size());
        
        BatchResultDTO resultado = new BatchResultDTO();
        resultado.setBatchId(batchId);
        resultado.setTotalArquivos(files.size());
        
        long inicio = System.currentTimeMillis();
        
        // Criar diretório temporário
        Files.createDirectories(TEMP_DIR);
        
        for (MultipartFile file : files) {
            String nomeArquivo = file.getOriginalFilename();
            if (nomeArquivo == null || !nomeArquivo.toLowerCase().endsWith(".pdf")) {
                resultado.setIgnorados(resultado.getIgnorados() + 1);
                addDetalhe(resultado, nomeArquivo, "", false, "Arquivo não é PDF");
                continue;
            }
            
            // Extrair CPF do nome do arquivo (baseado no código Python)
            uploadValidator.validarPdf(file);
            String cpf = extrairCpfDoNome(nomeArquivo);
            if (cpf == null) {
                resultado.setIgnorados(resultado.getIgnorados() + 1);
                addDetalhe(resultado, nomeArquivo, "", false, "CPF não encontrado no nome do arquivo");
                continue;
            }
            
            try {
                // Processar o PDF
                processarPdfArquivo(file, cpf, usuario);
                resultado.setSucessos(resultado.getSucessos() + 1);
                addDetalhe(resultado, nomeArquivo, cpf, true, "Processado com sucesso");
                log.info("Processado: {} - CPF: {}", nomeArquivo, mascararCpf(cpf));
            } catch (Exception e) {
                resultado.setErros(resultado.getErros() + 1);
                addDetalhe(resultado, nomeArquivo, cpf, false, "Erro: " + e.getMessage());
                log.error("Erro ao processar {}: {}", nomeArquivo, e.getMessage());
            }
        }
        
        resultado.setTempoTotalMs(System.currentTimeMillis() - inicio);
        log.info("Lote {} finalizado: {} sucessos, {} erros, {} ignorados", 
            batchId, resultado.getSucessos(), resultado.getErros(), resultado.getIgnorados());
        
        return resultado;
    }
    
    /**
     * Processa um arquivo ZIP contendo múltiplos PDFs
     */
    @Transactional
    public BatchResultDTO processarZip(MultipartFile zipFile, String usuario) throws IOException {
        uploadValidator.validarZip(zipFile);

        String batchId = UUID.randomUUID().toString();
        log.info("Iniciando processamento de ZIP: {}", batchId);
        
        BatchResultDTO resultado = new BatchResultDTO();
        resultado.setBatchId(batchId);
        
        long inicio = System.currentTimeMillis();
        List<MultipartFile> pdfFiles = new ArrayList<>();
        int entradas = 0;
        
        // Extrair PDFs do ZIP
        try (ZipInputStream zis = new ZipInputStream(zipFile.getInputStream())) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                entradas++;
                if (entradas > uploadValidator.maxZipEntries()) {
                    throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "ZIP excede o limite de entradas permitido.");
                }
                if (uploadValidator.isUnsafeZipEntry(entry.getName())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ZIP contem nome de arquivo invalido.");
                }

                if (!entry.isDirectory() && entry.getName().toLowerCase().endsWith(".pdf")) {
                    if (pdfFiles.size() >= uploadValidator.maxBatchFiles()) {
                        throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "ZIP contem mais PDFs que o limite permitido.");
                    }

                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    byte[] buffer = new byte[4096];
                    int len;
                    while ((len = zis.read(buffer)) > 0) {
                        baos.write(buffer, 0, len);
                        if (baos.size() > uploadValidator.maxPdfBytes()) {
                            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "PDF dentro do ZIP excede o limite permitido.");
                        }
                    }
                    
                    MultipartFile pdfFile = new InMemoryMultipartFile(
                        entry.getName(),
                        entry.getName(),
                        "application/pdf",
                        baos.toByteArray()
                    );
                    pdfFiles.add(pdfFile);
                }
                zis.closeEntry();
            }
        }
        
        resultado.setTotalArquivos(pdfFiles.size());
        log.info("Extraídos {} PDFs do ZIP", pdfFiles.size());
        
        // Processar cada PDF
        for (MultipartFile file : pdfFiles) {
            String nomeArquivo = file.getOriginalFilename();
            uploadValidator.validarPdf(file);
            String cpf = extrairCpfDoNome(nomeArquivo);
            
            if (cpf == null) {
                resultado.setIgnorados(resultado.getIgnorados() + 1);
                addDetalhe(resultado, nomeArquivo, "", false, "CPF não encontrado no nome do arquivo");
                continue;
            }
            
            try {
                processarPdfArquivo(file, cpf, usuario);
                resultado.setSucessos(resultado.getSucessos() + 1);
                addDetalhe(resultado, nomeArquivo, cpf, true, "Processado com sucesso");
            } catch (Exception e) {
                resultado.setErros(resultado.getErros() + 1);
                addDetalhe(resultado, nomeArquivo, cpf, false, "Erro: " + e.getMessage());
            }
        }
        
        resultado.setTempoTotalMs(System.currentTimeMillis() - inicio);
        return resultado;
    }
    
    /**
     * Processa um único arquivo PDF
     */
    private void processarPdfArquivo(MultipartFile file, String cpf, String usuario) throws Exception {
        log.info("Processando PDF para CPF: {}", mascararCpf(cpf));
        
        // 1. Consultar SEFAZ para obter os dados do produtor
        var dadosSefaz = sefazService.consultarPorCpf(cpf);
        
        if (dadosSefaz == null || dadosSefaz.getNome() == null) {
            throw new RuntimeException("Produtor nao encontrado na SEFAZ para CPF: " + mascararCpf(cpf));
        }
        
        // 2. Verificar se já existe uma carteira para este CPF (opcional - atualizar)
        Optional<CarteiraDigital> existente = carteiraRepository.findByCpfHash(searchHashService.cpfHash(cpf));
        
        CarteiraDigital carteira;
        if (existente.isPresent()) {
            carteira = existente.get();
            log.info("Atualizando carteira existente para CPF: {}", mascararCpf(cpf));
        } else {
            carteira = new CarteiraDigital();
            log.info("Criando nova carteira para CPF: {}", mascararCpf(cpf));
        }
        
        // 3. Preencher dados da carteira
        carteira.setRegistro(dadosSefaz.getRp());
        carteira.setCpf(dadosSefaz.getCpf());
        carteira.setCpfHash(searchHashService.cpfHash(dadosSefaz.getCpf()));
        carteira.setNome(dadosSefaz.getNome());
        carteira.setPropriedade(dadosSefaz.getPropriedade());
        carteira.setUnloc(dadosSefaz.getUnloc());
        carteira.setInicio(dadosSefaz.getInicioatv());
        carteira.setValidade(dadosSefaz.getValidade());
        carteira.setEndereco(dadosSefaz.getEndereco());
        carteira.setAtividade1(dadosSefaz.getAtv1());
        carteira.setAtividade2(dadosSefaz.getAtv2());
        
        // Construir georef
        String georef = "";
        if (dadosSefaz.getLatitude() != null && dadosSefaz.getLongitude() != null) {
            georef = dadosSefaz.getLatitude() + "  " + dadosSefaz.getLongitude();
        }
        carteira.setGeoref(georef);
        carteira.setUsuario(usuario);
        
        // 4. Gerar PDF da carteira (baseado no template)
        byte[] pdfBytes = pdfGenerationService.gerarPdf(carteira);
        carteira.setPdfConteudo(pdfBytes);
        carteira.setCpf(cryptoService.encrypt(searchHashService.normalizeCpf(dadosSefaz.getCpf())));
        
        // 5. Salvar no banco
        carteiraRepository.save(carteira);
        
        log.info("Carteira salva com ID: {} para CPF: {}", carteira.getId(), mascararCpf(cpf));
    }
    
    /**
     * Extrai CPF do nome do arquivo (baseado no código Python)
     * Exemplo: "12345678901.pdf" -> "12345678901"
     */
    private String extrairCpfDoNome(String nomeArquivo) {
        if (nomeArquivo == null) return null;
        
        String nomeSemExtensao = nomeArquivo.replaceAll("\\.pdf$", "").replaceAll("\\.PDF$", "");
        String apenasDigitos = nomeSemExtensao.replaceAll("\\D", "");
        
        if (CPF_PATTERN.matcher(apenasDigitos).matches()) {
            return apenasDigitos;
        }
        return null;
    }

    private String mascararCpf(String cpf) {
        if (cpf == null || cpf.length() != 11) {
            return "***";
        }

        return cpf.substring(0, 3) + ".***.***-" + cpf.substring(9);
    }

    private void addDetalhe(BatchResultDTO resultado, String arquivo, String cpf, boolean sucesso, String mensagem) {
        BatchResultDTO.BatchItemDTO detalhe = new BatchResultDTO.BatchItemDTO();
        detalhe.setArquivo(arquivo);
        detalhe.setCpf(cpf);
        detalhe.setSucesso(sucesso);
        detalhe.setMensagem(mensagem);
        resultado.getDetalhes().add(detalhe);
    }
    
    public BatchStatusDTO getStatus(String batchId) {
        return batchStatusMap.getOrDefault(batchId, new BatchStatusDTO());
    }
    
    /**
     * Classe auxiliar para MultipartFile em memória
     */
}
