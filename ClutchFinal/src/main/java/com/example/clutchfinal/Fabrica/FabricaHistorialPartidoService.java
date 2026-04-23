package com.example.clutchfinal.Fabrica;

import com.example.clutchfinal.DTO.HistorialPartidoDTO;
import com.example.clutchfinal.Model.Entrenador;
import com.example.clutchfinal.Model.Equipo;
import com.example.clutchfinal.Model.HistorialPartido;
import com.example.clutchfinal.Model.Jugador;
import com.example.clutchfinal.Model.Partido;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FabricaHistorialPartidoService {

    public HistorialPartido createHistorialPartido(HistorialPartidoDTO dto, Partido partido, Equipo equipo, Jugador jugador, Entrenador entrenador) {
        HistorialPartido historialPartido = new HistorialPartido();
        historialPartido.setId(dto.getId());
        historialPartido.setPartido(partido);
        historialPartido.setEquipo(equipo);
        historialPartido.setJugador(jugador);
        historialPartido.setEntrenador(entrenador);
        historialPartido.setTipoEvento(dto.getTipoEvento());
        historialPartido.setAcierto(dto.getAcierto());
        historialPartido.setPeriodo(dto.getPeriodo());
        historialPartido.setMinuto(dto.getMinuto());
        historialPartido.setSegundo(dto.getSegundo());
        historialPartido.setPosicion(dto.getPosicion());
        return historialPartido;
    }

    public HistorialPartidoDTO createHistorialPartidoDTO(HistorialPartido historialPartido) {
        return new HistorialPartidoDTO(
                historialPartido.getId(),
                historialPartido.getPartido().getId(),
                historialPartido.getEquipo().getId(),
                historialPartido.getJugador() != null ? historialPartido.getJugador().getId() : null,
                historialPartido.getEntrenador() != null ? historialPartido.getEntrenador().getId() : null,
                historialPartido.getTipoEvento(),
                historialPartido.getAcierto(),
                historialPartido.getPeriodo(),
                historialPartido.getMinuto(),
                historialPartido.getSegundo(),
                historialPartido.getPosicion()
        );
    }

    public List<HistorialPartidoDTO> createHistorialPartidosDTO(List<HistorialPartido> eventos) {
        return eventos.stream().map(this::createHistorialPartidoDTO).collect(Collectors.toList());
    }
}
