package com.example.clutchfinal.DTO;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class JugadorResponseDTO {
    private Long id;
    private String dni;
    private String nombre;
    private String primerApellido;
    private String segundoApellido;
    private String pathFoto;
    private Long clubId;
}
