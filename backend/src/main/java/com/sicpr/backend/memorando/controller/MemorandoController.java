package com.sicpr.backend.memorando.controller;

import com.sicpr.backend.memorando.dto.CreateMemorandoDTO;
import com.sicpr.backend.memorando.dto.MemorandoResponseDTO;
import com.sicpr.backend.memorando.dto.UpdateMemorandoDTO;
import com.sicpr.backend.memorando.entity.Memorando;
import com.sicpr.backend.memorando.service.MemorandoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/memorandos")
@RequiredArgsConstructor
public class MemorandoController {

    private final MemorandoService service;

    @PostMapping
    public ResponseEntity<MemorandoResponseDTO>
    criar(
            @RequestBody
            @Valid
            CreateMemorandoDTO dto
    ) {

        return ResponseEntity.ok(
                service.criar(dto)
        );
    }

    @GetMapping
    public ResponseEntity<List<Memorando>>
    listar() {

        return ResponseEntity.ok(
                service.listar()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Memorando>
    buscarPorId(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                service.buscarPorId(id)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<MemorandoResponseDTO>
    atualizar(
            @PathVariable Long id,
            @RequestBody UpdateMemorandoDTO dto
    ) {

        return ResponseEntity.ok(
                service.atualizar(id, dto)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void>
    deletar(
            @PathVariable Long id
    ) {

        service.deletar(id);

        return ResponseEntity.noContent().build();
    }
}