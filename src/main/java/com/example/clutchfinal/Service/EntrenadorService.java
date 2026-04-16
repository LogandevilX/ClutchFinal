package com.example.clutchfinal.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.clutchfinal.DTO.EntrenadorDTO;
import com.example.clutchfinal.Fabrica.FabricaEntrenadorService;
import com.example.clutchfinal.Model.Club;
import com.example.clutchfinal.Model.Entrenador;
import com.example.clutchfinal.Model.Equipo;
import com.example.clutchfinal.Repository.ClubRepository;
import com.example.clutchfinal.Repository.EntrenadorRepository;
import com.example.clutchfinal.Repository.EquipoRepository;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class EntrenadorService {
    @Autowired
    private FabricaEntrenadorService fabricaEntrenadorService;
    @Autowired
    private EntrenadorRepository entrenadorRepository;
    @Autowired
    private ClubRepository clubRepository;
    @Autowired
    private EquipoRepository equipoRepository;

    public EntrenadorDTO save(EntrenadorDTO dto){
        Entrenador entrenador = fabricaEntrenadorService.createEntrenador(dto);

        Optional<Club> clubOpt = clubRepository.findById(dto.getClubId());
        if (clubOpt.isEmpty()) {
            throw new NoSuchElementException("Club no encontrado con ID: " + dto.getClubId());
        }
        entrenador.setClub(clubOpt.get());

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
            entrenador.setEquipos(equipos);
        }

        int edad = Period.between(dto.getFechaNacimiento(), LocalDate.now()).getYears();
        if(edad < 16){
            throw new IllegalArgumentException("El entrenador debe tener por lo menos 16 años.");
        }


        Entrenador entrenadorGuardado = entrenadorRepository.save(entrenador);
        return fabricaEntrenadorService.createEntrenadorDTO(entrenadorGuardado);
    }

    public EntrenadorDTO findById(Long id){
        return entrenadorRepository.findById(id)
                .map(fabricaEntrenadorService::createEntrenadorDTO)
                .orElse(null);
    }

    public List<EntrenadorDTO> findAll(){
        return fabricaEntrenadorService.createEntrenadoresDTO(entrenadorRepository.findAll());
    }

    public void deleteById(Long id){
        entrenadorRepository.deleteById(id);
    }
}
