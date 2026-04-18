package com.example.clutchfinal.Service;

import com.example.clutchfinal.DTO.*;
import com.example.clutchfinal.Model.*;
import com.example.clutchfinal.Repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Objects;

@Service
public class PartidoService {
    @Autowired
    private PartidoRepository partidoRepository;
    @Autowired
    private GrupoRepository grupoRepository;
    @Autowired
    private InscripcionRepository inscripcionRepository;
    @Autowired
    private EquipoRepository equipoRepository;
    @Autowired
    private JugadorRepository jugadorRepository;
    @Autowired
    private EntrenadorRepository entrenadorRepository;
    @Autowired
    private ActaService actaService;
    @Autowired
    private HistorialPartidoService historialPartidoService;

    @Transactional
    public PartidoDTO savePartido(PartidoDTO dto) {
        Partido partido = new Partido();

        if (dto.getId() != null) {
            partido = partidoRepository.findById(dto.getId())
                    .orElseThrow(() -> new NoSuchElementException("Partido no encontrado con ID: " + dto.getId()));
        }

        Grupo grupo = grupoRepository.findById(dto.getGrupoId())
                .orElseThrow(() -> new NoSuchElementException("Grupo no encontrado con ID: " + dto.getGrupoId()));

        Inscripcion inscripcionLocal = inscripcionRepository.findById(dto.getInscripcionLocalId())
                .orElseThrow(() -> new NoSuchElementException("Inscripción local no encontrada."));

        Inscripcion inscripcionVisitante = inscripcionRepository.findById(dto.getInscripcionVisitanteId())
                .orElseThrow(() -> new NoSuchElementException("Inscripción visitante no encontrada."));

        if (Objects.equals(inscripcionLocal.getId(), inscripcionVisitante.getId())) {
            throw new IllegalArgumentException("El equipo local y visitante no pueden ser el mismo.");
        }

        partido.setGrupo(grupo);
        partido.setInscripcionLocal(inscripcionLocal);
        partido.setInscripcionVisitante(inscripcionVisitante);
        partido.setFechaHoraInicio(dto.getFechaHoraInicio() != null ? dto.getFechaHoraInicio() : LocalDateTime.now());
        partido.setFechaHoraFin(dto.getFechaHoraFin());
        partido.setPuntosLocal(dto.getPuntosLocal() != null ? dto.getPuntosLocal() : 0);
        partido.setPuntosVisitante(dto.getPuntosVisitante() != null ? dto.getPuntosVisitante() : 0);
        partido.setPabellonDeJuego(dto.getPabellonDeJuego());

        return toPartidoDTO(partidoRepository.save(partido));
    }

    @Transactional
    public void inicializarActas(Long partidoId) {
        Partido partido = partidoRepository.findById(partidoId)
                .orElseThrow(() -> new NoSuchElementException("Partido no encontrado con ID: " + partidoId));

        Equipo equipoLocal = partido.getInscripcionLocal().getEquipo();
        Equipo equipoVisitante = partido.getInscripcionVisitante().getEquipo();

        actaService.inicializarActasParaEquipo(partido, equipoLocal);
        actaService.inicializarActasParaEquipo(partido, equipoVisitante);
    }

    @Transactional
    @CachePut(value = "estadoPartido", key = "#eventoDTO.partidoId")
    public EstadoPartidoDTO registrarEvento(HistorialPartidoDTO eventoDTO) {
        Partido partido = partidoRepository.findById(eventoDTO.getPartidoId())
                .orElseThrow(() -> new NoSuchElementException("Partido no encontrado."));

        Equipo equipo = equipoRepository.findById(eventoDTO.getEquipoId())
                .orElseThrow(() -> new NoSuchElementException("Equipo no encontrado."));

        Jugador jugador = null;
        if (eventoDTO.getJugadorId() != null) {
            jugador = jugadorRepository.findById(eventoDTO.getJugadorId())
                    .orElseThrow(() -> new NoSuchElementException("Jugador no encontrado."));
        }

        Entrenador entrenador = null;
        if (eventoDTO.getEntrenadorId() != null) {
            entrenador = entrenadorRepository.findById(eventoDTO.getEntrenadorId())
                    .orElseThrow(() -> new NoSuchElementException("Entrenador no encontrado."));
        }

        historialPartidoService.registrarEvento(eventoDTO, partido, equipo, jugador, entrenador);

        if (jugador != null) {
            actaService.aplicarEventoEstadistico(partido, equipo, jugador, eventoDTO);
            partidoRepository.save(partido);
        }

        return construirEstadoPartido(partido.getId());
    }

    @Cacheable(value = "estadoPartido", key = "#partidoId")
    public EstadoPartidoDTO obtenerEstadoPartido(Long partidoId) {
        return construirEstadoPartido(partidoId);
    }

    private EstadoPartidoDTO construirEstadoPartido(Long partidoId) {
        Partido partido = partidoRepository.findById(partidoId)
                .orElseThrow(() -> new NoSuchElementException("Partido no encontrado."));

        List<ActaDTO> actas = actaService.findActasByPartidoId(partidoId);
        List<HistorialPartidoDTO> historial = historialPartidoService.findHistorialByPartidoId(partidoId);

        return new EstadoPartidoDTO(toPartidosResponseDTO(partido), actas, historial);
    }

    public PartidosResponseDTO findPartidoById(Long id) {
        return partidoRepository.findById(id).map(this::toPartidosResponseDTO).orElse(null);
    }

    public List<PartidosResponseDTO> findAllPartidos() {
        return partidoRepository.findAll().stream().map(this::toPartidosResponseDTO).toList();
    }

    @Transactional
    public void deletePartidoById(Long id) {
        Partido partido = partidoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Partido no encontrado con ID: " + id));
        partidoRepository.delete(partido);
    }

    private PartidoDTO toPartidoDTO(Partido p) {
        return new PartidoDTO(
                p.getId(),
                p.getGrupo().getId(),
                p.getInscripcionLocal().getId(),
                p.getInscripcionVisitante().getId(),
                p.getFechaHoraInicio(),
                p.getFechaHoraFin(),
                p.getPuntosLocal(),
                p.getPuntosVisitante(),
                p.getPabellonDeJuego()
        );
    }


    private PartidosResponseDTO toPartidosResponseDTO(Partido p) {
        return new PartidosResponseDTO(
                p.getId(),
                p.getGrupo().getId(),
                toEquipoResponseDTO(p.getInscripcionLocal().getEquipo()),
                toEquipoResponseDTO(p.getInscripcionVisitante().getEquipo()),
                p.getFechaHoraInicio(),
                p.getFechaHoraFin(),
                p.getPuntosLocal(),
                p.getPuntosVisitante(),
                p.getPabellonDeJuego()
        );
    }

    private EquipoResponseDTO toEquipoResponseDTO(Equipo equipo) {
        EquipoResponseDTO dto = new EquipoResponseDTO();
        dto.setId(equipo.getId());
        dto.setNombreEquipo(equipo.getNombreEquipo());
        dto.setPartidosGanados(equipo.getPartidosGanados());
        dto.setPartidosPerdidos(equipo.getPartidosPerdidos());
        dto.setPuntos(equipo.getPuntos());
        dto.setPosicion(equipo.getPosicion());
        dto.setPuntosAFavor(equipo.getPuntosAFavor());
        dto.setPuntosEnContra(equipo.getPuntosEnContra());

        if (equipo.getClub() != null) {
            dto.setUrlEscudo(equipo.getClub().getEscudo() != null ? "/escudos/" + equipo.getClub().getEscudo() : null);
            dto.setDireccion(equipo.getClub().getPabellones().stream()
                    .findFirst()
                    .map(Pabellon::getDireccion)
                    .orElse(null));
        }

        return dto;
    }
}
