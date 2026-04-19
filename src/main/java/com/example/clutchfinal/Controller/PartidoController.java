package com.example.clutchfinal.Controller;

import com.example.clutchfinal.DTO.EstadoPartidoDTO;
import com.example.clutchfinal.DTO.HistorialPartidoDTO;
import com.example.clutchfinal.DTO.InicializarActasDTO;
import com.example.clutchfinal.DTO.PartidoDTO;
import com.example.clutchfinal.DTO.PartidosResponseDTO;
import com.example.clutchfinal.Service.PartidoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/clutch/partidos")
public class PartidoController {

    @Autowired
    private PartidoService partidoService;

    @GetMapping
    public ResponseEntity<List<PartidosResponseDTO>> findAll() {
        return new ResponseEntity<>(partidoService.findAllPartidos(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PartidosResponseDTO> findById(@PathVariable Long id) {
        PartidosResponseDTO dto = partidoService.findPartidoById(id);
        if (dto == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(dto, HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<PartidoDTO> save(@RequestBody PartidoDTO dto) {
        try {
            dto.setId(null);
            return new ResponseEntity<>(partidoService.savePartido(dto), HttpStatus.CREATED);
        } catch (NoSuchElementException | IllegalArgumentException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<PartidoDTO> update(@PathVariable Long id, @RequestBody PartidoDTO dto) {
        if (partidoService.findPartidoById(id) == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        try {
            dto.setId(id);
            return new ResponseEntity<>(partidoService.savePartido(dto), HttpStatus.OK);
        } catch (NoSuchElementException | IllegalArgumentException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (partidoService.findPartidoById(id) == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        partidoService.deletePartidoById(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @PostMapping("/{id}/actas/inicializar")
    public ResponseEntity<Void> inicializarActas(@PathVariable Long id, @RequestBody InicializarActasDTO dto) {
        try {
            partidoService.inicializarActas(id, dto);
            return new ResponseEntity<>(HttpStatus.OK);
        } catch (NoSuchElementException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (IllegalStateException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/eventos")
    public ResponseEntity<EstadoPartidoDTO> registrarEvento(@RequestBody HistorialPartidoDTO eventoDTO) {
        try {
            return new ResponseEntity<>(partidoService.registrarEvento(eventoDTO), HttpStatus.OK);
        } catch (NoSuchElementException | IllegalArgumentException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/{id}/estado")
    public ResponseEntity<EstadoPartidoDTO> obtenerEstado(@PathVariable Long id) {
        try {
            return new ResponseEntity<>(partidoService.obtenerEstadoPartido(id), HttpStatus.OK);
        } catch (NoSuchElementException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("/{id}/finalizar")
    public ResponseEntity<Void> finalizarPartido(@PathVariable Long id) {
        try {
            partidoService.finalizarPartido(id);
            return new ResponseEntity<>(HttpStatus.OK);
        } catch (NoSuchElementException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (IllegalStateException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }
}
