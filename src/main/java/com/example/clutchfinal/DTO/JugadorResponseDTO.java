package com.example.clutchfinal.DTO;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@NoArgsConstructor
public class JugadorResponseDTO {
    private Long id;
    private String dni;
    private String nombre;
    private String primerApellido;
    private String segundoApellido;
    private String pathFoto;
    private Set<Long> equipoIds;
}
