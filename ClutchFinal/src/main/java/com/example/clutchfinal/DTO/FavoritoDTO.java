package com.example.clutchfinal.DTO;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class FavoritoDTO {
    private Long id;
    private Long usuarioId;
    private Long equipoId;
    private Long jugadorId;
}
