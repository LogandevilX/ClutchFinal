package com.example.clutchfinal.Fabrica;

import com.example.clutchfinal.DTO.UsuarioDTO;
import com.example.clutchfinal.Model.Usuario;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FabricaUsuarioService {

    public Usuario createUsuario(UsuarioDTO dto) {
        Usuario usuario = new Usuario();
        usuario.setId(dto.getId());
        usuario.setEmail(dto.getEmail());
        usuario.setPassword(dto.getPassword());
        usuario.setApodo(dto.getApodo());
        usuario.setRol(dto.getRol());
        usuario.setFechaRegistro(dto.getFechaRegistro());
        return usuario;
    }

    public UsuarioDTO createUsuarioDTO(Usuario usuario) {
        UsuarioDTO dto = new UsuarioDTO();
        dto.setId(usuario.getId());
        dto.setEmail(usuario.getEmail());
        dto.setPassword(usuario.getPassword());
        dto.setApodo(usuario.getApodo());
        dto.setRol(usuario.getRol());
        dto.setFechaRegistro(usuario.getFechaRegistro());
        return dto;
    }

    public List<UsuarioDTO> createUsuariosDTO(List<Usuario> usuarios) {
        return usuarios.stream().map(this::createUsuarioDTO).collect(Collectors.toList());
    }
}
