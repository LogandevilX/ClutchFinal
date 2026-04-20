package com.example.clutchfinal.Fabrica;

import com.example.clutchfinal.DTO.FavoritoDTO;
import com.example.clutchfinal.Model.Favorito;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FabricaFavoritoService {

    public Favorito createFavorito(FavoritoDTO dto) {
        Favorito favorito = new Favorito();
        favorito.setId(dto.getId());
        return favorito;
    }

    public FavoritoDTO createFavoritoDTO(Favorito favorito) {
        FavoritoDTO dto = new FavoritoDTO();
        dto.setId(favorito.getId());
        if (favorito.getUsuario() != null) {
            dto.setUsuarioId(favorito.getUsuario().getId());
        }
        if (favorito.getEquipo() != null) {
            dto.setEquipoId(favorito.getEquipo().getId());
        }
        if (favorito.getJugador() != null) {
            dto.setJugadorId(favorito.getJugador().getId());
        }
        return dto;
    }

    public List<FavoritoDTO> createFavoritosDTO(List<Favorito> favoritos) {
        return favoritos.stream().map(this::createFavoritoDTO).collect(Collectors.toList());
    }
}
