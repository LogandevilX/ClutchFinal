package com.example.clutchfinal.Controller;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.clutchfinal.DTO.FaseDTO;
import com.example.clutchfinal.Service.FaseService;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/clutch/fases")
public class FaseController {
    @Autowired
    private FaseService faseService;

    @GetMapping
    public ResponseEntity<List<FaseDTO>> findAll(){
        return new ResponseEntity<>(faseService.findAll(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FaseDTO> findById(@PathVariable Long id){
        FaseDTO faseDTO = faseService.findById(id);
        if (faseDTO == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(faseDTO, HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<FaseDTO> save(@RequestBody FaseDTO dto){
        try {
            dto.setId(null);
            FaseDTO nuevaFase = faseService.save(dto);
            return new ResponseEntity<>(nuevaFase, HttpStatus.CREATED);
        } catch (NoSuchElementException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<FaseDTO> update(@PathVariable Long id, @RequestBody FaseDTO dto){
        if (faseService.findById(id) == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        try {
            dto.setId(id);
            FaseDTO faseActualizada = faseService.save(dto);
            return new ResponseEntity<>(faseActualizada, HttpStatus.OK);
        } catch (NoSuchElementException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id){
        if (faseService.findById(id) == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        faseService.deleteById(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
