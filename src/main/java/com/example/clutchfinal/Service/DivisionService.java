package com.example.clutchfinal.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.clutchfinal.DTO.DivisionDTO;
import com.example.clutchfinal.Fabrica.FabricaDivisionService;
import com.example.clutchfinal.Model.Categoria;
import com.example.clutchfinal.Model.Division;
import com.example.clutchfinal.Repository.CategoriaRepository;
import com.example.clutchfinal.Repository.DivisionRepository;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class DivisionService {
    @Autowired
    private FabricaDivisionService fabricaDivisionService;
    @Autowired
    private DivisionRepository divisionRepository;
    @Autowired
    private CategoriaRepository categoriaRepository;

    public DivisionDTO save(DivisionDTO dto){
        Division division = fabricaDivisionService.createDivision(dto);

        Optional<Categoria> categoriaOpt = categoriaRepository.findById(dto.getCategoriaId());
        if (categoriaOpt.isEmpty()) {
            throw new NoSuchElementException("Categoria no encontrada con ID: " + dto.getCategoriaId());
        }
        division.setCategoria(categoriaOpt.get());

        return fabricaDivisionService.createDivisionDTO(divisionRepository.save(division));
    }

    public DivisionDTO findById(Long id){
        return divisionRepository.findById(id)
                .map(fabricaDivisionService::createDivisionDTO)
                .orElse(null);
    }

    public List<DivisionDTO> findAll(){
        return fabricaDivisionService.createDivisionesDTO(divisionRepository.findAll());
    }

    public void deleteById(Long id){
        divisionRepository.deleteById(id);
    }
}
