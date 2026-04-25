package com.example.clutchfinal.Controller;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.clutchfinal.DTO.EquipoDTO;
import com.example.clutchfinal.DTO.EquipoDetalleDTO;
import com.example.clutchfinal.Service.EquipoService;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/clutch/equipos")
public class EquipoController {
    @Autowired
    private EquipoService equipoService;

    @GetMapping
    public ResponseEntity<List<EquipoDetalleDTO>> findAll(){
        return new ResponseEntity<>(equipoService.findAll(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EquipoDetalleDTO> findById(@PathVariable Long id){
        EquipoDetalleDTO equipoDTO = equipoService.findById(id);
        if (equipoDTO == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(equipoDTO, HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<EquipoDTO> save(@RequestBody EquipoDTO dto){
        try {
            dto.setId(null);
            EquipoDTO nuevoEquipo = equipoService.save(dto);
            return new ResponseEntity<>(nuevoEquipo, HttpStatus.CREATED);
        } catch (NoSuchElementException | IllegalArgumentException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<EquipoDTO> update(@PathVariable Long id, @RequestBody EquipoDTO dto){
        if (equipoService.findById(id) == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        try {
            EquipoDTO equipoActualizado = equipoService.update(id, dto);
            return new ResponseEntity<>(equipoActualizado, HttpStatus.OK);
        } catch (NoSuchElementException | IllegalArgumentException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id){
        if (equipoService.findById(id) == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        equipoService.deleteById(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
