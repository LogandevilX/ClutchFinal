package com.example.clutchfinal.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.clutchfinal.DTO.JugadorDTO;
import com.example.clutchfinal.DTO.JugadorResponseDTO;
import com.example.clutchfinal.Fabrica.FabricaJugadorService;
import com.example.clutchfinal.Model.Club;
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
    private ClubRepository clubRepository;
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

        Optional<Club> clubOpt = clubRepository.findById(dto.getClubId());
        if (clubOpt.isEmpty()) {
            throw new NoSuchElementException("Club no encontrado con ID: " + dto.getClubId());
        }
        jugador.setClub(clubOpt.get());

        int edad = Period.between(dto.getFechaNacimiento(), LocalDate.now()).getYears();
        if(edad < 14){
            throw new IllegalArgumentException("El jugador debe tener por lo menos 14 años.");
        }

        // --- LÓGICA DE EQUIPOS ---
        if (dto.getEquipoIds() != null && !dto.getEquipoIds().isEmpty()) {
            // Mapeamos los IDs a entidades Equipo
            Set<Equipo> equipos = dto.getEquipoIds().stream()
                    .map(id -> equipoRepository.findById(id)
                            .orElseThrow(() -> new NoSuchElementException("Equipo no encontrado con ID: " + id)))
                    .collect(Collectors.toSet());

            if (equipos.size() != dto.getEquipoIds().size()) {
                throw new NoSuchElementException("Uno o más equipos no fueron encontrados");
            }

            // Asignación directa, delegando la persistencia a JPA
            jugador.setEquipos(equipos);
        }

        Jugador jugadorGuardado = jugadorRepository.save(jugador);
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