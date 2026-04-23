package com.example.clutchfinal.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ParcialPartidoDTO {
    private Integer periodo;
    private Integer puntosLocal;
    private Integer puntosVisitante;
}
