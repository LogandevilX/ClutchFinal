package com.example.clutchfinal.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.clutchfinal.DTO.TemporadaDTO;
import com.example.clutchfinal.Fabrica.FabricaTemporadaService;
import com.example.clutchfinal.Model.Temporada;
import com.example.clutchfinal.Repository.TemporadaRepository;

import java.util.List;

@Service
public class TemporadaService {
    @Autowired
    private FabricaTemporadaService fabricaTemporadaService;
    @Autowired
    private TemporadaRepository temporadaRepository;

    public TemporadaDTO save(TemporadaDTO dto){
        Temporada temporada = fabricaTemporadaService.createTemporada(dto);

        if(dto.getFechaFin() != null){
            if(dto.getFechaFin().isBefore(dto.getFechaInicio())){
                throw new IllegalArgumentException("Ha introducido una fecha de finalizado incorrecta.");
            }
        }
        return fabricaTemporadaService.createTemporadaDTO(temporadaRepository.save(temporada));
    }

    public TemporadaDTO findById(Long id){
        return temporadaRepository.findById(id)
                .map(fabricaTemporadaService::createTemporadaDTO)
                .orElse(null);
    }

    public List<TemporadaDTO> findAll(){
        return fabricaTemporadaService.createTemporadasDTO(temporadaRepository.findAll());
    }

    public void deleteById(Long id){
        temporadaRepository.deleteById(id);
    }
}
