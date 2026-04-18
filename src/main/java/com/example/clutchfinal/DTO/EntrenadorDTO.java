package com.example.clutchfinal.DTO;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
public class EntrenadorDTO {
    private Long id;
    private String dni;
    private String nombre;
    private String primerApellido;
    private String segundoApellido;
    private String telefono;
    private LocalDate fechaNacimiento;
    private String titulo;
    private Long equipoId;
}
