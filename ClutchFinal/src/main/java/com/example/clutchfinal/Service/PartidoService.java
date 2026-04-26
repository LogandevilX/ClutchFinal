package com.example.clutchfinal.Service;

import com.example.clutchfinal.DTO.*;
import com.example.clutchfinal.Fabrica.FabricaPartidoService;
import com.example.clutchfinal.Model.*;
import com.example.clutchfinal.Repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.Collections;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class PartidoService {
    @Autowired
    private PartidoRepository partidoRepository;
    @Autowired
    private GrupoRepository grupoRepository;
    @Autowired
    private InscripcionRepository inscripcionRepository;
    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired
    private EquipoRepository equipoRepository;
    @Autowired
    private JugadorRepository jugadorRepository;
    @Autowired
    private EntrenadorRepository entrenadorRepository;
    @Autowired
    private ActaRepository actaRepository;
    @Autowired
    private ActaService actaService;
    @Autowired
    private HistorialPartidoService historialPartidoService;
    @Autowired
    private FabricaPartidoService fabricaPartidoService;

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

        if (dto.getUsuarioId() == null) {
            throw new IllegalArgumentException("Debe indicar usuarioId para el partido.");
        }

        Usuario usuario = usuarioRepository.findById(dto.getUsuarioId())
                .orElseThrow(() -> new NoSuchElementException("Usuario no encontrado con ID: " + dto.getUsuarioId()));

        if (usuario.getRol() != RolUsuario.ANOTADOR) {
            throw new IllegalArgumentException("Solo un usuario con rol ANOTADOR puede asignarse a un partido.");
        }

        if (Objects.equals(inscripcionLocal.getId(), inscripcionVisitante.getId())) {
            throw new IllegalArgumentException("El equipo local y visitante no pueden ser el mismo.");
        }

        if (!Objects.equals(inscripcionLocal.getGrupo().getId(), inscripcionVisitante.getGrupo().getId())) {
            throw new IllegalArgumentException("Las inscripciones local y visitante deben pertenecer al mismo grupo.");
        }

        if (!Objects.equals(inscripcionLocal.getGrupo().getId(), grupo.getId())) {
            throw new IllegalArgumentException("Las inscripciones deben pertenecer al grupo del partido.");
        }

        if (dto.getJornada() == null || dto.getJornada() <= 0) {
            throw new IllegalArgumentException("Debe indicar una jornada válida (mayor que 0).");
        }

        boolean existeConflictoJornada = partidoRepository.existsConflictoEquipoEnJornada(
                grupo.getId(),
                dto.getJornada(),
                inscripcionLocal.getId(),
                inscripcionVisitante.getId(),
                partido.getId()
        );
        if (existeConflictoJornada) {
            throw new IllegalArgumentException("Uno de los equipos ya tiene un partido asignado en esa jornada.");
        }

        partido.setGrupo(grupo);
        partido.setInscripcionLocal(inscripcionLocal);
        partido.setInscripcionVisitante(inscripcionVisitante);
        partido.setUsuario(usuario);
        partido.setJornada(dto.getJornada());
        partido.setFechaHoraInicio(dto.getFechaHoraInicio() != null ? dto.getFechaHoraInicio() : LocalDateTime.now());
        partido.setFechaHoraFin(dto.getFechaHoraFin());
        partido.setPuntosLocal(dto.getPuntosLocal() != null ? dto.getPuntosLocal() : 0);
        partido.setPuntosVisitante(dto.getPuntosVisitante() != null ? dto.getPuntosVisitante() : 0);
        String pabellonDeJuego = equipoRepository.getPabellon(inscripcionLocal.getEquipo().getId());
        if (pabellonDeJuego == null || pabellonDeJuego.isBlank()) {
            throw new IllegalStateException("No se encontró dirección de pabellón para el equipo local.");
        }
        partido.setPabellonDeJuego(pabellonDeJuego);
        if (partido.getEstado() == null) {
            partido.setEstado(EstadoPartido.PROGRAMADO);
        }

        return fabricaPartidoService.toPartidoDTO(partidoRepository.save(partido));
    }

    @Transactional
    public void inicializarActas(Long partidoId, InicializarActasDTO inicializarActasDTO) {
        Partido partido = partidoRepository.findById(partidoId)
                .orElseThrow(() -> new NoSuchElementException("Partido no encontrado con ID: " + partidoId));

        Equipo equipoLocal = partido.getInscripcionLocal().getEquipo();
        Equipo equipoVisitante = partido.getInscripcionVisitante().getEquipo();

        List<ActaConvocadoDTO> convocados = inicializarActasDTO != null ? inicializarActasDTO.getConvocados() : null;
        if (convocados == null || convocados.isEmpty()) {
            throw new IllegalArgumentException("Debe enviar los jugadores convocados con su dorsal para crear el acta.");
        }

        List<Long> equiposPermitidos = List.of(equipoLocal.getId(), equipoVisitante.getId());
        List<Long> jugadoresLocal = equipoLocal.getJugadores().stream().map(Jugador::getId).toList();
        List<Long> jugadoresVisitante = equipoVisitante.getJugadores().stream().map(Jugador::getId).toList();

        for (ActaConvocadoDTO convocado : convocados) {
            if (convocado.getEquipoId() == null || convocado.getJugadorId() == null
                    || convocado.getDorsal() == null || convocado.getTitular() == null) {
                throw new IllegalArgumentException("Cada convocado debe incluir equipoId, jugadorId, dorsal y titular.");
            }
            if (convocado.getDorsal() < 0) {
                throw new IllegalArgumentException("El dorsal no puede ser negativo.");
            }
            if (!equiposPermitidos.contains(convocado.getEquipoId())) {
                throw new IllegalArgumentException("El equipo del convocado no pertenece al partido.");
            }

            boolean jugadorValido = Objects.equals(convocado.getEquipoId(), equipoLocal.getId())
                    ? jugadoresLocal.contains(convocado.getJugadorId())
                    : jugadoresVisitante.contains(convocado.getJugadorId());

            if (!jugadorValido) {
                throw new IllegalArgumentException("El jugador no pertenece al equipo indicado.");
            }
        }

        var equiposPorId = List.of(equipoLocal, equipoVisitante).stream()
                .collect(java.util.stream.Collectors.toMap(Equipo::getId, equipo -> equipo));

        var jugadoresPorId = convocados.stream()
                .map(ActaConvocadoDTO::getJugadorId)
                .distinct()
                .collect(java.util.stream.Collectors.toMap(
                        jugadorId -> jugadorId,
                        jugadorId -> jugadorRepository.findById(jugadorId)
                                .orElseThrow(() -> new NoSuchElementException("Jugador no encontrado con ID: " + jugadorId))
                ));

        validarDorsalesUnicosPorEquipo(convocados, equipoLocal.getId(), equipoVisitante.getId());
        validarTitularesPorEquipo(convocados, equipoLocal.getId(), equipoVisitante.getId());
        actaService.inicializarActasConvocados(partido, convocados, equiposPorId, jugadoresPorId);
    }

    @Transactional
    @CachePut(value = "estadoPartido", key = "#partidoId")
    public EstadoPartidoDTO iniciarPeriodo(Long partidoId, IniciarPeriodoDTO iniciarPeriodoDTO) {
        Partido partido = partidoRepository.findById(partidoId)
                .orElseThrow(() -> new NoSuchElementException("Partido no encontrado con ID: " + partidoId));

        if (iniciarPeriodoDTO == null || iniciarPeriodoDTO.getPeriodo() == null) {
            throw new IllegalArgumentException("Debe indicar el periodo a iniciar.");
        }
        if (iniciarPeriodoDTO.getPeriodo() <= 0) {
            throw new IllegalArgumentException("El periodo debe ser mayor que 0.");
        }

        partido.setPeriodoActual(iniciarPeriodoDTO.getPeriodo());
        partido.setEstado(EstadoPartido.EN_CURSO);
        partido.getParcialActual();

        int minuto = iniciarPeriodoDTO.getMinuto() == null ? 0 : iniciarPeriodoDTO.getMinuto();
        if (minuto < 0 || minuto > 10) {
            throw new IllegalArgumentException("El minuto debe estar entre 0 y 10.");
        }
        Long equipoLocalId = partido.getInscripcionLocal().getEquipo().getId();
        Long equipoVisitanteId = partido.getInscripcionVisitante().getEquipo().getId();

        List<Acta> actasPartido = actaRepository.findAllByPartidoId(partidoId);
        List<TitularPeriodoDTO> titulares = iniciarPeriodoDTO.getTitulares();
        boolean titularesEnRequest = titulares != null && !titulares.isEmpty();

        if (!titularesEnRequest) {
            if (iniciarPeriodoDTO.getPeriodo() != 1) {
                throw new IllegalArgumentException("Debe enviar los titulares que inician el periodo.");
            }

            List<Acta> titularesActa = actasPartido.stream()
                    .filter(acta -> Boolean.TRUE.equals(acta.getTitular()))
                    .toList();

            long titularesLocalActa = titularesActa.stream()
                    .filter(acta -> Objects.equals(acta.getEquipo().getId(), equipoLocalId))
                    .count();
            long titularesVisitanteActa = titularesActa.stream()
                    .filter(acta -> Objects.equals(acta.getEquipo().getId(), equipoVisitanteId))
                    .count();

            if (titularesLocalActa != 5 || titularesVisitanteActa != 5) {
                throw new IllegalStateException("Para iniciar el primer periodo sin titulares en la petición, el acta debe tener 5 titulares por equipo.");
            }

            titulares = titularesActa.stream()
                    .map(acta -> {
                        TitularPeriodoDTO titularPeriodoDTO = new TitularPeriodoDTO();
                        titularPeriodoDTO.setEquipoId(acta.getEquipo().getId());
                        titularPeriodoDTO.setJugadorId(acta.getJugador().getId());
                        return titularPeriodoDTO;
                    })
                    .toList();
        } else {
            validarTitularesPeriodo(titulares, equipoLocalId, equipoVisitanteId);
        }

        final List<TitularPeriodoDTO> titularesFinal = titulares;

        List<Acta> titularesLocal = actasPartido.stream()
                .filter(acta -> titularesFinal.stream().anyMatch(titular ->
                        Objects.equals(titular.getEquipoId(), equipoLocalId)
                                && Objects.equals(titular.getJugadorId(), acta.getJugador().getId())))
                .toList();
        List<Acta> titularesVisitante = actasPartido.stream()
                .filter(acta -> titularesFinal.stream().anyMatch(titular ->
                        Objects.equals(titular.getEquipoId(), equipoVisitanteId)
                                && Objects.equals(titular.getJugadorId(), acta.getJugador().getId())))
                .toList();

        if (titularesLocal.size() != 5 || titularesVisitante.size() != 5) {
            throw new IllegalStateException("Los titulares enviados deben estar en el acta del partido.");
        }

        for (Acta acta : actasPartido) {
            acta.setTitular(false);
        }
        for (Acta actaTitular : titularesLocal) {
            actaTitular.setTitular(true);
            registrarEntradaTitular(partido, actaTitular, iniciarPeriodoDTO.getPeriodo(), minuto);
        }

        for (Acta actaTitular : titularesVisitante) {
            actaTitular.setTitular(true);
            registrarEntradaTitular(partido, actaTitular, iniciarPeriodoDTO.getPeriodo(), minuto);
        }

        actaRepository.saveAll(actasPartido);
        partidoRepository.save(partido);
        return construirEstadoPartido(partidoId);
    }

    @Transactional
    @CachePut(value = "estadoPartido", key = "#partidoId")
    public EstadoPartidoDTO finalizarPeriodo(Long partidoId) {
        Partido partido = partidoRepository.findById(partidoId)
                .orElseThrow(() -> new NoSuchElementException("Partido no encontrado con ID: " + partidoId));

        if (partido.getEstado() != EstadoPartido.EN_CURSO) {
            throw new IllegalStateException("El partido debe estar en curso para finalizar un periodo.");
        }

        Integer periodoActual = partido.getPeriodoActual();
        if (periodoActual == null || periodoActual <= 0) {
            throw new IllegalStateException("No hay un periodo en curso para finalizar.");
        }

        int segundoFin = obtenerSegundoFinPeriodo(partidoId, periodoActual);
        registrarSalidasPendientes(partido, periodoActual, segundoFin);
        partidoRepository.save(partido);

        return construirEstadoPartido(partidoId);
    }

    @Transactional
    @CachePut(value = "estadoPartido", key = "#eventoDTO.partidoId")
    public EstadoPartidoDTO registrarEvento(HistorialPartidoDTO eventoDTO) {
        normalizarTiempoEvento(eventoDTO);

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

    @Transactional
    @CacheEvict(value = "estadoPartido", key = "#partidoId")
    public void finalizarPartido(Long partidoId) {
        Partido partido = partidoRepository.findById(partidoId)
                .orElseThrow(() -> new NoSuchElementException("Partido no encontrado con ID: " + partidoId));

        if (partido.getFechaHoraFin() != null) {
            throw new IllegalStateException("El partido ya fue finalizado.");
        }

        Equipo equipoLocal = partido.getInscripcionLocal().getEquipo();
        Equipo equipoVisitante = partido.getInscripcionVisitante().getEquipo();

        Integer puntosLocal = partido.getPuntosLocal() != null ? partido.getPuntosLocal() : 0;
        Integer puntosVisitante = partido.getPuntosVisitante() != null ? partido.getPuntosVisitante() : 0;

        actualizarMediasPuntos(equipoLocal, puntosLocal, puntosVisitante);
        actualizarMediasPuntos(equipoVisitante, puntosVisitante, puntosLocal);

        if (puntosLocal.equals(puntosVisitante)) {
            throw new IllegalStateException("No se puede finalizar un partido con empate.");
        }

        if (puntosLocal > puntosVisitante) {
            registrarVictoria(equipoLocal);
            registrarDerrota(equipoVisitante);
        } else {
            registrarVictoria(equipoVisitante);
            registrarDerrota(equipoLocal);
        }

        Integer[] tiempoFinPartido = obtenerTiempoFinalPartido(partido.getId());
        registrarSalidasPendientes(partido, tiempoFinPartido[0], tiempoFinPartido[1]);
        partido.setFechaHoraFin(LocalDateTime.now());
        partido.setEstado(EstadoPartido.FINALIZADO);

        equipoRepository.save(equipoLocal);
        equipoRepository.save(equipoVisitante);
        partidoRepository.save(partido);
        actualizarPosicionesGrupo(partido.getGrupo().getId());
    }

    private EstadoPartidoDTO construirEstadoPartido(Long partidoId) {
        Partido partido = partidoRepository.findById(partidoId)
                .orElseThrow(() -> new NoSuchElementException("Partido no encontrado."));

        List<ActaDTO> actas = actaService.findActasByPartidoId(partidoId);
        List<HistorialPartidoDTO> historial = historialPartidoService.findHistorialByPartidoId(partidoId);

        return new EstadoPartidoDTO(fabricaPartidoService.toPartidoResponseDTOConPlantilla(partido), actas, historial);
    }

    public PartidosResponseDTO findPartidoById(Long id) {
        return partidoRepository.findById(id).map(fabricaPartidoService::toPartidoResponseDTO).orElse(null);
    }

    public List<PartidosResponseDTO> findAllPartidos() {
        return partidoRepository.findAll().stream().map(fabricaPartidoService::toPartidoResponseDTO).toList();
    }

    public List<PartidosResponseDTO> findPartidosByUsuarioId(Long usuarioId) {
        return partidoRepository.findByUsuarioId(usuarioId).stream()
                .sorted(Comparator.comparing(Partido::getFechaHoraInicio, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(fabricaPartidoService::toPartidoResponseDTO)
                .toList();
    }

    @Transactional
    public void deletePartidoById(Long id) {
        Partido partido = partidoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Partido no encontrado con ID: " + id));
        partidoRepository.delete(partido);
    }

    private void actualizarMediasPuntos(Equipo equipo, int puntosAnotados, int puntosRecibidos) {
        int partidosJugadosActuales = obtenerPartidosJugados(equipo);
        int totalPartidos = partidosJugadosActuales + 1;

        BigDecimal mediaFavorActual = valorSeguro(equipo.getPuntosAFavor());
        BigDecimal mediaContraActual = valorSeguro(equipo.getPuntosEnContra());

        BigDecimal nuevaMediaFavor = mediaFavorActual
                .multiply(BigDecimal.valueOf(partidosJugadosActuales))
                .add(BigDecimal.valueOf(puntosAnotados))
                .divide(BigDecimal.valueOf(totalPartidos), 2, RoundingMode.HALF_UP);

        BigDecimal nuevaMediaContra = mediaContraActual
                .multiply(BigDecimal.valueOf(partidosJugadosActuales))
                .add(BigDecimal.valueOf(puntosRecibidos))
                .divide(BigDecimal.valueOf(totalPartidos), 2, RoundingMode.HALF_UP);

        equipo.setPuntosAFavor(nuevaMediaFavor);
        equipo.setPuntosEnContra(nuevaMediaContra);
    }

    private int obtenerPartidosJugados(Equipo equipo) {
        int ganados = equipo.getPartidosGanados() != null ? equipo.getPartidosGanados() : 0;
        int perdidos = equipo.getPartidosPerdidos() != null ? equipo.getPartidosPerdidos() : 0;
        return ganados + perdidos;
    }

    private void registrarEntradaTitular(Partido partido, Acta actaTitular, Integer periodo, Integer minuto) {
        int segundo = minuto != null ? minuto * 60 : 0;
        HistorialPartidoDTO eventoDTO = new HistorialPartidoDTO(
                null,
                partido.getId(),
                actaTitular.getEquipo().getId(),
                actaTitular.getJugador().getId(),
                null,
                EventoPartido.ENTRADA,
                null,
                periodo,
                minuto,
                segundo,
                null
        );

        historialPartidoService.registrarEvento(eventoDTO, partido, actaTitular.getEquipo(), actaTitular.getJugador(), null);
        actaService.aplicarEventoEstadistico(partido, actaTitular.getEquipo(), actaTitular.getJugador(), eventoDTO);
    }

    private void registrarSalidasPendientes(Partido partido, int periodoFin, int segundoFin) {
        List<Acta> actasPartido = actaRepository.findAllByPartidoId(partido.getId());

        for (Acta acta : actasPartido) {
            Jugador jugador = acta.getJugador();
            if (jugador == null) {
                continue;
            }

            List<HistorialPartido> eventosJugador =
                    historialPartidoService.findEventosByPartidoAndJugador(partido.getId(), jugador.getId());

            if (!jugadorEnJuego(eventosJugador)) {
                continue;
            }

            HistorialPartidoDTO salidaDTO = new HistorialPartidoDTO(
                    null,
                    partido.getId(),
                    acta.getEquipo().getId(),
                    jugador.getId(),
                    null,
                    EventoPartido.SALIDA,
                    null,
                    periodoFin,
                    segundoFin / 60,
                    segundoFin,
                    null
            );

            historialPartidoService.registrarEvento(salidaDTO, partido, acta.getEquipo(), jugador, null);
            actaService.aplicarEventoEstadistico(partido, acta.getEquipo(), jugador, salidaDTO);
        }
    }

    private Integer[] obtenerTiempoFinalPartido(Long partidoId) {
        Partido partido = partidoRepository.findById(partidoId)
                .orElseThrow(() -> new NoSuchElementException("Partido no encontrado."));

        int periodo = (partido.getPeriodoActual() != null && partido.getPeriodoActual() > 0)
                ? partido.getPeriodoActual()
                : 1;

        // El cierre oficial del partido se produce al final del periodo en curso (10:00).
        return new Integer[]{periodo, 600};
    }

    private int obtenerSegundoFinPeriodo(Long partidoId, int periodo) {
        // El periodo solo se puede cerrar cuando se alcanza 10:00 en el reloj principal.
        // No usamos el último evento porque puede ser mucho antes y recortaría minutos jugados.
        return 600;
    }

    private void normalizarTiempoEvento(HistorialPartidoDTO eventoDTO) {
        if (eventoDTO == null || eventoDTO.getPeriodo() == null) {
            throw new IllegalArgumentException("Debe indicar periodo del evento.");
        }

        if (eventoDTO.getSegundo() == null && eventoDTO.getMinuto() == null) {
            throw new IllegalArgumentException("Debe indicar el tiempo del evento en segundos o minutos.");
        }

        if (eventoDTO.getSegundo() == null) {
            eventoDTO.setSegundo(eventoDTO.getMinuto() * 60);
        }

        if (eventoDTO.getSegundo() < 0 || eventoDTO.getSegundo() > 600) {
            throw new IllegalArgumentException("El segundo del evento debe estar entre 0 y 600.");
        }

        eventoDTO.setMinuto(eventoDTO.getSegundo() / 60);
    }

    private boolean jugadorEnJuego(List<HistorialPartido> eventosJugador) {
        boolean enJuego = false;
        for (HistorialPartido evento : eventosJugador) {
            if (evento.getTipoEvento() == EventoPartido.ENTRADA) {
                enJuego = true;
            } else if (evento.getTipoEvento() == EventoPartido.SALIDA) {
                enJuego = false;
            }
        }
        return enJuego;
    }

    private void validarTitularesPorEquipo(List<ActaConvocadoDTO> convocados, Long equipoLocalId, Long equipoVisitanteId) {
        long titularesLocal = convocados.stream()
                .filter(convocado -> Objects.equals(convocado.getEquipoId(), equipoLocalId))
                .filter(convocado -> Boolean.TRUE.equals(convocado.getTitular()))
                .count();

        long titularesVisitante = convocados.stream()
                .filter(convocado -> Objects.equals(convocado.getEquipoId(), equipoVisitanteId))
                .filter(convocado -> Boolean.TRUE.equals(convocado.getTitular()))
                .count();

        if (titularesLocal != 5 || titularesVisitante != 5) {
            throw new IllegalArgumentException("Cada equipo debe tener exactamente 5 titulares.");
        }
    }

    private void validarDorsalesUnicosPorEquipo(List<ActaConvocadoDTO> convocados, Long equipoLocalId, Long equipoVisitanteId) {
        long dorsalesUnicosLocal = convocados.stream()
                .filter(convocado -> Objects.equals(convocado.getEquipoId(), equipoLocalId))
                .map(ActaConvocadoDTO::getDorsal)
                .distinct()
                .count();
        long totalLocal = convocados.stream()
                .filter(convocado -> Objects.equals(convocado.getEquipoId(), equipoLocalId))
                .count();

        long dorsalesUnicosVisitante = convocados.stream()
                .filter(convocado -> Objects.equals(convocado.getEquipoId(), equipoVisitanteId))
                .map(ActaConvocadoDTO::getDorsal)
                .distinct()
                .count();
        long totalVisitante = convocados.stream()
                .filter(convocado -> Objects.equals(convocado.getEquipoId(), equipoVisitanteId))
                .count();

        if (dorsalesUnicosLocal != totalLocal || dorsalesUnicosVisitante != totalVisitante) {
            throw new IllegalArgumentException("No puede haber dorsales duplicados dentro del mismo equipo.");
        }
    }

    private void validarTitularesPeriodo(List<TitularPeriodoDTO> titulares, Long equipoLocalId, Long equipoVisitanteId) {
        boolean incompletos = titulares.stream()
                .anyMatch(titular -> titular.getEquipoId() == null || titular.getJugadorId() == null);
        if (incompletos) {
            throw new IllegalArgumentException("Cada titular del periodo debe incluir equipoId y jugadorId.");
        }

        long unicos = titulares.stream()
                .map(titular -> titular.getEquipoId() + "-" + titular.getJugadorId())
                .distinct()
                .count();
        if (unicos != titulares.size()) {
            throw new IllegalArgumentException("No puede haber titulares repetidos en el inicio de periodo.");
        }

        long titularesLocal = titulares.stream()
                .filter(titular -> Objects.equals(titular.getEquipoId(), equipoLocalId))
                .count();

        long titularesVisitante = titulares.stream()
                .filter(titular -> Objects.equals(titular.getEquipoId(), equipoVisitanteId))
                .count();

        if (titularesLocal != 5 || titularesVisitante != 5) {
            throw new IllegalArgumentException("Debe enviar 5 titulares por equipo para iniciar el periodo.");
        }
    }

    private void registrarVictoria(Equipo equipo) {
        int ganados = equipo.getPartidosGanados() != null ? equipo.getPartidosGanados() : 0;
        int puntos = equipo.getPuntos() != null ? equipo.getPuntos() : 0;
        equipo.setPartidosGanados(ganados + 1);
        equipo.setPuntos(puntos + 2);
    }

    private void registrarDerrota(Equipo equipo) {
        int perdidos = equipo.getPartidosPerdidos() != null ? equipo.getPartidosPerdidos() : 0;
        int puntos = equipo.getPuntos() != null ? equipo.getPuntos() : 0;
        equipo.setPartidosPerdidos(perdidos + 1);
        equipo.setPuntos(puntos + 1);
    }

    private BigDecimal valorSeguro(BigDecimal valor) {
        return valor != null ? valor : BigDecimal.ZERO;
    }

    private void actualizarPosicionesGrupo(Long grupoId) {
        List<Inscripcion> inscripcionesGrupo = inscripcionRepository.findByGrupoId(grupoId);
        List<Equipo> equiposGrupo = inscripcionesGrupo.stream()
                .map(Inscripcion::getEquipo)
                .toList();

        if (equiposGrupo.isEmpty()) {
            return;
        }

        long partidosFinalizados = partidoRepository.countByGrupoIdAndFechaHoraFinIsNotNull(grupoId);
        if (partidosFinalizados == 0) {
            equiposGrupo.forEach(equipo -> equipo.setPosicion(null));
            equipoRepository.saveAll(equiposGrupo);
            return;
        }

        List<Equipo> equiposConPuntos = equiposGrupo.stream()
                .filter(equipo -> (equipo.getPuntos() != null ? equipo.getPuntos() : 0) > 0)
                .sorted(Comparator
                        .comparingInt((Equipo equipo) -> equipo.getPuntos() != null ? equipo.getPuntos() : 0)
                        .reversed()
                        .thenComparing(this::diferenciaPPPPCPP, Comparator.reverseOrder())
                        .thenComparing(Equipo::getId))
                .toList();

        List<Equipo> equiposSinPuntos = new ArrayList<>(equiposGrupo.stream()
                .filter(equipo -> (equipo.getPuntos() != null ? equipo.getPuntos() : 0) == 0)
                .toList());
        Collections.shuffle(equiposSinPuntos, ThreadLocalRandom.current());

        List<Equipo> clasificacion = new ArrayList<>(equiposConPuntos);
        clasificacion.addAll(equiposSinPuntos);

        for (int i = 0; i < clasificacion.size(); i++) {
            clasificacion.get(i).setPosicion(i + 1);
        }

        equipoRepository.saveAll(clasificacion);
    }

    private BigDecimal diferenciaPPPPCPP(Equipo equipo) {
        return valorSeguro(equipo.getPuntosAFavor()).subtract(valorSeguro(equipo.getPuntosEnContra()));
    }
}
