package com.example.clutchfinal.DTO;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@NoArgsConstructor
public class PabellonDTO {
    private Long id;
    private Integer codigoPostal;
    private String direccion;
    private String nombrePabellon;
    private Set<Long> clubIds;
}
