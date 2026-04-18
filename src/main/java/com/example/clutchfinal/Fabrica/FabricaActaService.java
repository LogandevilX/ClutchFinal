package com.example.clutchfinal.Fabrica;

import com.example.clutchfinal.DTO.ActaDTO;
import com.example.clutchfinal.Model.Acta;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FabricaActaService {

    public ActaDTO createActaDTO(Acta acta) {
        return new ActaDTO(
                acta.getId(),
                acta.getPartido().getId(),
                acta.getJugador().getId(),
                acta.getEquipo().getId(),
                acta.getMinutosJugados(),
                acta.getPuntos(),
                acta.getTlTirados(),
                acta.getTlAnotados(),
                acta.getT2Tirados(),
                acta.getT2Anotados(),
                acta.getTriplesTirados(),
                acta.getTriplesAnotados(),
                acta.getRebotes(),
                acta.getTapones(),
                acta.getRobos(),
                acta.getPerdida(),
                acta.getValoracion(),
                acta.getPlusMinus()
        );
    }

    public List<ActaDTO> createActasDTO(List<Acta> actas) {
        return actas.stream().map(this::createActaDTO).collect(Collectors.toList());
    }
}
