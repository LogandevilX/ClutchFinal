package com.example.clutchfinal.DTO;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Set;

@Data
@NoArgsConstructor
public class JugadorDTO {
    private Long id;
    private String dni;
    private String nombre;
    private String primerApellido;
    private String segundoApellido;
    private LocalDate fechaNacimiento;
    private String genero;
    private String foto;
    private Long clubId;
    private Set<Long> equipoIds;
}
