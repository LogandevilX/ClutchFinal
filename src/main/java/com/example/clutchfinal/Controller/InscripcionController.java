package com.example.clutchfinal.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.clutchfinal.DTO.InscripcionDTO;
import com.example.clutchfinal.Service.InscripcionService;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/clutch/inscripciones")
public class InscripcionController {
    @Autowired
    private InscripcionService inscripcionService;

    @GetMapping
    public ResponseEntity<List<InscripcionDTO>> findAll(){
        return new ResponseEntity<>(inscripcionService.findAll(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<InscripcionDTO> findById(@PathVariable Long id){
        InscripcionDTO inscripcionDTO = inscripcionService.findById(id);
        if (inscripcionDTO == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(inscripcionDTO, HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<InscripcionDTO> save(@RequestBody InscripcionDTO dto){
        try {
            dto.setId(null);
            InscripcionDTO nuevaInscripcion = inscripcionService.save(dto);
            return new ResponseEntity<>(nuevaInscripcion, HttpStatus.CREATED);
        } catch (NoSuchElementException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<InscripcionDTO> update(@PathVariable Long id, @RequestBody InscripcionDTO dto){
        if (inscripcionService.findById(id) == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        try {
            dto.setId(id);
            InscripcionDTO inscripcionActualizada = inscripcionService.save(dto);
            return new ResponseEntity<>(inscripcionActualizada, HttpStatus.OK);
        } catch (NoSuchElementException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id){
        if (inscripcionService.findById(id) == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        inscripcionService.deleteById(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
