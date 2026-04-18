package com.example.clutchfinal.Model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "Entrenadores")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Entrenador {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_entrenador")
    private Long id;

    @Column(name = "DNI", nullable = false)
    private String dni;

    @Column(name = "nombre", nullable = false)
    private String nombre;

    @Column(name = "primer_apellido", nullable = false)
    private String primerApellido;

    @Column(name = "segundo_apellido")
    private String segundoApellido;

    @Column(name = "telefono", nullable = false)
    private String telefono;

    @Column(name = "fecha_nacimiento", nullable = false)
    private LocalDate fechaNacimiento;

    @Column(name = "titulo", nullable = false)
    private String titulo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_equipo", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Equipo equipo;
}
