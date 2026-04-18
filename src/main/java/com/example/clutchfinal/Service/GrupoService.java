package com.example.clutchfinal.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.clutchfinal.DTO.GrupoDTO;
import com.example.clutchfinal.Fabrica.FabricaGrupoService;
import com.example.clutchfinal.Model.Fase;
import com.example.clutchfinal.Model.Grupo;
import com.example.clutchfinal.Repository.FaseRepository;
import com.example.clutchfinal.Repository.GrupoRepository;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class GrupoService {
    @Autowired
    private FabricaGrupoService fabricaGrupoService;
    @Autowired
    private GrupoRepository grupoRepository;
    @Autowired
    private FaseRepository faseRepository;

    public GrupoDTO save(GrupoDTO dto){
        Grupo grupo = fabricaGrupoService.createGrupo(dto);

        Optional<Fase> faseOpt = faseRepository.findById(dto.getFaseId());
        if (faseOpt.isEmpty()) {
            throw new NoSuchElementException("Fase no encontrada con ID: " + dto.getFaseId());
        }
        grupo.setFase(faseOpt.get());

        return fabricaGrupoService.createGrupoDTO(grupoRepository.save(grupo));
    }

    public GrupoDTO findById(Long id){
        return grupoRepository.findById(id)
                .map(fabricaGrupoService::createGrupoDTO)
                .orElse(null);
    }

    public List<GrupoDTO> findAll(){
        return fabricaGrupoService.createGruposDTO(grupoRepository.findAll());
    }

    public void deleteById(Long id){
        grupoRepository.deleteById(id);
    }
}
