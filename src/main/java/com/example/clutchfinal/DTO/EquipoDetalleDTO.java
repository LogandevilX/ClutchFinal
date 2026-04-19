package com.example.clutchfinal.DTO;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
public class EquipoDetalleDTO {
    private Long id;
    private String nombreEquipo;
    private Integer partidosGanados;
    private Integer partidosPerdidos;
    private Integer puntos;
    private Integer posicion;
    private BigDecimal puntosAFavor;
    private BigDecimal puntosEnContra;
    private String direccion;
    private String urlEscudo;
    private List<EntrenadorDTO> entrenadores;
    private List<JugadorResponseDTO> jugadores;
}
