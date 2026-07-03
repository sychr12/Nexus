// service/CarteiraService.java
package com.sicpr.backend.carteira.service;

import com.sicpr.backend.carteira.dto.CarteiraRequestDTO;
import com.sicpr.backend.carteira.dto.CarteiraResponseDTO;
import com.sicpr.backend.carteira.dto.FiltroBuscaDTO;
import com.sicpr.backend.carteira.model.CarteiraDigital;
import com.sicpr.backend.carteira.repository.CarteiraRepository;
import com.sicpr.backend.config.UploadSecurityProperties;
import com.sicpr.backend.security.CryptoService;
import com.sicpr.backend.security.SearchHashService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class CarteiraService {
    
    private final CarteiraRepository carteiraRepository;
    private final PdfGenerationService pdfGenerationService;
    private final UploadSecurityProperties uploadSecurityProperties;
    private final CryptoService cryptoService;
    private final SearchHashService searchHashService;
    
    private static final Pattern CPF_PATTERN = Pattern.compile("\\d{11}");
    
    @Transactional
    public CarteiraResponseDTO salvar(CarteiraRequestDTO request, String usuario) throws IOException {
        log.info("Salvando carteira para produtor: {}", request.getNome());
        
        if (request.getCpf() == null) {
            throw new IllegalArgumentException("CPF e obrigatorio");
        }

        String cpfLimpo = request.getCpf().replaceAll("\\D", "");
        if (!CPF_PATTERN.matcher(cpfLimpo).matches()) {
            throw new IllegalArgumentException("CPF inválido");
        }
        
        CarteiraDigital carteira = new CarteiraDigital();
        carteira.setRegistro(request.getRegistro());
        carteira.setCpf(cpfLimpo);
        carteira.setCpfHash(searchHashService.cpfHash(cpfLimpo));
        carteira.setNome(request.getNome());
        carteira.setPropriedade(request.getPropriedade());
        carteira.setUnloc(request.getUnloc());
        carteira.setInicio(request.getInicio());
        carteira.setValidade(request.getValidade());
        carteira.setEndereco(request.getEndereco());
        carteira.setAtividade1(request.getAtividade1());
        carteira.setAtividade2(request.getAtividade2());
        carteira.setGeoref(request.getGeoref());
        carteira.setUsuario(usuario);
        
        if (request.getFotos() != null && request.getFotos().length > 0) {
            MultipartFile[] fotos = request.getFotos();
            if (fotos.length > 3) {
                throw new IllegalArgumentException("Envie no maximo 3 fotos.");
            }
            if (fotos.length > 0 && fotos[0] != null && !fotos[0].isEmpty()) {
                validarFoto(fotos[0]);
                carteira.setFoto1(fotos[0].getBytes());
            }
            if (fotos.length > 1 && fotos[1] != null && !fotos[1].isEmpty()) {
                validarFoto(fotos[1]);
                carteira.setFoto2(fotos[1].getBytes());
            }
            if (fotos.length > 2 && fotos[2] != null && !fotos[2].isEmpty()) {
                validarFoto(fotos[2]);
                carteira.setFoto3(fotos[2].getBytes());
            }
        }
        
        byte[] pdf = pdfGenerationService.gerarPdf(carteira);
        carteira.setPdfConteudo(pdf);
        carteira.setCpf(cryptoService.encrypt(cpfLimpo));
        
        CarteiraDigital saved = carteiraRepository.save(carteira);
        log.info("Carteira salva com ID: {}", saved.getId());
        
        return toResponseDTO(saved);
    }
    
    @Transactional(readOnly = true)
    public Optional<CarteiraResponseDTO> buscarPorId(Long id) {
        return carteiraRepository.findById(id)
            .map(this::toResponseDTO);
    }
    
    @Transactional(readOnly = true)
    public Page<CarteiraResponseDTO> listarTodas(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<CarteiraDigital> carteiras = carteiraRepository.findAllOrderByCriadoEmDesc(pageable);
        return carteiras.map(this::toResponseDTO);
    }
    
    @Transactional(readOnly = true)
    public Page<CarteiraResponseDTO> buscarPorTermo(String termo, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        String cpf = searchHashService.normalizeCpf(termo);
        if (cpf.length() == 11) {
            Optional<CarteiraDigital> carteira = carteiraRepository.findByCpfHash(searchHashService.cpfHash(cpf));
            if (carteira.isEmpty()) {
                return Page.empty(pageable);
            }
            return new org.springframework.data.domain.PageImpl<>(List.of(carteira.get()), pageable, 1)
                    .map(this::toResponseDTO);
        }

        Page<CarteiraDigital> carteiras = carteiraRepository.buscarPorTermo(termo, pageable);
        return carteiras.map(this::toResponseDTO);
    }
    
    @Transactional(readOnly = true)
    public Page<CarteiraResponseDTO> buscarComFiltros(FiltroBuscaDTO filtro, int page, int size) {
        String termo = filtro.getTermoPesquisa();
        if (termo != null && !termo.trim().isEmpty()) {
            return buscarPorTermo(termo, page, size);
        }
        return listarTodas(page, size);
    }
    
    @Transactional(readOnly = true)
    public byte[] buscarPdfPorId(Long id) {
        CarteiraDigital carteira = carteiraRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Carteira nao encontrada."));
        return carteira.getPdfConteudo();
    }
    
    @Transactional(readOnly = true)
    public CarteiraResponseDTO buscarPorCpf(String cpf) {
        String cpfLimpo = cpf.replaceAll("\\D", "");
        return carteiraRepository.findByCpfHash(searchHashService.cpfHash(cpfLimpo))
            .map(this::toResponseDTO)
            .orElse(null);
    }
    
    @Transactional(readOnly = true)
    public List<String> buscarUsuariosUnicos() {
        return carteiraRepository.findUsuariosUnicos();
    }
    
    @Transactional(readOnly = true)
    public long contarTotal() {
        return carteiraRepository.count();
    }
    
    private CarteiraResponseDTO toResponseDTO(CarteiraDigital carteira) {
        CarteiraResponseDTO dto = new CarteiraResponseDTO();
        dto.setId(carteira.getId());
        dto.setRegistro(carteira.getRegistro());
        dto.setCpf(decryptNullable(carteira.getCpf()));
        dto.setNome(carteira.getNome());
        dto.setPropriedade(carteira.getPropriedade());
        dto.setUnloc(carteira.getUnloc());
        dto.setInicio(carteira.getInicio());
        dto.setValidade(carteira.getValidade());
        dto.setEndereco(carteira.getEndereco());
        dto.setAtividade1(carteira.getAtividade1());
        dto.setAtividade2(carteira.getAtividade2());
        dto.setGeoref(carteira.getGeoref());
        dto.setUsuario(carteira.getUsuario());
        dto.setCreatedAt(carteira.getCriadoEm());
        return dto;
    }

    private void validarFoto(MultipartFile foto) {
        if (foto.getSize() > uploadSecurityProperties.carteiraPhotoMaxBytes()) {
            throw new IllegalArgumentException("Cada foto deve ter no maximo " + uploadSecurityProperties.getCarteiraPhotoMaxSize() + ".");
        }

        String contentType = foto.getContentType() == null ? "" : foto.getContentType().toLowerCase();
        if (!List.of("image/jpeg", "image/png", "image/gif", "image/webp").contains(contentType)) {
            throw new IllegalArgumentException("Apenas imagens JPG, PNG, GIF ou WEBP sao permitidas nas fotos da carteira.");
        }
        if (!hasSupportedImageSignature(foto, contentType)) {
            throw new IllegalArgumentException("Imagem invalida ou incompativel com o tipo informado.");
        }
    }

    private boolean hasSupportedImageSignature(MultipartFile file, String contentType) {
        try (InputStream input = file.getInputStream()) {
            byte[] header = input.readNBytes(12);
            return switch (contentType) {
                case "image/jpeg" -> header.length >= 3
                        && (header[0] & 0xFF) == 0xFF
                        && (header[1] & 0xFF) == 0xD8
                        && (header[2] & 0xFF) == 0xFF;
                case "image/png" -> header.length >= 8
                        && (header[0] & 0xFF) == 0x89
                        && header[1] == 'P'
                        && header[2] == 'N'
                        && header[3] == 'G'
                        && (header[4] & 0xFF) == 0x0D
                        && (header[5] & 0xFF) == 0x0A
                        && (header[6] & 0xFF) == 0x1A
                        && (header[7] & 0xFF) == 0x0A;
                case "image/gif" -> header.length >= 6
                        && header[0] == 'G'
                        && header[1] == 'I'
                        && header[2] == 'F'
                        && header[3] == '8'
                        && (header[4] == '7' || header[4] == '9')
                        && header[5] == 'a';
                case "image/webp" -> header.length >= 12
                        && header[0] == 'R'
                        && header[1] == 'I'
                        && header[2] == 'F'
                        && header[3] == 'F'
                        && header[8] == 'W'
                        && header[9] == 'E'
                        && header[10] == 'B'
                        && header[11] == 'P';
                default -> false;
            };
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nao foi possivel validar a imagem.");
        }
    }

    private String decryptNullable(String value) {
        return value == null || value.isBlank() ? "" : cryptoService.decrypt(value);
    }
}
