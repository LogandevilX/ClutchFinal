package com.example.clutchfinal.DTO;

import com.example.clutchfinal.Model.EstadoPartido;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

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
    private Integer periodoActual;
    private List<ParcialPartidoDTO> parciales;
    private EstadoPartido estado;
}


