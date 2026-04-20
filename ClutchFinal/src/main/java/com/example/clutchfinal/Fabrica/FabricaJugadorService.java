package com.example.clutchfinal.Fabrica;

import org.springframework.stereotype.Service;
import com.example.clutchfinal.DTO.JugadorDTO;
import com.example.clutchfinal.DTO.JugadorResponseDTO;
import com.example.clutchfinal.Model.Jugador;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FabricaJugadorService {
    public Jugador createJugador(JugadorDTO dto){
        Jugador jugador = new Jugador();
        jugador.setId(dto.getId());
        jugador.setDni(dto.getDni());
        jugador.setNombre(dto.getNombre());
        jugador.setPrimerApellido(dto.getPrimerApellido());
        jugador.setSegundoApellido(dto.getSegundoApellido());
        jugador.setFechaNacimiento(dto.getFechaNacimiento());
        jugador.setGenero(dto.getGenero());
        jugador.setFoto(dto.getFoto());
        return jugador;
    }

    public JugadorDTO createJugadorDTO(Jugador jugador){
        JugadorDTO dto = new JugadorDTO();
        dto.setId(jugador.getId());
        dto.setDni(jugador.getDni());
        dto.setNombre(jugador.getNombre());
        dto.setPrimerApellido(jugador.getPrimerApellido());
        dto.setSegundoApellido(jugador.getSegundoApellido());
        dto.setFechaNacimiento(jugador.getFechaNacimiento());
        dto.setGenero(jugador.getGenero());
        dto.setFoto(jugador.getFoto());
        if (jugador.getClub() != null) {
            dto.setClubId(jugador.getClub().getId());
        }
        dto.setEquipoIds(
                jugador.getEquipos().stream()
                        .map(equipo -> equipo.getId())
                        .collect(Collectors.toSet())
        );
        return dto;
    }

    public JugadorResponseDTO createResponseDTO(Jugador jugador){
        JugadorResponseDTO dto = new JugadorResponseDTO();
        dto.setId(jugador.getId());
        dto.setDni(jugador.getDni());
        dto.setNombre(jugador.getNombre());
        dto.setPrimerApellido(jugador.getPrimerApellido());
        dto.setSegundoApellido(jugador.getSegundoApellido());
        // Nos aseguramos de que la respuesta contenga la ruta relativa de la foto
        if(jugador.getFoto() != null)
            dto.setPathFoto("/perfiles/" + jugador.getFoto());

        if (jugador.getClub() != null) {
            dto.setClubId(jugador.getClub().getId());
        }
        return dto;
    }

    public List<JugadorResponseDTO> createJugadoresDTO(List<Jugador> lista){
        return lista.stream().map(this::createResponseDTO).collect(Collectors.toList());
    }
}
