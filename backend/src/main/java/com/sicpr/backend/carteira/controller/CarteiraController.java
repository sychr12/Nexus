// controller/CarteiraController.java
package com.sicpr.backend.carteira.controller;

import com.sicpr.backend.carteira.dto.CarteiraRequestDTO;
import com.sicpr.backend.carteira.dto.CarteiraResponseDTO;
import com.sicpr.backend.carteira.dto.FiltroBuscaDTO;
import com.sicpr.backend.carteira.dto.SefazDadosDTO;
import com.sicpr.backend.carteira.service.CarteiraService;
import com.sicpr.backend.carteira.service.SefazService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/carteira")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CarteiraController {
    
    private final CarteiraService carteiraService;
    private final SefazService sefazService;
    
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CarteiraResponseDTO> salvar(
            @ModelAttribute CarteiraRequestDTO request,
            @AuthenticationPrincipal UserDetails userDetails) throws IOException {
        String usuario = userDetails != null ? userDetails.getUsername() : "SISTEMA";
        CarteiraResponseDTO response = carteiraService.salvar(request, usuario);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<CarteiraResponseDTO> buscarPorId(@PathVariable Long id) {
        Optional<CarteiraResponseDTO> carteira = carteiraService.buscarPorId(id);
        return carteira.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/buscar")
    public ResponseEntity<Page<CarteiraResponseDTO>> buscar(
            @RequestParam(required = false) String termoPesquisa,
            @RequestParam(defaultValue = "TODOS") String periodo,
            @RequestParam(defaultValue = "TODOS") String usuario,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        FiltroBuscaDTO filtro = new FiltroBuscaDTO();
        filtro.setTermoPesquisa(termoPesquisa);
        filtro.setPeriodo(periodo);
        filtro.setUsuario(usuario);
        return ResponseEntity.ok(carteiraService.buscarComFiltros(filtro, page, size));
    }
    
    @GetMapping("/pdf/{id}")
    public ResponseEntity<byte[]> baixarPdf(@PathVariable Long id) {
        byte[] pdf = carteiraService.buscarPdfPorId(id);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "carteira_" + id + ".pdf");
        return ResponseEntity.ok().headers(headers).body(pdf);
    }
    
    @GetMapping("/visualizar/{id}")
    public ResponseEntity<byte[]> visualizarPdf(@PathVariable Long id) {
        byte[] pdf = carteiraService.buscarPdfPorId(id);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"carteira_" + id + ".pdf\"");
        return ResponseEntity.ok().headers(headers).body(pdf);
    }
    
    @GetMapping("/cpf/{cpf}")
    public ResponseEntity<CarteiraResponseDTO> buscarPorCpf(@PathVariable String cpf) {
        CarteiraResponseDTO carteira = carteiraService.buscarPorCpf(cpf);
        return carteira != null ? ResponseEntity.ok(carteira) : ResponseEntity.notFound().build();
    }
    
    @GetMapping("/sefaz/consultar/{cpf}")
    public ResponseEntity<SefazDadosDTO> consultarSefaz(@PathVariable String cpf) {
        return ResponseEntity.ok(sefazService.consultarPorCpf(cpf));
    }
    
    @GetMapping("/usuarios")
    public ResponseEntity<List<String>> buscarUsuarios() {
        return ResponseEntity.ok(carteiraService.buscarUsuariosUnicos());
    }

    @GetMapping("/listar")
    public ResponseEntity<Page<CarteiraResponseDTO>> listarTodas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(carteiraService.listarTodas(page, size));
    }
    
    @GetMapping("/total")
    public ResponseEntity<Long> contarTotal() {
        return ResponseEntity.ok(carteiraService.contarTotal());
    }
    
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleIllegalArgument(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
    
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> handleRuntimeException(RuntimeException e) {
        return ResponseEntity.status(404).body(e.getMessage());
    }
}