package com.example.clutchfinal.Repository;

import com.example.clutchfinal.Model.Favorito;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FavoritoRepository extends JpaRepository<Favorito, Long> {
    List<Favorito> findByUsuarioId(Long usuarioId);
    boolean existsByUsuarioIdAndEquipoId(Long usuarioId, Long equipoId);
    boolean existsByUsuarioIdAndJugadorId(Long usuarioId, Long jugadorId);
}
