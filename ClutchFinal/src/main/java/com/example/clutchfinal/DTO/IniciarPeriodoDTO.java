package com.example.clutchfinal.DTO;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class IniciarPeriodoDTO {
    private Integer periodo;
    private Integer minuto;
    private List<TitularPeriodoDTO> titulares;
}
