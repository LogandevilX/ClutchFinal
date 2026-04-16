package com.example.clutchfinal.DTO;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@NoArgsConstructor
public class ClubResponseDTO {
    private Long id;
    private String nombreClub;
    private String cif;
    private Integer codigoPostal;
    private Integer telefono;
    private String directorTecnico;
    private String pathEscudo;
    private Set<Long> pabellonIds;
}
