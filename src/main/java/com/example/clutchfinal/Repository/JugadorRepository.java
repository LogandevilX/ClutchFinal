package com.example.clutchfinal.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.clutchfinal.Model.Jugador;

@Repository
public interface JugadorRepository extends JpaRepository<Jugador, Long> {
}
