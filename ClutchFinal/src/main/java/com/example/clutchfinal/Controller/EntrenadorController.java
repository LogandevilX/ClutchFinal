package com.example.clutchfinal.Controller;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.clutchfinal.DTO.EntrenadorDTO;
import com.example.clutchfinal.Service.EntrenadorService;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/clutch/entrenadores")
public class EntrenadorController {
    @Autowired
    private EntrenadorService entrenadorService;

    @GetMapping
    public ResponseEntity<List<EntrenadorDTO>> findAll(){
        return new ResponseEntity<>(entrenadorService.findAll(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EntrenadorDTO> findById(@PathVariable Long id){
        EntrenadorDTO entrenadorDTO = entrenadorService.findById(id);
        if (entrenadorDTO == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(entrenadorDTO, HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<EntrenadorDTO> save(@RequestBody EntrenadorDTO dto){
        try {
            dto.setId(null);
            EntrenadorDTO nuevoEntrenador = entrenadorService.save(dto);
            return new ResponseEntity<>(nuevoEntrenador, HttpStatus.CREATED);
        } catch (NoSuchElementException | IllegalArgumentException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<EntrenadorDTO> update(@PathVariable Long id, @RequestBody EntrenadorDTO dto){
        if (entrenadorService.findById(id) == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        try {
            dto.setId(id);
            EntrenadorDTO entrenadorActualizado = entrenadorService.save(dto);
            return new ResponseEntity<>(entrenadorActualizado, HttpStatus.OK);
        } catch (NoSuchElementException | IllegalArgumentException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id){
        if (entrenadorService.findById(id) == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        entrenadorService.deleteById(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
