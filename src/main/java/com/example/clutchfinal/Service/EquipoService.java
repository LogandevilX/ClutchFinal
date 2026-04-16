package com.example.clutchfinal.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import com.example.clutchfinal.DTO.EquipoDTO;
import com.example.clutchfinal.DTO.EquipoEntrenadorDTO;
import com.example.clutchfinal.DTO.EquipoResponseDTO;
import com.example.clutchfinal.Fabrica.FabricaEquipoService;
import com.example.clutchfinal.Model.*;
import com.example.clutchfinal.Repository.CategoriaRepository;
import com.example.clutchfinal.Repository.ClubRepository;
import com.example.clutchfinal.Repository.EntrenadorRepository;
import com.example.clutchfinal.Repository.EquipoEntrenadorRepository;
import com.example.clutchfinal.Repository.EquipoRepository;

import java.util.HashSet;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.Set;

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
    @Autowired
    private EquipoEntrenadorRepository equipoEntrenadorRepository;

    public EquipoDTO save(EquipoDTO dto){
        Equipo equipo = fabricaEquipoService.createEquipo(dto);

        Optional<Club> clubOpt = clubRepository.findById(dto.getClubId());
        if (clubOpt.isEmpty()) {
            throw new NoSuchElementException("Club no encontrado con ID: " + dto.getClubId());
        }
        equipo.setClub(clubOpt.get());

        Equipo equipoGuardado = equipoRepository.save(equipo);

        if (dto.getEntrenadores() != null) {
            guardarEntrenadoresDeEquipo(equipoGuardado, dto.getEntrenadores());
            equipoGuardado = equipoRepository.findById(equipoGuardado.getId())
                    .orElseThrow(() -> new NoSuchElementException("Equipo no encontrado con ID: " + equipoGuardado.getId()));
        }

        return fabricaEquipoService.createEquipoDTO(equipoGuardado);
    }

    public EquipoEntrenadorDTO addEntrenador(Long equipoId, EquipoEntrenadorDTO dto) {
        if (dto.getEntrenadorId() == null || dto.getRol() == null) {
            throw new IllegalArgumentException("Debes informar entrenadorId y rol.");
        }

        Equipo equipo = equipoRepository.findById(equipoId)
                .orElseThrow(() -> new NoSuchElementException("Equipo no encontrado con ID: " + equipoId));

        Entrenador entrenador = entrenadorRepository.findById(dto.getEntrenadorId())
                .orElseThrow(() -> new NoSuchElementException("Entrenador no encontrado con ID: " + dto.getEntrenadorId()));

        if (equipoEntrenadorRepository.existsByEquipo_IdAndRol(equipoId, dto.getRol())) {
            throw new DataIntegrityViolationException("El equipo ya tiene un " + dto.getRol());
        }

        EquipoEntrenador relacion = new EquipoEntrenador();
        relacion.setId(new EquipoEntrenadorId(equipo.getId(), entrenador.getId()));
        relacion.setEquipo(equipo);
        relacion.setEntrenador(entrenador);
        relacion.setRol(dto.getRol());

        EquipoEntrenador guardada = equipoEntrenadorRepository.save(relacion);

        EquipoEntrenadorDTO response = new EquipoEntrenadorDTO();
        response.setEquipoId(guardada.getEquipo().getId());
        response.setEntrenadorId(guardada.getEntrenador().getId());
        response.setRol(guardada.getRol());
        return response;
    }

    private void guardarEntrenadoresDeEquipo(Equipo equipo, List<EquipoEntrenadorDTO> entrenadores) {
        equipoEntrenadorRepository.deleteAll(equipo.getEquiposEntrenadores());

        Set<RolEntrenador> rolesUsados = new HashSet<>();
        for (EquipoEntrenadorDTO entrenadorDTO : entrenadores) {
            if (entrenadorDTO.getEntrenadorId() == null || entrenadorDTO.getRol() == null) {
                throw new IllegalArgumentException("Cada entrenador debe incluir entrenadorId y rol.");
            }

            if (!rolesUsados.add(entrenadorDTO.getRol())) {
                throw new IllegalArgumentException("No puedes repetir el rol " + entrenadorDTO.getRol() + " en el mismo equipo.");
            }

            Entrenador entrenador = entrenadorRepository.findById(entrenadorDTO.getEntrenadorId())
                    .orElseThrow(() -> new NoSuchElementException("Entrenador no encontrado con ID: " + entrenadorDTO.getEntrenadorId()));

            EquipoEntrenador relacion = new EquipoEntrenador();
            relacion.setId(new EquipoEntrenadorId(equipo.getId(), entrenador.getId()));
            relacion.setEquipo(equipo);
            relacion.setEntrenador(entrenador);
            relacion.setRol(entrenadorDTO.getRol());

            equipoEntrenadorRepository.save(relacion);
        }
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
