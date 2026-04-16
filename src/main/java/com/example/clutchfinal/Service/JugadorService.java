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
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class JugadorService {
    private static final int MAX_JUGADORES_POR_EQUIPO = 15;

    @Autowired
    private FabricaJugadorService fabricaJugadorService;
    @Autowired
    private JugadorRepository jugadorRepository;
    @Autowired
    private ClubRepository clubRepository;
    @Autowired
    private EquipoRepository equipoRepository;

    public JugadorDTO save(JugadorDTO dto){
        Jugador jugador = fabricaJugadorService.createJugador(dto);

        // Comprobamos que el jpg introducido existo en el direcorio correcto
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

        Jugador jugadorGuardado = jugadorRepository.save(jugador);
        syncEquipos(jugadorGuardado, dto.getEquipoIds());
        return fabricaJugadorService.createJugadorDTO(jugadorGuardado);
    }

    public JugadorResponseDTO findById(Long id){
        return jugadorRepository.findById(id)
                .map(fabricaJugadorService::createResponseDTO)
                .orElse(null);
    }

    public List<JugadorResponseDTO> findAll(){
        return fabricaJugadorService.createJugadoresDTO(jugadorRepository.findAll());
    }

    public void deleteById(Long id){
        jugadorRepository.deleteById(id);
    }

    private void syncEquipos(Jugador jugador, List<Long> equipoIds) {
        if (equipoIds == null) {
            return;
        }

        List<Equipo> equiposActuales = equipoRepository.findAll().stream()
                .filter(equipo -> equipo.getJugadores().stream()
                        .anyMatch(jugadorActual -> jugadorActual.getId().equals(jugador.getId())))
                .toList();

        for (Equipo equipoActual : equiposActuales) {
            equipoActual.getJugadores().removeIf(jugadorActual -> jugadorActual.getId().equals(jugador.getId()));
            equipoRepository.save(equipoActual);
        }

        List<Equipo> nuevosEquipos = new ArrayList<>();
        for (Long equipoId : equipoIds) {
            Equipo equipo = equipoRepository.findById(equipoId)
                    .orElseThrow(() -> new NoSuchElementException("Equipo no encontrado con ID: " + equipoId));
            nuevosEquipos.add(equipo);
        }

        for (Equipo equipo : nuevosEquipos) {
            if (equipo.getJugadores().stream().noneMatch(jugadorActual -> jugadorActual.getId().equals(jugador.getId()))) {
                if (equipo.getJugadores().size() >= MAX_JUGADORES_POR_EQUIPO) {
                    throw new IllegalArgumentException("El equipo con ID " + equipo.getId() + " ya tiene el máximo de 15 jugadores.");
                }
                equipo.getJugadores().add(jugador);
                equipoRepository.save(equipo);
            }
        }
    }
}
