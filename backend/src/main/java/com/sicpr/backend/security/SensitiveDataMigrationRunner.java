package com.sicpr.backend.security;

import com.sicpr.backend.carteira.model.CarteiraDigital;
import com.sicpr.backend.carteira.repository.CarteiraRepository;
import com.sicpr.backend.fluxo.model.DocumentoFluxo;
import com.sicpr.backend.fluxo.model.HistoricoFluxo;
import com.sicpr.backend.fluxo.model.ProcessoFluxo;
import com.sicpr.backend.fluxo.repository.ProcessoFluxoRepository;
import com.sicpr.backend.inscricao.model.Inscricao;
import com.sicpr.backend.inscricao.repository.InscricaoRepository;
import com.sicpr.backend.mensagem.model.Mensagem;
import com.sicpr.backend.mensagem.repository.MensagemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "sicpr.security.data-migration", name = "enabled", havingValue = "true")
public class SensitiveDataMigrationRunner implements ApplicationRunner {

    private final ProcessoFluxoRepository processoRepository;
    private final MensagemRepository mensagemRepository;
    private final CarteiraRepository carteiraRepository;
    private final InscricaoRepository inscricaoRepository;
    private final CryptoService cryptoService;
    private final SearchHashService searchHashService;

    @Value("${app.upload-dir:uploads/mensagens}")
    private String uploadDir;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        try {
            int processosAtualizados = migrarFluxo();
            int mensagensAtualizadas = migrarMensagens();
            int arquivosAtualizados = migrarArquivosDeMensagem();
            int carteirasAtualizadas = migrarCarteiras();
            int inscricoesAtualizadas = migrarInscricoes();

            if (processosAtualizados + mensagensAtualizadas + arquivosAtualizados + carteirasAtualizadas + inscricoesAtualizadas > 0) {
                log.info(
                        "Migracao de dados sensiveis concluida: {} processos, {} mensagens, {} arquivos, {} carteiras e {} inscricoes atualizados.",
                        processosAtualizados,
                        mensagensAtualizadas,
                        arquivosAtualizados,
                        carteirasAtualizadas,
                        inscricoesAtualizadas
                );
            }
        } catch (RuntimeException ex) {
            throw new IllegalStateException(
                    "Falha na migracao de dados sensiveis. Se este banco ja possui dados criptografados, confirme se DATA_ENCRYPTION_KEY e DATA_SEARCH_HASH_KEY sao as mesmas usadas quando esses dados foram gravados.",
                    ex
            );
        }
    }

    private int migrarFluxo() {
        int atualizados = 0;
        for (ProcessoFluxo processo : processoRepository.findAll()) {
            boolean changed = false;
            changed |= updateCpf(processo.getCpf(), processo.getCpfHash(), processo::setCpf, processo::setCpfHash);
            changed |= update(processo.getDocumentosGeradosJson(), processo::setDocumentosGeradosJson);
            changed |= update(processo.getAssinaturaEletronicaJson(), processo::setAssinaturaEletronicaJson);
            changed |= update(processo.getMemorandoProdutoresJson(), processo::setMemorandoProdutoresJson);
            changed |= update(processo.getMemorandosJson(), processo::setMemorandosJson);
            changed |= update(processo.getUltimaJustificativa(), processo::setUltimaJustificativa);
            changed |= update(processo.getFacRejeitadaMotivo(), processo::setFacRejeitadaMotivo);

            for (DocumentoFluxo documento : processo.getDocumentos()) {
                changed |= update(documento.getConteudo(), documento::setConteudo);
            }
            for (HistoricoFluxo historico : processo.getHistorico()) {
                changed |= update(historico.getObservacao(), historico::setObservacao);
            }

            if (changed) {
                processoRepository.save(processo);
                atualizados++;
            }
        }
        return atualizados;
    }

    private int migrarCarteiras() {
        int atualizadas = 0;
        for (CarteiraDigital carteira : carteiraRepository.findAll()) {
            if (updateCpf(carteira.getCpf(), carteira.getCpfHash(), carteira::setCpf, carteira::setCpfHash)) {
                carteiraRepository.save(carteira);
                atualizadas++;
            }
        }
        return atualizadas;
    }

    private int migrarInscricoes() {
        int atualizadas = 0;
        for (Inscricao inscricao : inscricaoRepository.findAll()) {
            if (updateCpf(inscricao.getCpf(), inscricao.getCpfHash(), inscricao::setCpf, inscricao::setCpfHash)) {
                inscricaoRepository.save(inscricao);
                atualizadas++;
            }
        }
        return atualizadas;
    }

    private int migrarMensagens() {
        int atualizadas = 0;
        for (Mensagem mensagem : mensagemRepository.findAll()) {
            if (update(mensagem.getTexto(), mensagem::setTexto)) {
                mensagemRepository.save(mensagem);
                atualizadas++;
            }
        }
        return atualizadas;
    }

    private int migrarArquivosDeMensagem() {
        int atualizados = 0;
        Path diretorio = Paths.get(uploadDir).toAbsolutePath().normalize();

        for (Mensagem mensagem : mensagemRepository.findAll()) {
            if (mensagem.getAnexoNomeArquivo() == null || mensagem.getAnexoNomeArquivo().isBlank()) {
                continue;
            }

            Path arquivo = diretorio.resolve(mensagem.getAnexoNomeArquivo()).normalize();
            if (!arquivo.startsWith(diretorio) || !Files.isRegularFile(arquivo)) {
                continue;
            }

            try {
                byte[] atual = Files.readAllBytes(arquivo);
                if (cryptoService.isEncryptedBytes(atual)) {
                    continue;
                }
                writeAtomically(arquivo, cryptoService.encryptBytes(atual));
                atualizados++;
            } catch (IOException e) {
                throw new IllegalStateException("Falha ao migrar anexo de mensagem: " + arquivo.getFileName(), e);
            }
        }
        return atualizados;
    }

    private boolean update(String current, java.util.function.Consumer<String> setter) {
        if (current == null || current.isBlank() || cryptoService.isEncrypted(current)) {
            return false;
        }
        String encrypted = cryptoService.encrypt(current);
        if (Objects.equals(current, encrypted)) {
            return false;
        }
        setter.accept(encrypted);
        return true;
    }

    private boolean updateCpf(
            String current,
            String currentHash,
            java.util.function.Consumer<String> valueSetter,
            java.util.function.Consumer<String> hashSetter
    ) {
        if (current == null || current.isBlank()) {
            return false;
        }

        String plain = cryptoService.decrypt(current);
        String normalized = searchHashService.normalizeCpf(plain);
        if (normalized.length() != 11) {
            return false;
        }

        String nextHash = searchHashService.cpfHash(normalized);
        String nextValue = cryptoService.isEncrypted(current) ? current : cryptoService.encrypt(normalized);

        boolean changed = false;
        if (!Objects.equals(currentHash, nextHash)) {
            hashSetter.accept(nextHash);
            changed = true;
        }
        if (!Objects.equals(current, nextValue)) {
            valueSetter.accept(nextValue);
            changed = true;
        }

        return changed;
    }

    private void writeAtomically(Path target, byte[] content) throws IOException {
        Path temp = Files.createTempFile(target.getParent(), target.getFileName().toString(), ".encrypting");
        try {
            Files.write(temp, content);
            try {
                Files.move(temp, target, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
            } catch (AtomicMoveNotSupportedException ignored) {
                Files.move(temp, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } finally {
            Files.deleteIfExists(temp);
        }
    }
}
