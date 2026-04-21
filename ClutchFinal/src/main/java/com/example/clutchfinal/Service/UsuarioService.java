package com.example.clutchfinal.Service;

import com.example.clutchfinal.DTO.UsuarioDTO;
import com.example.clutchfinal.Fabrica.FabricaUsuarioService;
import com.example.clutchfinal.Model.Usuario;
import com.example.clutchfinal.Repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired
    private FabricaUsuarioService fabricaUsuarioService;

    public UsuarioDTO save(UsuarioDTO dto) {
        Usuario usuario = fabricaUsuarioService.createUsuario(dto);

        if (dto.getRol() == null) {
            throw new IllegalArgumentException("Debes indicar el rol del usuario.");
        }
        if (dto.getEmail() == null || dto.getEmail().isBlank()) {
            throw new IllegalArgumentException("Debes indicar el email del usuario.");
        }
        if (dto.getPassword() == null || dto.getPassword().isBlank()) {
            throw new IllegalArgumentException("Debes indicar la contraseña del usuario.");
        }

        usuarioRepository.findByEmail(dto.getEmail())
                .filter(existente -> dto.getId() == null || !existente.getId().equals(dto.getId()))
                .ifPresent(existente -> {
                    throw new IllegalArgumentException("Ya existe un usuario con ese email.");
                });

        if (dto.getId() == null || usuario.getFechaRegistro() == null) {
            usuario.setFechaRegistro(LocalDateTime.now());
        }

        return fabricaUsuarioService.createUsuarioDTO(usuarioRepository.save(usuario));
    }

    public UsuarioDTO login(String email, String password) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Debes indicar el email del usuario.");
        }
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("Debes indicar la contraseña del usuario.");
        }

        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("Credenciales inválidas."));

        if (!usuario.getPassword().equals(password)) {
            throw new NoSuchElementException("Credenciales inválidas.");
        }

        return fabricaUsuarioService.createUsuarioDTO(usuario);
    }

    public UsuarioDTO findById(Long id) {
        return usuarioRepository.findById(id)
                .map(fabricaUsuarioService::createUsuarioDTO)
                .orElse(null);
    }

    public List<UsuarioDTO> findAll() {
        return fabricaUsuarioService.createUsuariosDTO(usuarioRepository.findAll());
    }

    public void deleteById(Long id) {
        if (!usuarioRepository.existsById(id)) {
            throw new NoSuchElementException("Usuario no encontrado con ID: " + id);
        }
        usuarioRepository.deleteById(id);
    }
}
