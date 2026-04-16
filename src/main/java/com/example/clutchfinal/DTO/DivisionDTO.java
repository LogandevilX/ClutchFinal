package com.example.clutchfinal.DTO;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class DivisionDTO {
    private Long id;
    private String nombreDivision;
    private Long categoriaId;
}
