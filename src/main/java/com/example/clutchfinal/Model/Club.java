package com.example.clutchfinal.Model;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "Clubes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Club {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_club")
    private Long id;

    @Column(name = "nombre_club", nullable = false)
    private String nombreClub;

    @Column(name = "CIF", nullable = false)
    private String cif;

    @Column(name = "telefono", nullable = false)
    private String telefono;

    @Column(name = "director_tecnico", nullable = false)
    private String directorTecnico;

    @Column(name = "escudo")
    private String escudo;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "Clubes_Pabellones",
            joinColumns = @JoinColumn(name = "id_club"),
            inverseJoinColumns = @JoinColumn(name = "id_pabellon")
    )
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<Pabellon> pabellones = new HashSet<>();
}
