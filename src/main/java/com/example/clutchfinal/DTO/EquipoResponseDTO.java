package com.example.clutchfinal.DTO;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
public class EquipoResponseDTO {
    private Long id;
    private String nombreEquipo;
    private Integer partidosGanados;
    private Integer partidosPerdidos;
    private Integer puntos;
    private Integer posicion;
    private BigDecimal puntosAFavor;
    private BigDecimal puntosEnContra;
    private Long categoriaId;
    private String direccion;
    private String urlEscudo;
}
