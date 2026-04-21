package com.example.clutchfinal.Controller;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.clutchfinal.DTO.ClubDTO;
import com.example.clutchfinal.DTO.ClubResponseDTO;
import com.example.clutchfinal.Service.ClubService;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/clutch/clubes")
public class ClubController {
    @Autowired
    private ClubService clubService;

    @GetMapping
    public ResponseEntity<List<ClubResponseDTO>> findAll(){
        return new ResponseEntity<>(clubService.findAll(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClubResponseDTO> findById(@PathVariable Long id){
        ClubResponseDTO clubDTO = clubService.findById(id);
        if (clubDTO == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(clubDTO, HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<ClubDTO> save(@RequestBody ClubDTO dto){
        try {
            dto.setId(null);
            ClubDTO nuevoClub = clubService.save(dto);
            return new ResponseEntity<>(nuevoClub, HttpStatus.CREATED);
        } catch (NoSuchElementException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClubDTO> update(@PathVariable Long id, @RequestBody ClubDTO dto){
        if (clubService.findById(id) == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        try {
            dto.setId(id);
            ClubDTO clubActualizado = clubService.save(dto);
            return new ResponseEntity<>(clubActualizado, HttpStatus.OK);
        } catch (NoSuchElementException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id){
        if (clubService.findById(id) == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        clubService.deleteById(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
