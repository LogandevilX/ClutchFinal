package com.example.clutchfinal.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "Equipos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Equipo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_equipo")
    private Long id;

    @Column(name = "nombre_equipo", nullable = false)
    private String nombreEquipo;

    @Column(name = "partidos_ganados", nullable = false)
    private Integer partidosGanados;

    @Column(name = "partidos_perdidos", nullable = false)
    private Integer partidosPerdidos;

    @Column(name = "puntos", nullable = false)
    private Integer puntos;

    @Column(name = "posicion")
    private Integer posicion;

    @Column(name = "puntos_a_favor", nullable = false)
    private BigDecimal puntosAFavor;

    @Column(name = "puntos_en_contra", nullable = false)
    private BigDecimal puntosEnContra;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_club", nullable = false)
    private Club club;

    @ManyToMany
    @JoinTable(
            name = "Equipos_Jugadores",
            joinColumns = @JoinColumn(name = "id_equipo"),
            inverseJoinColumns = @JoinColumn(name = "id_jugador")
    )
    private List<Jugador> jugadores = new ArrayList<>();
    @ManyToMany
    @JoinTable(
            name = "Equipos_Entrenadores",
            joinColumns = @JoinColumn(name = "id_equipo"),
            inverseJoinColumns = @JoinColumn(name = "id_entrenador")
    )
    private List<Entrenador> entrenadores = new ArrayList<>();

}

