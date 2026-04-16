package com.example.clutchfinal.DTO;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
public class TemporadaDTO {
    private Long id;
    private String denominacion;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private String estado;
}
