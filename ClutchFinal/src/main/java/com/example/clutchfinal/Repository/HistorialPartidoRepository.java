package com.example.clutchfinal.Repository;

import com.example.clutchfinal.Model.HistorialPartido;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HistorialPartidoRepository extends JpaRepository<HistorialPartido, Long> {
    List<HistorialPartido> findAllByPartidoIdOrderByIdAsc(Long partidoId);
    List<HistorialPartido> findAllByPartidoIdAndJugadorIdOrderByIdAsc(Long partidoId, Long jugadorId);
}
