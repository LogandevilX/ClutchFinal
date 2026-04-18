package com.example.clutchfinal.Service;

import com.example.clutchfinal.DTO.HistorialPartidoDTO;
import com.example.clutchfinal.Fabrica.FabricaHistorialPartidoService;
import com.example.clutchfinal.Model.Entrenador;
import com.example.clutchfinal.Model.Equipo;
import com.example.clutchfinal.Model.HistorialPartido;
import com.example.clutchfinal.Model.Jugador;
import com.example.clutchfinal.Model.Partido;
import com.example.clutchfinal.Repository.HistorialPartidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HistorialPartidoService {

    @Autowired
    private HistorialPartidoRepository historialPartidoRepository;
    @Autowired
    private FabricaHistorialPartidoService fabricaHistorialPartidoService;

    public HistorialPartido registrarEvento(HistorialPartidoDTO dto, Partido partido, Equipo equipo, Jugador jugador, Entrenador entrenador) {
        HistorialPartido evento = fabricaHistorialPartidoService.createHistorialPartido(dto, partido, equipo, jugador, entrenador);
        return historialPartidoRepository.save(evento);
    }

    public List<HistorialPartidoDTO> findHistorialByPartidoId(Long partidoId) {
        return fabricaHistorialPartidoService.createHistorialPartidosDTO(
                historialPartidoRepository.findAllByPartidoIdOrderByIdAsc(partidoId)
        );
    }

    public List<HistorialPartido> findEventosByPartidoAndJugador(Long partidoId, Long jugadorId) {
        return historialPartidoRepository.findAllByPartidoIdAndJugadorIdOrderByIdAsc(partidoId, jugadorId);
    }
}
