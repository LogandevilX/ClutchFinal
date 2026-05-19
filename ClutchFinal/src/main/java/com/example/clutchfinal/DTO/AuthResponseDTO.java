package com.example.clutchfinal.DTO;

import com.example.clutchfinal.Model.RolUsuario;

public record AuthResponseDTO(
        String token,
        String tokenType,
        Long userId,
        String email,
        RolUsuario rol
) {
}
