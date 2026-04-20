package com.example.clutchfinal.Repository;

import com.example.clutchfinal.Model.Acta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ActaRepository extends JpaRepository<Acta, Long> {
    Optional<Acta> findByPartidoIdAndJugadorId(Long partidoId, Long jugadorId);
    List<Acta> findAllByPartidoId(Long partidoId);
    List<Acta> findAllByJugadorId(Long jugadorId);
}
