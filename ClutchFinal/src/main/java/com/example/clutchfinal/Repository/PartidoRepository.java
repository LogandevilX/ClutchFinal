package com.example.clutchfinal.Repository;

import com.example.clutchfinal.Model.Partido;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PartidoRepository extends JpaRepository<Partido, Long> {
    long countByGrupoIdAndFechaHoraFinIsNotNull(Long grupoId);
    List<Partido> findByUsuarioId(Long usuarioId);
}
