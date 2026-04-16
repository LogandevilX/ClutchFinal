package com.example.clutchfinal.Model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Check;

@Entity
@Table(
        name = "equipos_entrenadores",
        uniqueConstraints = {
                @UniqueConstraint(name = "unique_equipo_rol", columnNames = {"id_equipo", "rol"})
        }
)
@Check(constraints = "rol IN ('PRIMER_ENTRENADOR', 'SEGUNDO_ENTRENADOR')")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EquipoEntrenador {

    @EmbeddedId
    private EquipoEntrenadorId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("equipoId")
    @JoinColumn(name = "id_equipo", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Equipo equipo;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("entrenadorId")
    @JoinColumn(name = "id_entrenador", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Entrenador entrenador;

    @Enumerated(EnumType.STRING)
    @Column(name = "rol", nullable = false)
    private RolEntrenador rol;

    public EquipoEntrenador(Equipo equipo, Entrenador entrenador, RolEntrenador rol) {
        this.equipo = equipo;
        this.entrenador = entrenador;
        this.rol = rol;
        this.id = new EquipoEntrenadorId(equipo.getId(), entrenador.getId());
    }
}
