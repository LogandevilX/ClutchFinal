package com.example.clutchfinal.Fabrica;

import org.springframework.stereotype.Service;
import com.example.clutchfinal.DTO.EquipoDTO;
import com.example.clutchfinal.DTO.EquipoResponseDTO;
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
        dto.setJugadorIds(
                equipo.getJugadores().stream()
                        .map(jugador -> jugador.getId())
                        .toList()
        );
        dto.setEntrenadorIds(
                equipo.getEntrenadores().stream()
                        .map(entrenador -> entrenador.getId())
                        .toList()
        );
        return dto;
    }

    public EquipoResponseDTO createEquipoResponseDTO(Equipo equipo, String escudo, String pabellonDireccion){
        EquipoResponseDTO dto = new EquipoResponseDTO();
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
        return dto;
    }

    public List<EquipoDTO> createEquiposDTO(List<Equipo> lista){
        return lista.stream().map(this::createEquipoDTO).collect(Collectors.toList());
    }
}
