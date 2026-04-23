package com.example.clutchfinal.DTO;

import com.example.clutchfinal.Model.EstadoPartido;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PartidoDTO {
    private Long id;
    private Long grupoId;
    private Long inscripcionLocalId;
    private Long inscripcionVisitanteId;
    private Long usuarioId;
    private LocalDateTime fechaHoraInicio;
    private LocalDateTime fechaHoraFin;
    private Integer puntosLocal;
    private Integer puntosVisitante;
    private String pabellonDeJuego;
    private EstadoPartido estado;
}

