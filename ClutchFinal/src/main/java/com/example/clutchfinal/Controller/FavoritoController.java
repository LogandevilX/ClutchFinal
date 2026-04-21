package com.example.clutchfinal.Controller;
import com.example.clutchfinal.DTO.FavoritoDTO;
import com.example.clutchfinal.Service.FavoritoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/clutch/favoritos")
public class FavoritoController {

    @Autowired
    private FavoritoService favoritoService;

    @GetMapping
    public ResponseEntity<List<FavoritoDTO>> findAll() {
        return new ResponseEntity<>(favoritoService.findAll(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FavoritoDTO> findById(@PathVariable Long id) {
        FavoritoDTO favorito = favoritoService.findById(id);
        if (favorito == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(favorito, HttpStatus.OK);
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<FavoritoDTO>> findByUsuarioId(@PathVariable Long usuarioId) {
        return new ResponseEntity<>(favoritoService.findByUsuarioId(usuarioId), HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<FavoritoDTO> save(@RequestBody FavoritoDTO dto) {
        try {
            dto.setId(null);
            return new ResponseEntity<>(favoritoService.save(dto), HttpStatus.CREATED);
        } catch (NoSuchElementException | IllegalArgumentException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<FavoritoDTO> update(@PathVariable Long id, @RequestBody FavoritoDTO dto) {
        if (favoritoService.findById(id) == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        try {
            dto.setId(id);
            return new ResponseEntity<>(favoritoService.save(dto), HttpStatus.OK);
        } catch (NoSuchElementException | IllegalArgumentException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (favoritoService.findById(id) == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        favoritoService.deleteById(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
