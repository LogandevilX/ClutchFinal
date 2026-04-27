package com.example.clutchfinal.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.clutchfinal.Model.Inscripcion;

import java.util.List;
import java.util.Optional;

@Repository
public interface InscripcionRepository extends JpaRepository<Inscripcion, Long> {
    List<Inscripcion> findByGrupoId(Long grupoId);
    Optional<Inscripcion> findByEquipoIdAndFaseId(Long equipoId, Long faseId);
    Optional<Inscripcion> findByEquipoIdAndGrupoId(Long equipoId, Long grupoId);
}
