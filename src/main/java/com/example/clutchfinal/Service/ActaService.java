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
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

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
                        return actaRepository.save(acta);
                    })
                    .orElseGet(() -> {
                        Acta acta = crearActa(partido, equipo, jugador);
                        acta.setDorsal(convocado.getDorsal());
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

    private Acta crearActa(Partido partido, Equipo equipo, Jugador jugador) {
        Acta acta = new Acta();
        acta.setPartido(partido);
        acta.setEquipo(equipo);
        acta.setJugador(jugador);
        return acta;
    }

    private void aplicarEvento(Partido partido, Equipo equipo, Acta acta, HistorialPartidoDTO eventoDTO) {
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
                // Eventos no estadísticos.
            }
        }

        recalcularValoracion(acta);
    }

    private void sumarPuntos(Acta acta, Partido partido, Equipo equipo, int puntos) {
        acta.setPuntos(puntos);

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
        List<HistorialPartido> eventos = historialPartidoService.findEventosByPartidoAndJugador(partidoId, jugadorId);

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
}
