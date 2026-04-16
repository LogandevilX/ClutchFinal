package com.example.clutchfinal.Model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EquipoEntrenadorId implements Serializable {

    @Column(name = "id_equipo")
    private Long equipoId;

    @Column(name = "id_entrenador")
    private Long entrenadorId;
}
