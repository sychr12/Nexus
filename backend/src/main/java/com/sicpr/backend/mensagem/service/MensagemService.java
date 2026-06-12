package com.sicpr.backend.mensagem.service;

import com.sicpr.backend.mensagem.dto.MensagemRequest;
import com.sicpr.backend.mensagem.dto.MensagemResponse;
import com.sicpr.backend.mensagem.model.Mensagem;
import com.sicpr.backend.mensagem.repository.MensagemRepository;
import com.sicpr.backend.config.UploadSecurityProperties;
import com.sicpr.backend.user.model.User;
import com.sicpr.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MensagemService {

    private final MensagemRepository mensagemRepository;
    private final UserRepository userRepository;
    private final UploadSecurityProperties uploadSecurityProperties;

    @Value("${app.upload-dir:uploads/mensagens}")
    private String uploadDir;

    @Transactional
    public List<MensagemResponse> listarMinhasMensagens(Authentication authentication) {
        limparExpiradas();
        User usuario = usuarioAutenticado(authentication);
        return mensagemRepository.findAtivasDoUsuario(usuario.getId(), LocalDateTime.now())
                .stream()
                .map(MensagemResponse::from)
                .toList();
    }

    @Transactional
    public MensagemResponse enviar(Authentication authentication, MensagemRequest request, MultipartFile anexo) {
        limparExpiradas();

        User remetente = usuarioAutenticado(authentication);
        User destinatario = userRepository.findById(request.getDestinatarioId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Destinatario nao encontrado"));

        if ((request.getTexto() == null || request.getTexto().isBlank()) && (anexo == null || anexo.isEmpty())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe uma mensagem ou anexo");
        }

        DadosAnexo dadosAnexo = salvarAnexo(anexo);

        Mensagem mensagem = Mensagem.builder()
                .remetente(remetente)
                .destinatario(destinatario)
                .texto(request.getTexto())
                .anexoNomeOriginal(dadosAnexo.nomeOriginal())
                .anexoNomeArquivo(dadosAnexo.nomeArquivo())
                .anexoContentType(dadosAnexo.contentType())
                .anexoTamanho(dadosAnexo.tamanho())
                .build();

        return MensagemResponse.from(mensagemRepository.save(mensagem));
    }

    @Transactional  // <-- CORRIGIDO: agora tem transação para o deleteExpiradas funcionar
    public Resource carregarAnexo(String nomeArquivo) {
        try {
            limparExpiradas();
            mensagemRepository.findByAnexoNomeArquivoAndExpiraEmAfter(nomeArquivo, LocalDateTime.now())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Anexo nao encontrado"));

            Path arquivo = diretorioUpload().resolve(nomeArquivo).normalize();
            if (!arquivo.startsWith(diretorioUpload())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arquivo invalido");
            }
            Resource resource = new UrlResource(arquivo.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Anexo nao encontrado");
            }
            return resource;
        } catch (MalformedURLException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arquivo invalido");
        }
    }

    private User usuarioAutenticado(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario nao autenticado");
        }
        return userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario nao encontrado"));
    }

    private DadosAnexo salvarAnexo(MultipartFile anexo) {
        if (anexo == null || anexo.isEmpty()) {
            return new DadosAnexo(null, null, null, null);
        }

        String contentType = anexo.getContentType() == null ? "" : anexo.getContentType();
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
            String nomeArquivo = UUID.randomUUID() + extensao;
            Files.copy(anexo.getInputStream(), diretorio.resolve(nomeArquivo));

            return new DadosAnexo(anexo.getOriginalFilename(), nomeArquivo, contentType, anexo.getSize());
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erro ao salvar anexo");
        }
    }

    // Chamado sempre dentro de um método @Transactional, então o deleteExpiradas funciona
    private void limparExpiradas() {
        mensagemRepository.findByExpiraEmLessThanEqualAndAnexoNomeArquivoIsNotNull(LocalDateTime.now())
                .forEach(mensagem -> {
                    try {
                        Files.deleteIfExists(diretorioUpload().resolve(mensagem.getAnexoNomeArquivo()).normalize());
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
        return extensao.replaceAll("[^a-zA-Z0-9.]", "");
    }

    private record DadosAnexo(String nomeOriginal, String nomeArquivo, String contentType, Long tamanho) {
    }
}
