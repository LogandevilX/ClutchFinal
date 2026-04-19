package com.example.clutchfinal.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.clutchfinal.DTO.JugadorDTO;
import com.example.clutchfinal.DTO.JugadorResponseDTO;
import com.example.clutchfinal.Fabrica.FabricaJugadorService;
import com.example.clutchfinal.Model.Equipo;
import com.example.clutchfinal.Model.Jugador;
import com.example.clutchfinal.Repository.ClubRepository;
import com.example.clutchfinal.Repository.EquipoRepository;
import com.example.clutchfinal.Repository.JugadorRepository;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.Period;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class JugadorService {

    @Autowired
    private FabricaJugadorService fabricaJugadorService;
    @Autowired
    private JugadorRepository jugadorRepository;
    @Autowired
    private EquipoRepository equipoRepository;

    public JugadorDTO save(JugadorDTO dto) {
        Jugador jugador = fabricaJugadorService.createJugador(dto);
        // Comprobamos que el jpg introducido exista en el directorio correcto
        if(dto.getFoto() != null && !dto.getFoto().isEmpty()){
            Path ruta = Paths.get("upload/perfiles/", dto.getFoto());
            if (!Files.exists(ruta)) {
                throw new RuntimeException("La foto no existe en la carpeta uploads/perfiles");
            }
        }

        int edad = Period.between(dto.getFechaNacimiento(), LocalDate.now()).getYears();
        if(edad < 14){
            throw new IllegalArgumentException("El jugador debe tener por lo menos 14 años.");
        }

        Set<Equipo> equipos = Collections.emptySet();

        // --- LÓGICA DE EQUIPOS ---
        if (dto.getEquipoIds() != null && !dto.getEquipoIds().isEmpty()) {
            // Mapeamos los IDs a entidades Equipo
            equipos = dto.getEquipoIds().stream()
                    .map(id -> equipoRepository.findById(id)
                            .orElseThrow(() -> new NoSuchElementException("Equipo no encontrado con ID: " + id)))
                    .collect(Collectors.toSet());

            if (equipos.size() != dto.getEquipoIds().size()) {
                throw new NoSuchElementException("Uno o más equipos no fueron encontrados");
            }

            jugador.setEquipos(equipos);
        }

        Jugador jugadorGuardado = jugadorRepository.save(jugador);

        // Equipo es el lado propietario en la relación @ManyToMany, por lo que
        // necesitamos actualizar su colección para persistir la relación en la tabla intermedia.
        for (Equipo equipo : equipos) {
            equipo.getJugadores().add(jugadorGuardado);
        }
        if (!equipos.isEmpty()) {
            equipoRepository.saveAll(equipos);
        }

        return fabricaJugadorService.createJugadorDTO(jugadorGuardado);
    }

    public JugadorResponseDTO findById(Long id) {
        return jugadorRepository.findById(id)
                .map(fabricaJugadorService::createResponseDTO)
                .orElse(null);
    }

    public List<JugadorResponseDTO> findAll() {
        return fabricaJugadorService.createJugadoresDTO(jugadorRepository.findAll());
    }

    public void deleteById(Long id) {
        jugadorRepository.deleteById(id);
    }
}