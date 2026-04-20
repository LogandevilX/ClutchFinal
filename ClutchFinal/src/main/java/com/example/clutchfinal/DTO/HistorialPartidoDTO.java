package com.example.clutchfinal.DTO;

import com.example.clutchfinal.Model.EventoPartido;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HistorialPartidoDTO {
    private Long id;
    private Long partidoId;
    private Long equipoId;
    private Long jugadorId;
    private Long entrenadorId;
    private EventoPartido tipoEvento;
    private String acierto;
    private Integer periodo;
    private Integer minuto;
    private String posicion;
}
