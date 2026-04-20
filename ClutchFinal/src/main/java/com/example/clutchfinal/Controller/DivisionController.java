package com.example.clutchfinal.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.clutchfinal.DTO.DivisionDTO;
import com.example.clutchfinal.Service.DivisionService;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/clutch/divisiones")
public class DivisionController {
    @Autowired
    private DivisionService divisionService;

    @GetMapping
    public ResponseEntity<List<DivisionDTO>> findAll(){
        return new ResponseEntity<>(divisionService.findAll(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DivisionDTO> findById(@PathVariable Long id){
        DivisionDTO divisionDTO = divisionService.findById(id);
        if (divisionDTO == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(divisionDTO, HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<DivisionDTO> save(@RequestBody DivisionDTO dto){
        try {
            dto.setId(null);
            DivisionDTO nuevaDivision = divisionService.save(dto);
            return new ResponseEntity<>(nuevaDivision, HttpStatus.CREATED);
        } catch (NoSuchElementException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<DivisionDTO> update(@PathVariable Long id, @RequestBody DivisionDTO dto){
        if (divisionService.findById(id) == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        try {
            dto.setId(id);
            DivisionDTO divisionActualizada = divisionService.save(dto);
            return new ResponseEntity<>(divisionActualizada, HttpStatus.OK);
        } catch (NoSuchElementException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id){
        if (divisionService.findById(id) == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        divisionService.deleteById(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
