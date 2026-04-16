package com.example.clutchfinal.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.clutchfinal.DTO.EntrenadorDTO;
import com.example.clutchfinal.DTO.EquipoEntrenadorDTO;
import com.example.clutchfinal.Fabrica.FabricaEntrenadorService;
import com.example.clutchfinal.Model.Club;
import com.example.clutchfinal.Model.Entrenador;
import com.example.clutchfinal.Model.Equipo;
import com.example.clutchfinal.Model.EquipoEntrenador;
import com.example.clutchfinal.Model.EquipoEntrenadorId;
import com.example.clutchfinal.Repository.ClubRepository;
import com.example.clutchfinal.Repository.EntrenadorRepository;
import com.example.clutchfinal.Repository.EquipoRepository;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

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

        int edad = Period.between(dto.getFechaNacimiento(), LocalDate.now()).getYears();
        if(edad < 16){
            throw new IllegalArgumentException("El entrenador debe tener por lo menos 16 años.");
        }

        Entrenador entrenadorGuardado = entrenadorRepository.save(entrenador);

        if (dto.getEquipos() != null && !dto.getEquipos().isEmpty()) {
            entrenadorGuardado.getEquiposEntrenadores().clear();

            for (EquipoEntrenadorDTO relacionDto : dto.getEquipos()) {
                if (relacionDto.getEquipoId() == null || relacionDto.getRol() == null) {
                    throw new IllegalArgumentException("Cada relación de entrenador-equipo debe incluir equipoId y rol.");
                }

                Equipo equipo = equipoRepository.findById(relacionDto.getEquipoId())
                        .orElseThrow(() -> new NoSuchElementException("Equipo no encontrado con ID: " + relacionDto.getEquipoId()));

                EquipoEntrenador relacion = new EquipoEntrenador();
                relacion.setId(new EquipoEntrenadorId(equipo.getId(), entrenadorGuardado.getId()));
                relacion.setEquipo(equipo);
                relacion.setEntrenador(entrenadorGuardado);
                relacion.setRol(relacionDto.getRol());

                entrenadorGuardado.getEquiposEntrenadores().add(relacion);
            }

            entrenadorGuardado = entrenadorRepository.save(entrenadorGuardado);
        }

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
