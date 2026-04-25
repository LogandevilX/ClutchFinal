package com.example.clutchfinal.Service;

import com.example.clutchfinal.DTO.ActaDTO;
import com.example.clutchfinal.DTO.ActaConvocadoDTO;
import com.example.clutchfinal.DTO.HistorialPartidoDTO;
import com.example.clutchfinal.Fabrica.FabricaActaService;
import com.example.clutchfinal.Model.*;
import com.example.clutchfinal.Repository.ActaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class ActaService {

    @Autowired
    private ActaRepository actaRepository;
    @Autowired
    private FabricaActaService fabricaActaService;
    @Autowired
    private HistorialPartidoService historialPartidoService;

    public void inicializarActasParaEquipo(Partido partido, Equipo equipo) {
        for (Jugador jugador : equipo.getJugadores()) {
            actaRepository.findByPartidoIdAndJugadorId(partido.getId(), jugador.getId())
                    .orElseGet(() -> actaRepository.save(crearActa(partido, equipo, jugador)));
        }
    }

    public void inicializarActasConvocados(Partido partido,
                                           List<ActaConvocadoDTO> convocados,
                                           Map<Long, Equipo> equiposPorId,
                                           Map<Long, Jugador> jugadoresPorId) {
        for (ActaConvocadoDTO convocado : convocados) {
            Equipo equipo = equiposPorId.get(convocado.getEquipoId());
            Jugador jugador = jugadoresPorId.get(convocado.getJugadorId());
            actaRepository.findByPartidoIdAndJugadorId(partido.getId(), convocado.getJugadorId())
                    .map(acta -> {
                        acta.setDorsal(convocado.getDorsal());
                        acta.setTitular(Boolean.TRUE.equals(convocado.getTitular()));
                        return actaRepository.save(acta);
                    })
                    .orElseGet(() -> {
                        Acta acta = crearActa(partido, equipo, jugador);
                        acta.setDorsal(convocado.getDorsal());
                        acta.setTitular(Boolean.TRUE.equals(convocado.getTitular()));
                        return actaRepository.save(acta);
                    });
        }
    }

    public void aplicarEventoEstadistico(Partido partido, Equipo equipo, Jugador jugador, HistorialPartidoDTO eventoDTO) {
        Acta acta = actaRepository.findByPartidoIdAndJugadorId(partido.getId(), jugador.getId())
                .orElseGet(() -> crearActa(partido, equipo, jugador));

        aplicarEvento(partido, equipo, acta, eventoDTO);
        acta.setMinutosJugados(calcularMinutosJugados(partido.getId(), jugador.getId()));
        actaRepository.save(acta);
    }

    public List<ActaDTO> findActasByPartidoId(Long partidoId) {
        return fabricaActaService.createActasDTO(actaRepository.findAllByPartidoId(partidoId));
    }

    public List<ActaDTO> findActasByJugadorId(Long jugadorId) {
        return fabricaActaService.createActasDTO(actaRepository.findAllByJugadorId(jugadorId));
    }

    private Acta crearActa(Partido partido, Equipo equipo, Jugador jugador) {
        Acta acta = new Acta();
        acta.setPartido(partido);
        acta.setEquipo(equipo);
        acta.setJugador(jugador);
        return acta;
    }

    private void aplicarEvento(Partido partido, Equipo equipo, Acta acta, HistorialPartidoDTO eventoDTO) {
        EventoPartido tipoEvento = eventoDTO.getTipoEvento();
        boolean acierto = esAcierto(eventoDTO.getAcierto());
        if (tipoEvento == null) {
            recalcularValoracion(acta);
            return;
        }

        switch (tipoEvento) {
            case TL -> {
                acta.setTlTirados(acta.getTlTirados() + 1);
                if (acierto) {
                    acta.setTlAnotados(acta.getTlAnotados() + 1);
                    sumarPuntos(acta, partido, equipo, 1);
                }
            }
            case T2 -> {
                acta.setT2Tirados(acta.getT2Tirados() + 1);
                if (acierto) {
                    acta.setT2Anotados(acta.getT2Anotados() + 1);
                    sumarPuntos(acta, partido, equipo, 2);
                }
            }
            case T3 -> {
                acta.setTriplesTirados(acta.getTriplesTirados() + 1);
                if (acierto) {
                    acta.setTriplesAnotados(acta.getTriplesAnotados() + 1);
                    sumarPuntos(acta, partido, equipo, 3);
                }
            }
            case REBOTE -> acta.setRebotes(acta.getRebotes() + 1);
            case TAPON -> acta.setTapones(acta.getTapones() + 1);
            case ROBO -> acta.setRobos(acta.getRobos() + 1);
            case PERDIDA -> acta.setPerdida(acta.getPerdida() + 1);
            case FALTA -> acta.setFalta(acta.getFalta() + 1);
            default -> {
                // Eventos no estadísticos.
            }
        }

        recalcularValoracion(acta);
    }

    private boolean esAcierto(String acierto) {
        if (acierto == null) {
            return false;
        }

        String valorNormalizado = acierto.trim();
        return valorNormalizado.equalsIgnoreCase("SI")
                || valorNormalizado.equalsIgnoreCase("TRUE")
                || valorNormalizado.equals("1");
    }

    private void sumarPuntos(Acta acta, Partido partido, Equipo equipo, int puntos) {
        int puntosActualesActa = acta.getPuntos() != null ? acta.getPuntos() : 0;
        acta.setPuntos(puntosActualesActa + puntos);

        ParcialPartido parcial = partido.getParcialActual();

        int puntosLocalPartido = partido.getPuntosLocal() != null ? partido.getPuntosLocal() : 0;
        int puntosVisitantePartido = partido.getPuntosVisitante() != null ? partido.getPuntosVisitante() : 0;
        int puntosLocalParcial = parcial.getPuntosLocal() != null ? parcial.getPuntosLocal() : 0;
        int puntosVisitanteParcial = parcial.getPuntosVisitante() != null ? parcial.getPuntosVisitante() : 0;

        if (Objects.equals(partido.getInscripcionLocal().getEquipo().getId(), equipo.getId())) {
            partido.setPuntosLocal(puntosLocalPartido + puntos);
            parcial.setPuntosLocal(puntosLocalParcial + puntos);
        } else if (Objects.equals(partido.getInscripcionVisitante().getEquipo().getId(), equipo.getId())) {
            partido.setPuntosVisitante(puntosVisitantePartido + puntos);
            parcial.setPuntosVisitante(puntosVisitanteParcial + puntos);
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

    private double calcularMinutosJugados(Long partidoId, Long jugadorId) {
        List<HistorialPartido> eventos = historialPartidoService.findEventosByPartidoAndJugador(partidoId, jugadorId);

        int totalSegundos = 0;
        Integer inicio = null;
        for (HistorialPartido evento : eventos) {
            EventoPartido tipo = evento.getTipoEvento();
            if (tipo == EventoPartido.ENTRADA) {
                inicio = convertirASegundoAbsoluto(evento.getPeriodo(), evento.getSegundo(), evento.getMinuto());
            }
            if (tipo == EventoPartido.SALIDA && inicio != null) {
                int fin = convertirASegundoAbsoluto(evento.getPeriodo(), evento.getSegundo(), evento.getMinuto());
                totalSegundos += Math.max(fin - inicio, 0);
                inicio = null;
            }
        }
        return BigDecimal.valueOf(totalSegundos)
                .divide(BigDecimal.valueOf(60), 1, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private int convertirASegundoAbsoluto(Integer periodo, Integer segundo, Integer minutoLegacy) {
        if (periodo == null) {
            return 0;
        }

        int segundoEnPeriodo;
        if (segundo != null) {
            segundoEnPeriodo = segundo;
        } else if (minutoLegacy != null) {
            segundoEnPeriodo = minutoLegacy * 60;
        } else {
            segundoEnPeriodo = 0;
        }

        return (periodo - 1) * 600 + segundoEnPeriodo;
    }
}
