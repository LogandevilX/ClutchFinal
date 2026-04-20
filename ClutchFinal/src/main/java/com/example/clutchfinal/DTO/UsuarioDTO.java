package com.example.clutchfinal.DTO;

import com.example.clutchfinal.Model.RolUsuario;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class UsuarioDTO {
    private Long id;
    private String email;
    private String password;
    private String apodo;
    private RolUsuario rol;
    private LocalDateTime fechaRegistro;
}
