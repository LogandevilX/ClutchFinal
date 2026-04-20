package com.example.clutchfinal.Fabrica;

import org.springframework.stereotype.Service;
import com.example.clutchfinal.DTO.InscripcionDTO;
import com.example.clutchfinal.Model.Inscripcion;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FabricaInscripcionService {
    public Inscripcion createInscripcion(InscripcionDTO dto){
        Inscripcion inscripcion = new Inscripcion();
        inscripcion.setId(dto.getId());
        inscripcion.setFechaInscripcion(dto.getFechaInscripcion());
        return inscripcion;
    }

    public InscripcionDTO createInscripcionDTO(Inscripcion inscripcion){
        InscripcionDTO dto = new InscripcionDTO();
        dto.setId(inscripcion.getId());
        dto.setFechaInscripcion(inscripcion.getFechaInscripcion());
        if (inscripcion.getFase() != null) {
            dto.setFaseId(inscripcion.getFase().getId());
        }
        if (inscripcion.getGrupo() != null) {
            dto.setGrupoId(inscripcion.getGrupo().getId());
        }
        if (inscripcion.getEquipo() != null) {
            dto.setEquipoId(inscripcion.getEquipo().getId());
        }
        return dto;
    }

    public List<InscripcionDTO> createInscripcionesDTO(List<Inscripcion> lista){
        return lista.stream().map(this::createInscripcionDTO).collect(Collectors.toList());
    }
}
