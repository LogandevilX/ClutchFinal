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
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

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
        assignEquipo(jugadorGuardado, dto.getEquipoIds(), clubOpt.get().getId());
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

    private void assignEquipo(Jugador jugador, List<Long> equipoIds, Long clubId) {
        if (equipoIds == null || equipoIds.isEmpty()) {
            return;
        }
        if (equipoIds.size() > 1) {
            throw new IllegalArgumentException("Solo se puede asignar un equipo al crear o actualizar un jugador.");
        }

        Long equipoId = equipoIds.get(0);
        Equipo equipo = equipoRepository.findById(equipoId)
                .orElseThrow(() -> new NoSuchElementException("Equipo no encontrado con ID: " + equipoId));

        if (!equipo.getClub().getId().equals(clubId)) {
            throw new IllegalArgumentException("El equipo con ID " + equipoId + " no pertenece al club con ID " + clubId + ".");
        }

        if (equipo.getJugadores().stream().noneMatch(jugadorActual -> jugadorActual.getId().equals(jugador.getId()))) {
            equipo.getJugadores().add(jugador);
            equipoRepository.save(equipo);
        }
    }
}
