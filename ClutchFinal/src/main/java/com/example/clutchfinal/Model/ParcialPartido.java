package com.example.clutchfinal.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "partido_parciales")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ParcialPartido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_parcial")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_partido", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Partido partido;

    @Column(name = "periodo", nullable = false)
    private Integer periodo;

    @Column(name = "puntos_local", nullable = false)
    private Integer puntosLocal = 0;

    @Column(name = "puntos_visitante", nullable = false)
    private Integer puntosVisitante = 0;

    public ParcialPartido(Partido partido, Integer periodo) {
        this.partido = partido;
        this.periodo = periodo;
        this.puntosLocal = 0;
        this.puntosVisitante = 0;
    }
}
