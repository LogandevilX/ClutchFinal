package com.example.clutchfinal.Service;

import com.example.clutchfinal.DTO.*;
import com.example.clutchfinal.Model.*;
import com.example.clutchfinal.Repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class PartidoService {
    @Autowired
    private PartidoRepository partidoRepository;
    @Autowired
    private GrupoRepository grupoRepository;
    @Autowired
    private InscripcionRepository inscripcionRepository;
    @Autowired
    private ActaRepository actaRepository;
    @Autowired
    private HistorialPartidoRepository historialPartidoRepository;
    @Autowired
    private EquipoRepository equipoRepository;
    @Autowired
    private JugadorRepository jugadorRepository;
    @Autowired
    private EntrenadorRepository entrenadorRepository;

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

        crearActasSiNoExisten(partido, equipoLocal);
        crearActasSiNoExisten(partido, equipoVisitante);
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

        HistorialPartido evento = new HistorialPartido();
        evento.setPartido(partido);
        evento.setEquipo(equipo);
        evento.setJugador(jugador);
        evento.setEntrenador(entrenador);
        evento.setTipoEvento(eventoDTO.getTipoEvento());
        evento.setAcierto(eventoDTO.getAcierto());
        evento.setPeriodo(eventoDTO.getPeriodo());
        evento.setMinuto(eventoDTO.getMinuto());
        evento.setPosicion(eventoDTO.getPosicion());
        historialPartidoRepository.save(evento);

        if (jugador != null) {
            Acta acta = actaRepository.findByPartidoIdAndJugadorId(partido.getId(), jugador.getId())
                    .orElseGet(() -> crearActa(partido, equipo, jugador));
            aplicarEventoEstadistico(partido, equipo, acta, eventoDTO);
            acta.setMinutosJugados(calcularMinutosJugados(partido.getId(), jugador.getId()));
            actaRepository.save(acta);
            partidoRepository.save(partido);
        }

        return construirEstadoPartido(partido.getId());
    }

    @Cacheable(value = "estadoPartido", key = "#partidoId")
    public EstadoPartidoDTO obtenerEstadoPartido(Long partidoId) {
        return construirEstadoPartido(partidoId);
    }

    private void crearActasSiNoExisten(Partido partido, Equipo equipo) {
        for (Jugador jugador : equipo.getJugadores()) {
            actaRepository.findByPartidoIdAndJugadorId(partido.getId(), jugador.getId())
                    .orElseGet(() -> actaRepository.save(crearActa(partido, equipo, jugador)));
        }
    }

    private Acta crearActa(Partido partido, Equipo equipo, Jugador jugador) {
        Acta acta = new Acta();
        acta.setPartido(partido);
        acta.setEquipo(equipo);
        acta.setJugador(jugador);
        return acta;
    }

    private void aplicarEventoEstadistico(Partido partido, Equipo equipo, Acta acta, HistorialPartidoDTO eventoDTO) {
        String tipoEvento = eventoDTO.getTipoEvento() == null ? "" : eventoDTO.getTipoEvento().toUpperCase(Locale.ROOT);
        boolean acierto = eventoDTO.getAcierto() != null && eventoDTO.getAcierto().equalsIgnoreCase("SI");

        switch (tipoEvento) {
            case "TL" -> {
                acta.setTlTirados(acta.getTlTirados() + 1);
                if (acierto) {
                    acta.setTlAnotados(acta.getTlAnotados() + 1);
                    sumarPuntos(acta, partido, equipo, 1);
                }
            }
            case "T2" -> {
                acta.setT2Tirados(acta.getT2Tirados() + 1);
                if (acierto) {
                    acta.setT2Anotados(acta.getT2Anotados() + 1);
                    sumarPuntos(acta, partido, equipo, 2);
                }
            }
            case "TRIPLE" -> {
                acta.setTriplesTirados(acta.getTriplesTirados() + 1);
                if (acierto) {
                    acta.setTriplesAnotados(acta.getTriplesAnotados() + 1);
                    sumarPuntos(acta, partido, equipo, 3);
                }
            }
            case "REBOTE" -> acta.setRebotes(acta.getRebotes() + 1);
            case "TAPON" -> acta.setTapones(acta.getTapones() + 1);
            case "ROBO" -> acta.setRobos(acta.getRobos() + 1);
            case "PERDIDA" -> acta.setPerdida(acta.getPerdida() + 1);
            default -> {
                // Eventos de control como entrada/salida/sustitución se almacenan en historial sin afectar puntos.
            }
        }

        recalcularValoracion(acta);
    }

    private void sumarPuntos(Acta acta, Partido partido, Equipo equipo, int puntos) {
        acta.setPuntos(acta.getPuntos().add(BigDecimal.valueOf(puntos)));

        if (Objects.equals(partido.getInscripcionLocal().getEquipo().getId(), equipo.getId())) {
            partido.setPuntosLocal(partido.getPuntosLocal() + puntos);
        } else if (Objects.equals(partido.getInscripcionVisitante().getEquipo().getId(), equipo.getId())) {
            partido.setPuntosVisitante(partido.getPuntosVisitante() + puntos);
        }
    }

    private void recalcularValoracion(Acta acta) {
        int valoracion =
                acta.getTlAnotados() + acta.getT2Anotados() + acta.getTriplesAnotados()
                        + acta.getRebotes() + acta.getTapones() + acta.getRobos()
                        - (acta.getTlTirados() - acta.getTlAnotados())
                        - (acta.getT2Tirados() - acta.getT2Anotados())
                        - (acta.getTriplesTirados() - acta.getTriplesAnotados())
                        - acta.getPerdida();

        acta.setValoracion(valoracion);
    }

    private int calcularMinutosJugados(Long partidoId, Long jugadorId) {
        List<HistorialPartido> eventos = historialPartidoRepository.findAllByPartidoIdAndJugadorIdOrderByIdAsc(partidoId, jugadorId);

        int total = 0;
        Integer inicio = null;
        for (HistorialPartido evento : eventos) {
            String tipo = evento.getTipoEvento() == null ? "" : evento.getTipoEvento().toUpperCase(Locale.ROOT);
            if (tipo.equals("ENTRADA")) {
                inicio = convertirAMinutoAbsoluto(evento.getPeriodo(), evento.getMinuto());
            }
            if (tipo.equals("SALIDA") && inicio != null) {
                int fin = convertirAMinutoAbsoluto(evento.getPeriodo(), evento.getMinuto());
                total += Math.max(fin - inicio, 0);
                inicio = null;
            }
        }
        return total;
    }

    private int convertirAMinutoAbsoluto(Integer periodo, Integer minuto) {
        if (periodo == null || minuto == null) {
            return 0;
        }
        return (periodo - 1) * 10 + minuto;
    }

    private EstadoPartidoDTO construirEstadoPartido(Long partidoId) {
        Partido partido = partidoRepository.findById(partidoId)
                .orElseThrow(() -> new NoSuchElementException("Partido no encontrado."));

        List<ActaDTO> actas = actaRepository.findAllByPartidoId(partidoId)
                .stream()
                .map(this::toActaDTO)
                .toList();

        List<HistorialPartidoDTO> historial = historialPartidoRepository.findAllByPartidoIdOrderByIdAsc(partidoId)
                .stream()
                .map(this::toHistorialDTO)
                .toList();

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

    private ActaDTO toActaDTO(Acta a) {
        return new ActaDTO(
                a.getId(),
                a.getPartido().getId(),
                a.getJugador().getId(),
                a.getEquipo().getId(),
                a.getMinutosJugados(),
                a.getPuntos(),
                a.getTlTirados(),
                a.getTlAnotados(),
                a.getT2Tirados(),
                a.getT2Anotados(),
                a.getTriplesTirados(),
                a.getTriplesAnotados(),
                a.getRebotes(),
                a.getTapones(),
                a.getRobos(),
                a.getPerdida(),
                a.getValoracion(),
                a.getPlusMinus()
        );
    }

    private HistorialPartidoDTO toHistorialDTO(HistorialPartido h) {
        return new HistorialPartidoDTO(
                h.getId(),
                h.getPartido().getId(),
                h.getEquipo().getId(),
                h.getJugador() != null ? h.getJugador().getId() : null,
                h.getEntrenador() != null ? h.getEntrenador().getId() : null,
                h.getTipoEvento(),
                h.getAcierto(),
                h.getPeriodo(),
                h.getMinuto(),
                h.getPosicion()
        );
    }
}
