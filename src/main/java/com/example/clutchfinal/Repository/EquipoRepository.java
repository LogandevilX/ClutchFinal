package com.example.clutchfinal.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.example.clutchfinal.Model.Equipo;

@Repository
public interface EquipoRepository extends JpaRepository<Equipo, Long> {

    @Query("SELECT e.club.escudo FROM Equipo e WHERE e.id = :equipoId")
    String getEscudo(@Param("equipoId") Long equipoId);

    @Query("""
            SELECT p.direccion
            FROM Equipo e
            JOIN e.club c
            JOIN c.pabellones p
            WHERE e.id = :equipoId
              AND p.id = (
                  SELECT MIN(p2.id)
                  FROM Club c2
                  JOIN c2.pabellones p2
                  WHERE c2.id = c.id
              )
            """)
    String getPabellon(@Param("equipoId") Long equipoId);
}
