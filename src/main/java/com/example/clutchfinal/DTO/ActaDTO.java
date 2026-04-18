package com.example.clutchfinal.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActaDTO {
    private Long id;
    private Long partidoId;
    private Long jugadorId;
    private Long equipoId;
    private Integer minutosJugados;
    private BigDecimal puntos;
    private Integer tlTirados;
    private Integer tlAnotados;
    private Integer t2Tirados;
    private Integer t2Anotados;
    private Integer triplesTirados;
    private Integer triplesAnotados;
    private Integer rebotes;
    private Integer tapones;
    private Integer robos;
    private Integer perdida;
    private Integer valoracion;
    private Integer plusMinus;
}
