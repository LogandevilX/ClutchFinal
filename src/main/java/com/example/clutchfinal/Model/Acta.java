package com.example.clutchfinal.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "Actas")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Acta {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_acta")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_partido", nullable = false)
    private Partido partido;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_jugador", nullable = false)
    private Jugador jugador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_equipo", nullable = false)
    private Equipo equipo;

    @Column(name = "dorsal", nullable = false)
    private Integer dorsal = 0;

    @Column(name = "titular", nullable = false)
    private Boolean titular = false;

    @Column(name = "minutos_jugados", nullable = false)
    private Integer minutosJugados = 0;

    @Column(name = "puntos", nullable = false)
    private Integer puntos = 0;

    @Column(name = "tl_tirados", nullable = false)
    private Integer tlTirados = 0;

    @Column(name = "tl_anotados", nullable = false)
    private Integer tlAnotados = 0;

    @Column(name = "t2_tirados", nullable = false)
    private Integer t2Tirados = 0;

    @Column(name = "t2_anotados", nullable = false)
    private Integer t2Anotados = 0;

    @Column(name = "triples_tirados", nullable = false)
    private Integer triplesTirados = 0;

    @Column(name = "triples_anotados", nullable = false)
    private Integer triplesAnotados = 0;

    @Column(name = "rebotes", nullable = false)
    private Integer rebotes = 0;

    @Column(name = "tapones", nullable = false)
    private Integer tapones = 0;

    @Column(name = "robos", nullable = false)
    private Integer robos = 0;

    @Column(name = "perdida", nullable = false)
    private Integer perdida = 0;

    @Column(name = "falta", nullable = false)
    private Integer falta = 0;

    @Column(name = "valoracion", nullable = false)
    private Integer valoracion = 0;

    @Column(name = "`+/-`", nullable = false)
    private Integer plusMinus = 0;
}
