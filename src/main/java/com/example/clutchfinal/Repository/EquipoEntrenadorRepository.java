package com.example.clutchfinal.Repository;

import com.example.clutchfinal.Model.EquipoEntrenador;
import com.example.clutchfinal.Model.EquipoEntrenadorId;
import com.example.clutchfinal.Model.RolEntrenador;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EquipoEntrenadorRepository extends JpaRepository<EquipoEntrenador, EquipoEntrenadorId> {
    boolean existsByEquipo_IdAndRol(Long equipoId, RolEntrenador rol);
}
