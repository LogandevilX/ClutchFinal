package com.example.clutchfinal.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.clutchfinal.Model.Temporada;

@Repository
public interface TemporadaRepository extends JpaRepository<Temporada, Long> {
}
