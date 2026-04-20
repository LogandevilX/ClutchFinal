package com.example.clutchfinal.Fabrica;

import org.springframework.stereotype.Service;
import com.example.clutchfinal.DTO.EntrenadorDTO;
import com.example.clutchfinal.Model.Entrenador;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FabricaEntrenadorService {
    public Entrenador createEntrenador(EntrenadorDTO dto){
        Entrenador entrenador = new Entrenador();
        entrenador.setId(dto.getId());
        entrenador.setDni(dto.getDni());
        entrenador.setNombre(dto.getNombre());
        entrenador.setPrimerApellido(dto.getPrimerApellido());
        entrenador.setSegundoApellido(dto.getSegundoApellido());
        entrenador.setTelefono(dto.getTelefono());
        entrenador.setFechaNacimiento(dto.getFechaNacimiento());
        entrenador.setTitulo(dto.getTitulo());
        return entrenador;
    }

    public EntrenadorDTO createEntrenadorDTO(Entrenador entrenador){
        EntrenadorDTO dto = new EntrenadorDTO();
        dto.setId(entrenador.getId());
        dto.setDni(entrenador.getDni());
        dto.setNombre(entrenador.getNombre());
        dto.setPrimerApellido(entrenador.getPrimerApellido());
        dto.setSegundoApellido(entrenador.getSegundoApellido());
        dto.setTelefono(entrenador.getTelefono());
        dto.setFechaNacimiento(entrenador.getFechaNacimiento());
        dto.setTitulo(entrenador.getTitulo());
        if (entrenador.getEquipo() != null) {
            dto.setEquipoId(entrenador.getEquipo().getId());
        }
        return dto;
    }

    public List<EntrenadorDTO> createEntrenadoresDTO(List<Entrenador> lista){
        return lista.stream().map(this::createEntrenadorDTO).collect(Collectors.toList());
    }
}
