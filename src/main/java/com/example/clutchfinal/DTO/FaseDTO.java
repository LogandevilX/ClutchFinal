package com.example.clutchfinal.DTO;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
public class FaseDTO {
    private Long id;
    private String nombreFase;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private Long divisionId;
}
