package com.example.clutchfinal.DTO;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class CategoriaDTO {
    private Long id;
    private String nombreCategoria;
    private String genero;
    private Integer edadMax;
    private Long temporadaId;
}
