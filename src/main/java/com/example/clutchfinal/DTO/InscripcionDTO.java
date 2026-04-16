package com.example.clutchfinal.DTO;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class InscripcionDTO {
    private Long id;
    private LocalDateTime fechaInscripcion;
    private Long faseId;
    private Long grupoId;
    private Long equipoId;
}
