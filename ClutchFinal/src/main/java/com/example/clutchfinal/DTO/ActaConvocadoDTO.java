package com.example.clutchfinal.DTO;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ActaConvocadoDTO {
    private Long equipoId;
    private Long jugadorId;
    private Integer dorsal;
    private Boolean titular;
}
