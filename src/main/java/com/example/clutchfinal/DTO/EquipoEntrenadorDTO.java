package com.example.clutchfinal.DTO;

import com.example.clutchfinal.Model.RolEntrenador;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class EquipoEntrenadorDTO {
    private Long equipoId;
    private Long entrenadorId;
    private RolEntrenador rol;
}
