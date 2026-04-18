package com.example.clutchfinal.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.clutchfinal.DTO.EquipoDTO;
import com.example.clutchfinal.DTO.EquipoResponseDTO;
import com.example.clutchfinal.Fabrica.FabricaEquipoService;
import com.example.clutchfinal.Model.*;
import com.example.clutchfinal.Repository.CategoriaRepository;
import com.example.clutchfinal.Repository.ClubRepository;
import com.example.clutchfinal.Repository.EntrenadorRepository;
import com.example.clutchfinal.Repository.EquipoRepository;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class EquipoService {
    @Autowired
    private FabricaEquipoService fabricaEquipoService;
    @Autowired
    private EquipoRepository equipoRepository;
    @Autowired
    private ClubRepository clubRepository;
    @Autowired
    private CategoriaRepository categoriaRepository;
    @Autowired
    private EntrenadorRepository entrenadorRepository;

    public EquipoDTO save(EquipoDTO dto){
        Equipo equipo = fabricaEquipoService.createEquipo(dto);

        Optional<Club> clubOpt = clubRepository.findById(dto.getClubId());
        if (clubOpt.isEmpty()) {
            throw new NoSuchElementException("Club no encontrado con ID: " + dto.getClubId());
        }
        equipo.setClub(clubOpt.get());

        Equipo equipoGuardado = equipoRepository.save(equipo);

        if (dto.getEntrenadorIds() != null && !dto.getEntrenadorIds().isEmpty()) {
            Set<Long> idsSinDuplicados = dto.getEntrenadorIds().stream().collect(Collectors.toSet());
            if (idsSinDuplicados.size() != dto.getEntrenadorIds().size()) {
                throw new IllegalArgumentException("No se permiten IDs de entrenadores duplicados en el mismo equipo.");
            }
            if (idsSinDuplicados.size() > 2) {
                throw new IllegalArgumentException("Un equipo solo puede tener 2 entrenadores.");
            }

            List<Entrenador> entrenadores = dto.getEntrenadorIds().stream()
                    .map(id -> entrenadorRepository.findById(id)
                            .orElseThrow(() -> new NoSuchElementException("Entrenador no encontrado con ID: " + id)))
                    .toList();

            for (Entrenador entrenador : entrenadores) {
                if (!entrenador.getClub().getId().equals(dto.getClubId())) {
                    throw new IllegalArgumentException("El entrenador debe pertenecer al mismo club que el equipo.");
                }
                entrenador.setEquipo(equipoGuardado);
            }
            entrenadorRepository.saveAll(entrenadores);
        }

        return fabricaEquipoService.createEquipoDTO(equipoGuardado);
    }

    public EquipoResponseDTO findById(Long id){
        return equipoRepository.findById(id)
                .map(this::createEquipoResponse)
                .orElse(null);
    }

    public List<EquipoResponseDTO> findAll(){
        return equipoRepository.findAll().stream()
                .map(this::createEquipoResponse)
                .toList();
    }

    private EquipoResponseDTO createEquipoResponse(Equipo equipo) {
        String escudo = equipoRepository.getEscudo(equipo.getId());
        String pabellon = equipoRepository.getPabellon(equipo.getId());
        return fabricaEquipoService.createEquipoResponseDTO(equipo, escudo, pabellon);
    }

    public void deleteById(Long id){
        equipoRepository.deleteById(id);
    }
}
