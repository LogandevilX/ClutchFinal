package com.example.clutchfinal.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EstadoPartidoDTO {
    private PartidosResponseDTO partido;
    private List<ActaDTO> actas;
    private List<HistorialPartidoDTO> historial;
}
