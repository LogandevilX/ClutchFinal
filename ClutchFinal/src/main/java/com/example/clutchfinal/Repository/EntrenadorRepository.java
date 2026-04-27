package com.example.clutchfinal.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.clutchfinal.Model.Entrenador;

import java.util.List;

@Repository
public interface EntrenadorRepository extends JpaRepository<Entrenador, Long> {
    long countByEquipoId(Long equipoId);
    long countByEquipoIdAndIdNot(Long equipoId, Long id);
}
