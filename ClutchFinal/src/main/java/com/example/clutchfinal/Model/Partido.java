package com.example.clutchfinal.Model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "Partidos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Partido {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_partido")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_grupo", nullable = false)
    private Grupo grupo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_inscripcion_local", nullable = false)
    private Inscripcion inscripcionLocal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_inscripcion_visitante", nullable = false)
    private Inscripcion inscripcionVisitante;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @Column(name = "jornada", nullable = false)
    private Integer jornada;

    @Column(name = "fecha_hora_inicio", nullable = false)
    private LocalDateTime fechaHoraInicio;

    @Column(name = "fecha_hora_fin")
    private LocalDateTime fechaHoraFin;

    @Column(name = "puntos_local", nullable = false)
    private Integer puntosLocal = 0;

    @Column(name = "puntos_visitante", nullable = false)
    private Integer puntosVisitante = 0;

    @Column(name = "pabellonDeJuego", nullable = false)
    private String pabellonDeJuego;

    @Column(name = "periodo_actual")
    private Integer periodoActual = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private EstadoPartido estado = EstadoPartido.PROGRAMADO;

    @OneToMany(mappedBy = "partido", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("periodo ASC")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<ParcialPartido> parciales = new ArrayList<>();

    @OneToMany(mappedBy = "partido", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<Acta> actas = new HashSet<>();

    @OneToMany(mappedBy = "partido", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<HistorialPartido> eventos = new HashSet<>();

    public ParcialPartido getParcialActual() {
        if (this.periodoActual == null || this.periodoActual == 0) {
            this.periodoActual = 1;
        }
        if (this.parciales == null) {
            this.parciales = new ArrayList<>();
        }

        return this.parciales.stream()
                .filter(p -> p.getPeriodo().equals(this.periodoActual))
                .findFirst()
                .orElseGet(() -> {
                    ParcialPartido nuevoParcial = new ParcialPartido(this, this.periodoActual);
                    this.parciales.add(nuevoParcial);
                    return nuevoParcial;
                });
    }
}
