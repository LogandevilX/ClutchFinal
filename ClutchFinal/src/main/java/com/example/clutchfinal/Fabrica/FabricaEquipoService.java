package com.example.clutchfinal.Fabrica;

import org.springframework.stereotype.Service;
import com.example.clutchfinal.DTO.EquipoDTO;
import com.example.clutchfinal.DTO.EquipoDetalleDTO;
import com.example.clutchfinal.DTO.EntrenadorDTO;
import com.example.clutchfinal.DTO.JugadorResponseDTO;
import com.example.clutchfinal.Model.Equipo;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FabricaEquipoService {
    public Equipo createEquipo(EquipoDTO dto){
        Equipo equipo = new Equipo();
        equipo.setId(dto.getId());
        equipo.setNombreEquipo(dto.getNombreEquipo());
        if(dto.getPartidosGanados() != null){
            equipo.setPartidosGanados(dto.getPartidosGanados());
        }else {
            equipo.setPartidosGanados(0);
        }

        if(dto.getPartidosPerdidos() != null){
            equipo.setPartidosPerdidos(dto.getPartidosPerdidos());
        }else {
            equipo.setPartidosPerdidos(0);
        }

        if(dto.getPuntos() != null){
            equipo.setPuntos(dto.getPuntos());
        }else {
            equipo.setPuntos(0);
        }

        equipo.setPosicion(dto.getPosicion());

        if(dto.getPuntosAFavor() != null){
            equipo.setPuntosAFavor(dto.getPuntosAFavor());
        }else {
            equipo.setPuntosAFavor(BigDecimal.ZERO);
        }

        if(dto.getPuntos() != null){
            equipo.setPuntosEnContra(dto.getPuntosEnContra());
        }else {
            equipo.setPuntosEnContra(BigDecimal.ZERO);
        }
        return equipo;
    }

    public EquipoDTO createEquipoDTO(Equipo equipo){
        EquipoDTO dto = new EquipoDTO();
        dto.setId(equipo.getId());
        dto.setNombreEquipo(equipo.getNombreEquipo());
        if(dto.getPartidosGanados() != null){
            equipo.setPartidosGanados(dto.getPartidosGanados());
        }else {
            equipo.setPartidosGanados(0);
        }

        if(dto.getPartidosPerdidos() != null){
            equipo.setPartidosPerdidos(dto.getPartidosPerdidos());
        }else {
            equipo.setPartidosPerdidos(0);
        }

        if(dto.getPuntos() != null){
            equipo.setPuntos(dto.getPuntos());
        }else {
            equipo.setPuntos(0);
        }

        equipo.setPosicion(dto.getPosicion());

        if(dto.getPuntosAFavor() != null){
            equipo.setPuntosAFavor(dto.getPuntosAFavor());
        }else {
            equipo.setPuntosAFavor(BigDecimal.ZERO);
        }

        if(dto.getPuntos() != null){
            equipo.setPuntosEnContra(dto.getPuntosEnContra());
        }else {
            equipo.setPuntosEnContra(BigDecimal.ZERO);
        }
        if (equipo.getClub() != null) {
            dto.setClubId(equipo.getClub().getId());
        }
        dto.setEntrenadorIds(
                equipo.getEntrenadores().stream()
                        .map(entrenador -> entrenador.getId())
                        .collect(Collectors.toSet())
        );
        dto.setJugadorIds(
                equipo.getJugadores().stream()
                        .map(jugador -> jugador.getId())
                        .collect(Collectors.toSet())
        );
        return dto;
    }

    public EquipoDetalleDTO createEquipoDetalleBasicoDTO(Equipo equipo, String escudo, String pabellonDireccion){
        EquipoDetalleDTO dto = new EquipoDetalleDTO();
        dto.setId(equipo.getId());
        dto.setNombreEquipo(equipo.getNombreEquipo());
        dto.setPartidosGanados(equipo.getPartidosGanados());
        dto.setPartidosPerdidos(equipo.getPartidosPerdidos());
        dto.setPuntos(equipo.getPuntos());
        dto.setPosicion(equipo.getPosicion());
        dto.setPuntosAFavor(equipo.getPuntosAFavor());
        dto.setPuntosEnContra(equipo.getPuntosEnContra());

        if(escudo != null)
            dto.setUrlEscudo("/escudos/" + escudo);

        dto.setDireccion(pabellonDireccion);
        dto.setEntrenadores(List.of());
        dto.setJugadores(List.of());
        return dto;
    }


    public EquipoDetalleDTO createEquipoDetalleDTO(Equipo equipo, String escudo, String pabellonDireccion,
                                                   List<EntrenadorDTO> entrenadores, List<JugadorResponseDTO> jugadores){
        EquipoDetalleDTO dto = new EquipoDetalleDTO();
        dto.setId(equipo.getId());
        dto.setNombreEquipo(equipo.getNombreEquipo());
        dto.setPartidosGanados(equipo.getPartidosGanados());
        dto.setPartidosPerdidos(equipo.getPartidosPerdidos());
        dto.setPuntos(equipo.getPuntos());
        dto.setPosicion(equipo.getPosicion());
        dto.setPuntosAFavor(equipo.getPuntosAFavor());
        dto.setPuntosEnContra(equipo.getPuntosEnContra());

        if(escudo != null)
            dto.setUrlEscudo("/escudos/" + escudo);

        dto.setDireccion(pabellonDireccion);
        dto.setEntrenadores(entrenadores);
        dto.setJugadores(jugadores);
        return dto;
    }

    public List<EquipoDTO> createEquiposDTO(List<Equipo> lista){
        return lista.stream().map(this::createEquipoDTO).collect(Collectors.toList());
    }
}
