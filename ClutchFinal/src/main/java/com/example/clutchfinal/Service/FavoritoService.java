package com.example.clutchfinal.Service;

import com.example.clutchfinal.DTO.FavoritoDTO;
import com.example.clutchfinal.Fabrica.FabricaFavoritoService;
import com.example.clutchfinal.Model.*;
import com.example.clutchfinal.Repository.EquipoRepository;
import com.example.clutchfinal.Repository.FavoritoRepository;
import com.example.clutchfinal.Repository.JugadorRepository;
import com.example.clutchfinal.Repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class FavoritoService {

    @Autowired
    private FavoritoRepository favoritoRepository;
    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired
    private EquipoRepository equipoRepository;
    @Autowired
    private JugadorRepository jugadorRepository;
    @Autowired
    private FabricaFavoritoService fabricaFavoritoService;

    public FavoritoDTO save(FavoritoDTO dto) {
        Favorito favorito = fabricaFavoritoService.createFavorito(dto);

        if (dto.getUsuarioId() == null) {
            throw new IllegalArgumentException("Debes indicar usuarioId.");
        }

        boolean tieneEquipo = dto.getEquipoId() != null;
        boolean tieneJugador = dto.getJugadorId() != null;

        if (tieneEquipo == tieneJugador) {
            throw new IllegalArgumentException("Debes indicar solo equipoId o solo jugadorId.");
        }

        Usuario usuario = usuarioRepository.findById(dto.getUsuarioId())
                .orElseThrow(() -> new NoSuchElementException("Usuario no encontrado con ID: " + dto.getUsuarioId()));

        if (usuario.getRol() != RolUsuario.ESPECTADOR) {
            throw new IllegalArgumentException("Solo un usuario ESPECTADOR puede crear favoritos.");
        }

        favorito.setUsuario(usuario);

        if (tieneEquipo) {
            Equipo equipo = equipoRepository.findById(dto.getEquipoId())
                    .orElseThrow(() -> new NoSuchElementException("Equipo no encontrado con ID: " + dto.getEquipoId()));

            if (favoritoRepository.existsByUsuarioIdAndEquipoId(dto.getUsuarioId(), dto.getEquipoId())
                    && (dto.getId() == null || favoritoRepository.findById(dto.getId())
                    .map(actual -> actual.getEquipo() == null || !actual.getEquipo().getId().equals(dto.getEquipoId()))
                    .orElse(true))) {
                throw new IllegalArgumentException("Ese equipo ya está en favoritos para el usuario.");
            }
            favorito.setEquipo(equipo);
            favorito.setJugador(null);
        }

        if (tieneJugador) {
            Jugador jugador = jugadorRepository.findById(dto.getJugadorId())
                    .orElseThrow(() -> new NoSuchElementException("Jugador no encontrado con ID: " + dto.getJugadorId()));

            if (favoritoRepository.existsByUsuarioIdAndJugadorId(dto.getUsuarioId(), dto.getJugadorId())
                    && (dto.getId() == null || favoritoRepository.findById(dto.getId())
                    .map(actual -> actual.getJugador() == null || !actual.getJugador().getId().equals(dto.getJugadorId()))
                    .orElse(true))) {
                throw new IllegalArgumentException("Ese jugador ya está en favoritos para el usuario.");
            }
            favorito.setJugador(jugador);
            favorito.setEquipo(null);
        }

        return fabricaFavoritoService.createFavoritoDTO(favoritoRepository.save(favorito));
    }

    public FavoritoDTO findById(Long id) {
        return favoritoRepository.findById(id)
                .map(fabricaFavoritoService::createFavoritoDTO)
                .orElse(null);
    }

    public List<FavoritoDTO> findAll() {
        return fabricaFavoritoService.createFavoritosDTO(favoritoRepository.findAll());
    }

    public List<FavoritoDTO> findByUsuarioId(Long usuarioId) {
        return fabricaFavoritoService.createFavoritosDTO(favoritoRepository.findByUsuarioId(usuarioId));
    }

    public void deleteById(Long id) {
        if (!favoritoRepository.existsById(id)) {
            throw new NoSuchElementException("Favorito no encontrado con ID: " + id);
        }
        favoritoRepository.deleteById(id);
    }
}
