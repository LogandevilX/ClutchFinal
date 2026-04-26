package com.example.clutchfinal.Fabrica;

import com.example.clutchfinal.DTO.ParcialPartidoDTO;
import com.example.clutchfinal.DTO.PartidoDTO;
import com.example.clutchfinal.DTO.PartidosResponseDTO;
import com.example.clutchfinal.DTO.EntrenadorDTO;
import com.example.clutchfinal.DTO.JugadorResponseDTO;
import com.example.clutchfinal.Model.Equipo;
import com.example.clutchfinal.Model.Partido;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class FabricaPartidoService {

    @Autowired
    private FabricaEquipoService fabricaEquipoService;
    @Autowired
    private FabricaEntrenadorService fabricaEntrenadorService;
    @Autowired
    private FabricaJugadorService fabricaJugadorService;

    public PartidoDTO toPartidoDTO(Partido partido) {
        return new PartidoDTO(
                partido.getId(),
                partido.getGrupo().getId(),
                partido.getInscripcionLocal().getId(),
                partido.getInscripcionVisitante().getId(),
                partido.getUsuario().getId(),
                partido.getJornada(),
                partido.getFechaHoraInicio(),
                partido.getFechaHoraFin(),
                partido.getPuntosLocal(),
                partido.getPuntosVisitante(),
                partido.getPabellonDeJuego(),
                partido.getEstado()
        );
    }

    public PartidosResponseDTO createPartidoResponseDTO(Partido partido) {
        Equipo equipoLocal = partido.getInscripcionLocal().getEquipo();
        Equipo equipoVisitante = partido.getInscripcionVisitante().getEquipo();

        String escudoLocal = partido.getInscripcionLocal().getEquipo().getClub() != null
                ? partido.getInscripcionLocal().getEquipo().getClub().getEscudo()
                : null;
        String direccionLocal = partido.getInscripcionLocal().getEquipo().getClub() != null
                ? partido.getInscripcionLocal().getEquipo().getClub().getPabellones().stream()
                .findFirst()
                .map(pabellon -> pabellon.getDireccion())
                .orElse(null)
                : null;

        String escudoVisitante = partido.getInscripcionVisitante().getEquipo().getClub() != null
                ? partido.getInscripcionVisitante().getEquipo().getClub().getEscudo()
                : null;
        String direccionVisitante = partido.getInscripcionVisitante().getEquipo().getClub() != null
                ? partido.getInscripcionVisitante().getEquipo().getClub().getPabellones().stream()
                .findFirst()
                .map(pabellon -> pabellon.getDireccion())
                .orElse(null)
                : null;

        List<ParcialPartidoDTO> parcialesDTO = partido.getParciales() != null
                ? partido.getParciales().stream()
                .map(parcial -> new ParcialPartidoDTO(parcial.getPeriodo(), parcial.getPuntosLocal(), parcial.getPuntosVisitante()))
                .toList()
                : new ArrayList<>();

        List<EntrenadorDTO> entrenadoresLocal = equipoLocal.getEntrenadores().stream()
                .map(fabricaEntrenadorService::createEntrenadorDTO)
                .toList();
        List<EntrenadorDTO> entrenadoresVisitante = equipoVisitante.getEntrenadores().stream()
                .map(fabricaEntrenadorService::createEntrenadorDTO)
                .toList();

        List<JugadorResponseDTO> jugadoresLocal = equipoLocal.getJugadores().stream()
                .map(fabricaJugadorService::createResponseDTO)
                .toList();
        List<JugadorResponseDTO> jugadoresVisitante = equipoVisitante.getJugadores().stream()
                .map(fabricaJugadorService::createResponseDTO)
                .toList();

        return new PartidosResponseDTO(
                partido.getId(),
                partido.getGrupo().getId(),
                fabricaEquipoService.createEquipoDetalleDTO(equipoLocal, escudoLocal, direccionLocal, entrenadoresLocal, jugadoresLocal),
                fabricaEquipoService.createEquipoDetalleDTO(equipoVisitante, escudoVisitante, direccionVisitante, entrenadoresVisitante, jugadoresVisitante),
                partido.getJornada(),
                partido.getFechaHoraInicio(),
                partido.getFechaHoraFin(),
                partido.getPuntosLocal(),
                partido.getPuntosVisitante(),
                partido.getPabellonDeJuego(),
                partido.getPeriodoActual(),
                parcialesDTO,
                partido.getEstado()
        );
    }
}
