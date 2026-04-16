package com.example.clutchfinal.DTO;

import com.example.clutchfinal.Model.EquipoEntrenador;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class EquipoEntrenadorDTO {
    private Long equipoId;
    private Long entrenadorId;
    private EquipoEntrenador.RolEntrenador rol;
}
