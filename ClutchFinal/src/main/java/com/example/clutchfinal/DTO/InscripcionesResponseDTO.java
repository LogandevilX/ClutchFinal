package com.example.clutchfinal.DTO;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class InscripcionesResponseDTO {
    private Long id;
    private LocalDateTime fechaInscripcion;
    private Long faseId;
    private String faseActual;
    private Long grupoId;
    private Long equipoId;
    private String nombreGrupo;
    private String nombreDivision;
}
