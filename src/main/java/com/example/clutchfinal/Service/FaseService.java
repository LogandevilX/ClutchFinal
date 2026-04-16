package com.example.clutchfinal.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.clutchfinal.DTO.FaseDTO;
import com.example.clutchfinal.Fabrica.FabricaFaseService;
import com.example.clutchfinal.Model.Division;
import com.example.clutchfinal.Model.Fase;
import com.example.clutchfinal.Repository.DivisionRepository;
import com.example.clutchfinal.Repository.FaseRepository;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class FaseService {
    @Autowired
    private FabricaFaseService fabricaFaseService;
    @Autowired
    private FaseRepository faseRepository;
    @Autowired
    private DivisionRepository divisionRepository;

    public FaseDTO save(FaseDTO dto){
        Fase fase = fabricaFaseService.createFase(dto);

        Optional<Division> divisionOpt = divisionRepository.findById(dto.getDivisionId());
        if (divisionOpt.isEmpty()) {
            throw new NoSuchElementException("Division no encontrada con ID: " + dto.getDivisionId());
        }
        fase.setDivision(divisionOpt.get());

        if(dto.getFechaFin() != null){
            if(dto.getFechaFin().isBefore(dto.getFechaInicio())){
                throw new IllegalArgumentException("Ha introducido una fecha de finalizado incorrecta.");
            }
        }

        return fabricaFaseService.createFaseDTO(faseRepository.save(fase));
    }

    public FaseDTO findById(Long id){
        return faseRepository.findById(id)
                .map(fabricaFaseService::createFaseDTO)
                .orElse(null);
    }

    public List<FaseDTO> findAll(){
        return fabricaFaseService.createFasesDTO(faseRepository.findAll());
    }

    public void deleteById(Long id){
        faseRepository.deleteById(id);
    }
}
