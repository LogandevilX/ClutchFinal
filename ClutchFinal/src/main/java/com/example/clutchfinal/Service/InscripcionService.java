package com.example.clutchfinal.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.clutchfinal.DTO.InscripcionDTO;
import com.example.clutchfinal.DTO.InscripcionesResponseDTO;
import com.example.clutchfinal.Fabrica.FabricaInscripcionService;
import com.example.clutchfinal.Model.Equipo;
import com.example.clutchfinal.Model.Fase;
import com.example.clutchfinal.Model.Grupo;
import com.example.clutchfinal.Model.Inscripcion;
import com.example.clutchfinal.Repository.EquipoRepository;
import com.example.clutchfinal.Repository.FaseRepository;
import com.example.clutchfinal.Repository.GrupoRepository;
import com.example.clutchfinal.Repository.InscripcionRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class InscripcionService {
    @Autowired
    private FabricaInscripcionService fabricaInscripcionService;
    @Autowired
    private InscripcionRepository inscripcionRepository;
    @Autowired
    private FaseRepository faseRepository;
    @Autowired
    private GrupoRepository grupoRepository;
    @Autowired
    private EquipoRepository equipoRepository;

    public InscripcionDTO save(InscripcionDTO dto){
        Inscripcion inscripcion = fabricaInscripcionService.createInscripcion(dto);

        if (dto.getId() == null) {
            inscripcion.setFechaInscripcion(LocalDateTime.now());
        }

        Optional<Fase> faseOpt = faseRepository.findById(dto.getFaseId());
        if (faseOpt.isEmpty()) {
            throw new NoSuchElementException("Fase no encontrada con ID: " + dto.getFaseId());
        }

        Optional<Grupo> grupoOpt = grupoRepository.findById(dto.getGrupoId());
        if (grupoOpt.isEmpty()) {
            throw new NoSuchElementException("Grupo no encontrado con ID: " + dto.getGrupoId());
        }

        Optional<Equipo> equipoOpt = equipoRepository.findById(dto.getEquipoId());
        if (equipoOpt.isEmpty()) {
            throw new NoSuchElementException("Equipo no encontrado con ID: " + dto.getEquipoId());
        }

        if (!faseOpt.get().getId().equals(grupoOpt.get().getFase().getId())) {
            throw new IllegalArgumentException("El grupo no pertenece a la fase indicada.");
        }

        Optional<Inscripcion> inscripcionMismaFase = inscripcionRepository
                .findByEquipoIdAndFaseId(dto.getEquipoId(), dto.getFaseId());
        if (inscripcionMismaFase.isPresent() && !inscripcionMismaFase.get().getId().equals(dto.getId())) {
            throw new IllegalArgumentException("Ese equipo ya está inscrito en la fase indicada.");
        }

        Optional<Inscripcion> inscripcionMismoGrupo = inscripcionRepository
                .findByEquipoIdAndGrupoId(dto.getEquipoId(), dto.getGrupoId());
        if (inscripcionMismoGrupo.isPresent() && !inscripcionMismoGrupo.get().getId().equals(dto.getId())) {
            throw new IllegalArgumentException("Ese equipo ya está inscrito en el grupo indicado.");
        }

        inscripcion.setFase(faseOpt.get());
        inscripcion.setGrupo(grupoOpt.get());
        inscripcion.setEquipo(equipoOpt.get());

        return fabricaInscripcionService.createInscripcionDTO(inscripcionRepository.save(inscripcion));
    }

    public InscripcionesResponseDTO findById(Long id){
        return inscripcionRepository.findById(id)
                .map(fabricaInscripcionService::createInscripcionResponseDTO)
                .orElse(null);
    }

    public List<InscripcionesResponseDTO> findAll(){
        return fabricaInscripcionService.createInscripcionesResponseDTO(inscripcionRepository.findAll());
    }

    public void deleteById(Long id){
        inscripcionRepository.deleteById(id);
    }
}
