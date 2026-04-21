package com.example.clutchfinal.Controller;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.clutchfinal.DTO.PabellonDTO;
import com.example.clutchfinal.Service.PabellonService;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/clutch/pabellones")
public class PabellonController {
    @Autowired
    private PabellonService pabellonService;

    @GetMapping
    public ResponseEntity<List<PabellonDTO>> findAll(){
        return new ResponseEntity<>(pabellonService.findAll(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PabellonDTO> findById(@PathVariable Long id){
        PabellonDTO pabellonDTO = pabellonService.findById(id);
        if (pabellonDTO == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(pabellonDTO, HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<PabellonDTO> save(@RequestBody PabellonDTO dto){
        try {
            dto.setId(null);
            PabellonDTO nuevoPabellon = pabellonService.save(dto);
            return new ResponseEntity<>(nuevoPabellon, HttpStatus.CREATED);
        } catch (NoSuchElementException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<PabellonDTO> update(@PathVariable Long id, @RequestBody PabellonDTO dto){
        if (pabellonService.findById(id) == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        try {
            dto.setId(id);
            PabellonDTO pabellonActualizado = pabellonService.save(dto);
            return new ResponseEntity<>(pabellonActualizado, HttpStatus.OK);
        } catch (NoSuchElementException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id){
        if (pabellonService.findById(id) == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        pabellonService.deleteById(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
