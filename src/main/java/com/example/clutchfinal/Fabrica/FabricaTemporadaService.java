package com.example.clutchfinal.Fabrica;

import org.springframework.stereotype.Service;
import com.example.clutchfinal.DTO.TemporadaDTO;
import com.example.clutchfinal.Model.Temporada;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FabricaTemporadaService {
    public Temporada createTemporada(TemporadaDTO dto){
        Temporada temporada = new Temporada();
        temporada.setId(dto.getId());
        temporada.setDenominacion(dto.getDenominacion());
        temporada.setFechaInicio(dto.getFechaInicio());
        temporada.setFechaFin(dto.getFechaFin());
        temporada.setEstado(dto.getEstado());
        return temporada;
    }

    public TemporadaDTO createTemporadaDTO(Temporada temporada){
        TemporadaDTO dto = new TemporadaDTO();
        dto.setId(temporada.getId());
        dto.setDenominacion(temporada.getDenominacion());
        dto.setFechaInicio(temporada.getFechaInicio());
        dto.setFechaFin(temporada.getFechaFin());
        dto.setEstado(temporada.getEstado());
        return dto;
    }

    public List<TemporadaDTO> createTemporadasDTO(List<Temporada> lista){
        return lista.stream().map(this::createTemporadaDTO).collect(Collectors.toList());
    }
}
