package com.example.clutchfinal.DTO;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class InicializarActasDTO {
    private List<ActaConvocadoDTO> convocados;
}
