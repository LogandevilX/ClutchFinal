package com.example.clutchfinal.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "Historial_Partidos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HistorialPartido {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_evento")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_partido", nullable = false)
    private Partido partido;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_equipo", nullable = false)
    private Equipo equipo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_jugador")
    private Jugador jugador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_entrenador")
    private Entrenador entrenador;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_evento", nullable = false)
    private EventoPartido tipoEvento;

    @Column(name = "acierto")
    private String acierto;

    @Column(name = "periodo", nullable = false)
    private Integer periodo;

    @Column(name = "minuto", nullable = false)
    private Integer minuto;

    @Column(name = "segundo", nullable = false)
    private Integer segundo;

    @Column(name = "posicion")
    private String posicion;
}
