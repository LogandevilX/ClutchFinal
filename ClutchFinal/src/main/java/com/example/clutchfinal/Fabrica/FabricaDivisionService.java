package com.example.clutchfinal.Fabrica;

import org.springframework.stereotype.Service;
import com.example.clutchfinal.DTO.DivisionDTO;
import com.example.clutchfinal.Model.Division;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FabricaDivisionService {
    public Division createDivision(DivisionDTO dto){
        Division division = new Division();
        division.setId(dto.getId());
        division.setNombreDivision(dto.getNombreDivision());
        return division;
    }

    public DivisionDTO createDivisionDTO(Division division){
        DivisionDTO dto = new DivisionDTO();
        dto.setId(division.getId());
        dto.setNombreDivision(division.getNombreDivision());
        if (division.getCategoria() != null) {
            dto.setCategoriaId(division.getCategoria().getId());
        }
        return dto;
    }

    public List<DivisionDTO> createDivisionesDTO(List<Division> lista){
        return lista.stream().map(this::createDivisionDTO).collect(Collectors.toList());
    }
}
