package com.example.clutchfinal.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.clutchfinal.DTO.InscripcionDTO;
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

        inscripcion.setFase(faseOpt.get());
        inscripcion.setGrupo(grupoOpt.get());
        inscripcion.setEquipo(equipoOpt.get());

        return fabricaInscripcionService.createInscripcionDTO(inscripcionRepository.save(inscripcion));
    }

    public InscripcionDTO findById(Long id){
        return inscripcionRepository.findById(id)
                .map(fabricaInscripcionService::createInscripcionDTO)
                .orElse(null);
    }

    public List<InscripcionDTO> findAll(){
        return fabricaInscripcionService.createInscripcionesDTO(inscripcionRepository.findAll());
    }

    public void deleteById(Long id){
        inscripcionRepository.deleteById(id);
    }
}
