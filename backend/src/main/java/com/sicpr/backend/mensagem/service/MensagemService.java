package com.sicpr.backend.mensagem.service;

import com.sicpr.backend.mensagem.dto.MensagemRequest;
import com.sicpr.backend.mensagem.dto.MensagemResponse;
import com.sicpr.backend.mensagem.model.Mensagem;
import com.sicpr.backend.mensagem.repository.MensagemRepository;
import com.sicpr.backend.config.UploadSecurityProperties;
import com.sicpr.backend.security.CurrentUserService;
import com.sicpr.backend.security.CryptoService;
import com.sicpr.backend.user.model.User;
import com.sicpr.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MensagemService {

    private final MensagemRepository mensagemRepository;
    private final UserRepository userRepository;
    private final UploadSecurityProperties uploadSecurityProperties;
    private final CurrentUserService currentUser;
    private final CryptoService cryptoService;

    @Value("${app.upload-dir:uploads/mensagens}")
    private String uploadDir;

    @Transactional
    public List<MensagemResponse> listarMinhasMensagens() {
        limparExpiradas();
        User usuario = usuarioAutenticado();
        return mensagemRepository.findAtivasDoUsuario(usuario.getId(), LocalDateTime.now())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MensagemUsuarioResponse> listarUsuariosDisponiveis() {
        return userRepository.findByStatusOrderByNomeCompletoAscUsernameAsc("ATIVO")
                .stream()
                .map(MensagemUsuarioResponse::from)
                .toList();
    }

    @Transactional
    public MensagemResponse enviar(MensagemRequest request, MultipartFile anexo) {
        limparExpiradas();

        User remetente = usuarioAutenticado();
        User destinatario = userRepository.findById(request.getDestinatarioId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Destinatario nao encontrado"));
        if (!"ATIVO".equalsIgnoreCase(destinatario.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Destinatario inativo ou indisponivel");
        }

        if ((request.getTexto() == null || request.getTexto().isBlank()) && (anexo == null || anexo.isEmpty())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe uma mensagem ou anexo");
        }

        DadosAnexo dadosAnexo = salvarAnexo(anexo);

        Mensagem mensagem = Mensagem.builder()
                .remetente(remetente)
                .destinatario(destinatario)
                .texto(encryptNullable(request.getTexto()))
                .anexoNomeOriginal(dadosAnexo.nomeOriginal())
                .anexoNomeArquivo(dadosAnexo.nomeArquivo())
                .anexoContentType(dadosAnexo.contentType())
                .anexoTamanho(dadosAnexo.tamanho())
                .build();

        return toResponse(mensagemRepository.save(mensagem));
    }

    @Transactional  // <-- CORRIGIDO: agora tem transação para o deleteExpiradas funcionar
    public AnexoDownload carregarAnexo(String nomeArquivo) {
        limparExpiradas();
        Mensagem mensagem = mensagemRepository.findByAnexoNomeArquivoAndExpiraEmAfter(nomeArquivo, LocalDateTime.now())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Anexo nao encontrado"));
        Long usuarioId = usuarioAutenticado().getId();
        if (!usuarioId.equals(mensagem.getRemetente().getId())
                && !usuarioId.equals(mensagem.getDestinatario().getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Anexo nao encontrado");
        }

        Path arquivo = diretorioUpload().resolve(nomeArquivo).normalize();
        if (!arquivo.startsWith(diretorioUpload())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arquivo invalido");
        }
        if (!Files.exists(arquivo) || !Files.isReadable(arquivo)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Anexo nao encontrado");
        }

        try {
            byte[] decrypted = cryptoService.decryptBytes(Files.readAllBytes(arquivo));
            String nomeOriginal = mensagem.getAnexoNomeOriginal() == null ? nomeArquivo : mensagem.getAnexoNomeOriginal();
            Resource resource = new ByteArrayResource(decrypted) {
                @Override
                public String getFilename() {
                    return nomeOriginal;
                }
            };
            return new AnexoDownload(resource, mensagem.getAnexoContentType(), nomeOriginal);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erro ao ler anexo");
        }
    }

    private User usuarioAutenticado() {
        return userRepository.findByUsername(currentUser.requireUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario nao encontrado"));
    }

    private DadosAnexo salvarAnexo(MultipartFile anexo) {
        if (anexo == null || anexo.isEmpty()) {
            return new DadosAnexo(null, null, null, null);
        }

        String contentType = anexo.getContentType() == null ? "" : anexo.getContentType().toLowerCase(Locale.ROOT);
        if (anexo.getSize() > uploadSecurityProperties.messageAttachmentMaxBytes()) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Anexo excede o limite permitido");
        }
        if (!contentType.startsWith("image/") && !contentType.startsWith("audio/") && !contentType.startsWith("video/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Apenas imagem, audio ou video sao permitidos");
        }

        try {
            Path diretorio = diretorioUpload();
            Files.createDirectories(diretorio);

            String extensao = extensao(anexo.getOriginalFilename());
            byte[] conteudo = anexo.getBytes();
            validarAssinaturaAnexo(contentType, extensao, conteudo);

            String nomeArquivo = UUID.randomUUID() + extensao;
            byte[] encrypted = cryptoService.encryptBytes(conteudo);
            Files.write(diretorio.resolve(nomeArquivo), encrypted);

            return new DadosAnexo(anexo.getOriginalFilename(), nomeArquivo, contentType, anexo.getSize());
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erro ao salvar anexo");
        }
    }

    // Chamado sempre dentro de um método @Transactional, então o deleteExpiradas funciona
    private void limparExpiradas() {
        Path diretorio = diretorioUpload();
        mensagemRepository.findByExpiraEmLessThanEqualAndAnexoNomeArquivoIsNotNull(LocalDateTime.now())
                .forEach(mensagem -> {
                    try {
                        Path arquivo = diretorio.resolve(mensagem.getAnexoNomeArquivo()).normalize();
                        if (arquivo.startsWith(diretorio)) {
                            Files.deleteIfExists(arquivo);
                        }
                    } catch (IOException ignored) {
                    }
                });
        mensagemRepository.deleteExpiradas(LocalDateTime.now());
    }

    private Path diretorioUpload() {
        return Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    private String extensao(String nomeOriginal) {
        if (nomeOriginal == null || !nomeOriginal.contains(".")) {
            return "";
        }
        String extensao = nomeOriginal.substring(nomeOriginal.lastIndexOf("."));
        return extensao.replaceAll("[^a-zA-Z0-9.]", "").toLowerCase(Locale.ROOT);
    }

    private void validarAssinaturaAnexo(String contentType, String extensao, byte[] conteudo) {
        boolean imagem = contentType.startsWith("image/");
        boolean audio = contentType.startsWith("audio/");
        boolean video = contentType.startsWith("video/");

        if (!extensaoCompativel(imagem, audio, video, extensao)
                || !assinaturaCompativel(imagem, audio, video, conteudo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de anexo invalido ou nao suportado");
        }
    }

    private boolean extensaoCompativel(boolean imagem, boolean audio, boolean video, String extensao) {
        if (extensao == null || extensao.isBlank()) {
            return true;
        }
        if (imagem) {
            return List.of(".jpg", ".jpeg", ".png", ".gif", ".webp").contains(extensao);
        }
        if (audio) {
            return List.of(".mp3", ".wav", ".ogg", ".oga", ".m4a", ".aac").contains(extensao);
        }
        if (video) {
            return List.of(".mp4", ".m4v", ".mov", ".webm", ".avi").contains(extensao);
        }
        return false;
    }

    private boolean assinaturaCompativel(boolean imagem, boolean audio, boolean video, byte[] conteudo) {
        if (conteudo == null || conteudo.length < 4) {
            return false;
        }

        if (imagem) {
            return startsWith(conteudo, 0xFF, 0xD8, 0xFF)
                    || startsWith(conteudo, 0x89, 'P', 'N', 'G')
                    || startsWith(conteudo, 'G', 'I', 'F', '8')
                    || isRiffFormat(conteudo, "WEBP");
        }

        if (audio) {
            return startsWith(conteudo, 'I', 'D', '3')
                    || (unsigned(conteudo[0]) == 0xFF && (unsigned(conteudo[1]) & 0xE0) == 0xE0)
                    || isRiffFormat(conteudo, "WAVE")
                    || startsWith(conteudo, 'O', 'g', 'g', 'S')
                    || isIsoBaseMedia(conteudo);
        }

        if (video) {
            return isIsoBaseMedia(conteudo)
                    || startsWith(conteudo, 0x1A, 0x45, 0xDF, 0xA3)
                    || isRiffFormat(conteudo, "AVI ");
        }

        return false;
    }

    private boolean startsWith(byte[] bytes, int... expected) {
        if (bytes.length < expected.length) {
            return false;
        }
        for (int i = 0; i < expected.length; i++) {
            if (unsigned(bytes[i]) != expected[i]) {
                return false;
            }
        }
        return true;
    }

    private boolean isRiffFormat(byte[] bytes, String format) {
        return bytes.length >= 12
                && startsWith(bytes, 'R', 'I', 'F', 'F')
                && asciiEquals(bytes, 8, format);
    }

    private boolean isIsoBaseMedia(byte[] bytes) {
        return bytes.length >= 12 && asciiEquals(bytes, 4, "ftyp");
    }

    private boolean asciiEquals(byte[] bytes, int offset, String expected) {
        if (bytes.length < offset + expected.length()) {
            return false;
        }
        for (int i = 0; i < expected.length(); i++) {
            if (unsigned(bytes[offset + i]) != expected.charAt(i)) {
                return false;
            }
        }
        return true;
    }

    private int unsigned(byte value) {
        return value & 0xFF;
    }

    private record DadosAnexo(String nomeOriginal, String nomeArquivo, String contentType, Long tamanho) {
    }

    public record AnexoDownload(Resource resource, String contentType, String nomeArquivo) {
    }

    public record MensagemUsuarioResponse(
            Long id,
            String username,
            String nomeCompleto,
            String perfil,
            String status
    ) {
        static MensagemUsuarioResponse from(User user) {
            return new MensagemUsuarioResponse(
                    user.getId(),
                    user.getUsername(),
                    user.getNomeCompleto(),
                    user.getPerfil(),
                    user.getStatus()
            );
        }
    }

    private MensagemResponse toResponse(Mensagem mensagem) {
        return MensagemResponse.from(mensagem, decryptNullable(mensagem.getTexto()));
    }

    private String encryptNullable(String value) {
        return value == null || value.isBlank() ? null : cryptoService.encrypt(value);
    }

    private String decryptNullable(String value) {
        return value == null || value.isBlank() ? null : cryptoService.decrypt(value);
    }
}
