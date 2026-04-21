package com.example.clutchfinal.Controller;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.clutchfinal.DTO.GrupoDTO;
import com.example.clutchfinal.Service.GrupoService;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/clutch/grupos")
public class GrupoController {
    @Autowired
    private GrupoService grupoService;

    @GetMapping
    public ResponseEntity<List<GrupoDTO>> findAll(){
        return new ResponseEntity<>(grupoService.findAll(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<GrupoDTO> findById(@PathVariable Long id){
        GrupoDTO grupoDTO = grupoService.findById(id);
        if (grupoDTO == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(grupoDTO, HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<GrupoDTO> save(@RequestBody GrupoDTO dto){
        try {
            dto.setId(null);
            GrupoDTO nuevoGrupo = grupoService.save(dto);
            return new ResponseEntity<>(nuevoGrupo, HttpStatus.CREATED);
        } catch (NoSuchElementException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<GrupoDTO> update(@PathVariable Long id, @RequestBody GrupoDTO dto){
        if (grupoService.findById(id) == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        try {
            dto.setId(id);
            GrupoDTO grupoActualizado = grupoService.save(dto);
            return new ResponseEntity<>(grupoActualizado, HttpStatus.OK);
        } catch (NoSuchElementException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id){
        if (grupoService.findById(id) == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        grupoService.deleteById(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
