package com.example.clutchfinal.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.clutchfinal.Model.Entrenador;

@Repository
public interface EntrenadorRepository extends JpaRepository<Entrenador, Long> {
}
