package com.example.clutchfinal.Model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

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

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "equipos_jugadores",
            joinColumns = @JoinColumn(name = "id_equipo"),
            inverseJoinColumns = @JoinColumn(name = "id_jugador")
    )
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<Jugador> jugadores = new HashSet<>();

    @OneToMany(mappedBy = "equipo", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<EquipoEntrenador> equiposEntrenadores = new HashSet<>();
}
