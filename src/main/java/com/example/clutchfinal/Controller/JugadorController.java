package com.example.clutchfinal.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.clutchfinal.DTO.JugadorDTO;
import com.example.clutchfinal.DTO.JugadorResponseDTO;
import com.example.clutchfinal.Service.JugadorService;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/clutch/jugadores")
public class JugadorController {
    @Autowired
    private JugadorService jugadorService;

    @GetMapping
    public ResponseEntity<List<JugadorResponseDTO>> findAll(){
        return new ResponseEntity<>(jugadorService.findAll(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<JugadorResponseDTO> findById(@PathVariable Long id){
        JugadorResponseDTO jugadorDTO = jugadorService.findById(id);
        if (jugadorDTO == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(jugadorDTO, HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<JugadorDTO> save(@RequestBody JugadorDTO dto){
        try {
            dto.setId(null);
            JugadorDTO nuevoJugador = jugadorService.save(dto);
            return new ResponseEntity<>(nuevoJugador, HttpStatus.CREATED);
        } catch (NoSuchElementException | IllegalArgumentException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<JugadorDTO> update(@PathVariable Long id, @RequestBody JugadorDTO dto){
        if (jugadorService.findById(id) == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        try {
            dto.setId(id);
            JugadorDTO jugadorActualizado = jugadorService.save(dto);
            return new ResponseEntity<>(jugadorActualizado, HttpStatus.OK);
        } catch (NoSuchElementException | IllegalArgumentException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id){
        if (jugadorService.findById(id) == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        jugadorService.deleteById(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
