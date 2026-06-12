// service/CarteiraService.java
package com.sicpr.backend.carteira.service;

import com.sicpr.backend.carteira.dto.CarteiraRequestDTO;
import com.sicpr.backend.carteira.dto.CarteiraResponseDTO;
import com.sicpr.backend.carteira.dto.FiltroBuscaDTO;
import com.sicpr.backend.carteira.model.CarteiraDigital;
import com.sicpr.backend.carteira.repository.CarteiraRepository;
import com.sicpr.backend.config.UploadSecurityProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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
            .orElseThrow(() -> new RuntimeException("Carteira não encontrada"));
        return carteira.getPdfConteudo();
    }
    
    @Transactional(readOnly = true)
    public CarteiraResponseDTO buscarPorCpf(String cpf) {
        String cpfLimpo = cpf.replaceAll("\\D", "");
        return carteiraRepository.findByCpf(cpfLimpo)
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
        dto.setCpf(carteira.getCpf());
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
        if (!contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Apenas imagens sao permitidas nas fotos da carteira.");
        }
    }
}
