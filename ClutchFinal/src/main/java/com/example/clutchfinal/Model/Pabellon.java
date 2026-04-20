package com.example.clutchfinal.Model;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "Pabellones")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Pabellon {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pabellon")
    private Long id;

    @Column(name = "codigo_postal", nullable = false)
    private Integer codigoPostal;

    @Column(name = "direccion", nullable = false)
    private String direccion;

    @Column(name = "nombre_pabellon", nullable = false)
    private String nombrePabellon;

    @ManyToMany(mappedBy = "pabellones", fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<Club> clubes = new HashSet<>();
}
