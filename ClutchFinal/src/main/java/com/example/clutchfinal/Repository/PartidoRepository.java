package com.example.clutchfinal.Repository;

import com.example.clutchfinal.Model.Partido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PartidoRepository extends JpaRepository<Partido, Long> {
    long countByGrupoIdAndFechaHoraFinIsNotNull(Long grupoId);
    List<Partido> findByUsuarioId(Long usuarioId);

    @Query("""
            SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END
            FROM Partido p
            WHERE p.grupo.id = :grupoId
              AND p.jornada = :jornada
              AND (:partidoId IS NULL OR p.id <> :partidoId)
              AND (
                    p.inscripcionLocal.id IN (:inscripcionLocalId, :inscripcionVisitanteId)
                    OR p.inscripcionVisitante.id IN (:inscripcionLocalId, :inscripcionVisitanteId)
                  )
            """)
    boolean existsConflictoEquipoEnJornada(@Param("grupoId") Long grupoId,
                                           @Param("jornada") Integer jornada,
                                           @Param("inscripcionLocalId") Long inscripcionLocalId,
                                           @Param("inscripcionVisitanteId") Long inscripcionVisitanteId,
                                           @Param("partidoId") Long partidoId);
}
