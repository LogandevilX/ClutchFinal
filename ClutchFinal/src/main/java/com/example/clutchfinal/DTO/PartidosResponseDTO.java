package com.example.clutchfinal.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PartidosResponseDTO {
    private Long id;
    private Long grupoId;
    private EquipoResponseDTO equipoLocal;
    private EquipoResponseDTO equipoVisitante;
    private LocalDateTime fechaHoraInicio;
    private LocalDateTime fechaHoraFin;
    private Integer puntosLocal;
    private Integer puntosVisitante;
    private String pabellonDeJuego;
}
