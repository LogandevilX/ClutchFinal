package com.example.clutchfinal.DTO;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Set;

@Data
@NoArgsConstructor
public class EquipoDTO {
    private Long id;
    private String nombreEquipo;
    private Integer partidosGanados;
    private Integer partidosPerdidos;
    private Integer puntos;
    private Integer posicion;
    private BigDecimal puntosAFavor;
    private BigDecimal puntosEnContra;
    private Long clubId;
    private Set<Long> entrenadorIds;
    private Set<Long> jugadorIds;
}
