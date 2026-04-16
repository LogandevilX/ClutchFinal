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
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class EntrenadorService {
    private static final int MAX_ENTRENADORES_POR_EQUIPO = 2;

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
        syncEquipos(entrenadorGuardado, dto.getEquipoIds());
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

    private void syncEquipos(Entrenador entrenador, List<Long> equipoIds) {
        if (equipoIds == null) {
            return;
        }

        List<Equipo> equiposActuales = equipoRepository.findAll().stream()
                .filter(equipo -> equipo.getEntrenadores().stream()
                        .anyMatch(entrenadorActual -> entrenadorActual.getId().equals(entrenador.getId())))
                .toList();

        for (Equipo equipoActual : equiposActuales) {
            equipoActual.getEntrenadores().removeIf(entrenadorActual -> entrenadorActual.getId().equals(entrenador.getId()));
            equipoRepository.save(equipoActual);
        }

        List<Equipo> nuevosEquipos = new ArrayList<>();
        for (Long equipoId : equipoIds) {
            Equipo equipo = equipoRepository.findById(equipoId)
                    .orElseThrow(() -> new NoSuchElementException("Equipo no encontrado con ID: " + equipoId));
            nuevosEquipos.add(equipo);
        }

        for (Equipo equipo : nuevosEquipos) {
            if (equipo.getEntrenadores().stream().noneMatch(entrenadorActual -> entrenadorActual.getId().equals(entrenador.getId()))) {
                if (equipo.getEntrenadores().size() >= MAX_ENTRENADORES_POR_EQUIPO) {
                    throw new IllegalArgumentException("El equipo con ID " + equipo.getId() + " ya tiene el máximo de 2 entrenadores.");
                }
                equipo.getEntrenadores().add(entrenador);
                equipoRepository.save(equipo);
            }
        }
    }
}
