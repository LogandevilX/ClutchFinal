package com.example.clutchfinal.Fabrica;

import org.springframework.stereotype.Service;
import com.example.clutchfinal.DTO.FaseDTO;
import com.example.clutchfinal.Model.Fase;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FabricaFaseService {
    public Fase createFase(FaseDTO dto){
        Fase fase = new Fase();
        fase.setId(dto.getId());
        fase.setNombreFase(dto.getNombreFase());
        fase.setFechaInicio(dto.getFechaInicio());
        fase.setFechaFin(dto.getFechaFin());
        return fase;
    }

    public FaseDTO createFaseDTO(Fase fase){
        FaseDTO dto = new FaseDTO();
        dto.setId(fase.getId());
        dto.setNombreFase(fase.getNombreFase());
        dto.setFechaInicio(fase.getFechaInicio());
        dto.setFechaFin(fase.getFechaFin());
        if (fase.getDivision() != null) {
            dto.setDivisionId(fase.getDivision().getId());
        }
        return dto;
    }

    public List<FaseDTO> createFasesDTO(List<Fase> lista){
        return lista.stream().map(this::createFaseDTO).collect(Collectors.toList());
    }
}
