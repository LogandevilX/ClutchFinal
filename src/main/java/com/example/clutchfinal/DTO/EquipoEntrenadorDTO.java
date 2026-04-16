package com.example.clutchfinal.DTO;

import com.example.clutchfinal.Model.RolEntrenador;
import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class EquipoEntrenadorDTO {
    private Long equipoId;

    @JsonAlias("entenadorId")
    private Long entrenadorId;

    private RolEntrenador rol;
}
