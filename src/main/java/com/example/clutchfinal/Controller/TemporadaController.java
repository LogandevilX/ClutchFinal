package com.example.clutchfinal.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.clutchfinal.DTO.TemporadaDTO;
import com.example.clutchfinal.Service.TemporadaService;

import java.util.List;

@RestController
@RequestMapping("/clutch/temporadas")
public class TemporadaController {
    @Autowired
    private TemporadaService temporadaService;

    @GetMapping
    public ResponseEntity<List<TemporadaDTO>> findAll(){
        return new ResponseEntity<>(temporadaService.findAll(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TemporadaDTO> findById(@PathVariable Long id){
        TemporadaDTO temporadaDTO = temporadaService.findById(id);
        if (temporadaDTO == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(temporadaDTO, HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<TemporadaDTO> save(@RequestBody TemporadaDTO dto){
        dto.setId(null);
        TemporadaDTO nuevaTemporada = temporadaService.save(dto);
        return new ResponseEntity<>(nuevaTemporada, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TemporadaDTO> update(@PathVariable Long id, @RequestBody TemporadaDTO dto){
        if (temporadaService.findById(id) == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        dto.setId(id);
        TemporadaDTO temporadaActualizada = temporadaService.save(dto);
        return new ResponseEntity<>(temporadaActualizada, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id){
        if (temporadaService.findById(id) == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        temporadaService.deleteById(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
