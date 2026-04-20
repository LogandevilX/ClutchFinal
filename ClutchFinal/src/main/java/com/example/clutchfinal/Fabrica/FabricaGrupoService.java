package com.example.clutchfinal.Fabrica;

import org.springframework.stereotype.Service;
import com.example.clutchfinal.DTO.GrupoDTO;
import com.example.clutchfinal.Model.Grupo;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FabricaGrupoService {
    public Grupo createGrupo(GrupoDTO dto){
        Grupo grupo = new Grupo();
        grupo.setId(dto.getId());
        grupo.setNombreGrupo(dto.getNombreGrupo());
        return grupo;
    }

    public GrupoDTO createGrupoDTO(Grupo grupo){
        GrupoDTO dto = new GrupoDTO();
        dto.setId(grupo.getId());
        dto.setNombreGrupo(grupo.getNombreGrupo());
        if (grupo.getFase() != null) {
            dto.setFaseId(grupo.getFase().getId());
        }
        return dto;
    }

    public List<GrupoDTO> createGruposDTO(List<Grupo> lista){
        return lista.stream().map(this::createGrupoDTO).collect(Collectors.toList());
    }
}
