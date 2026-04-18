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

        if (dto.getEntrenadorId() == null) {
            throw new IllegalArgumentException("Debes informar entrenadorId para el equipo.");
        }

        Optional<Entrenador> entrenadorOpt = entrenadorRepository.findById(dto.getEntrenadorId());
        if (entrenadorOpt.isEmpty()) {
            throw new NoSuchElementException("Entrenador no encontrado con ID: " + dto.getEntrenadorId());
        }
        Entrenador entrenador = entrenadorOpt.get();

        if (!entrenador.getClub().getId().equals(dto.getClubId())) {
            throw new IllegalArgumentException("El entrenador debe pertenecer al mismo club que el equipo.");
        }

        equipo.setEntrenador(entrenador);

        Equipo equipoGuardado = equipoRepository.save(equipo);
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
