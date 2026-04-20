package com.example.clutchfinal.Fabrica;

import org.springframework.stereotype.Service;
import com.example.clutchfinal.DTO.PabellonDTO;
import com.example.clutchfinal.Model.Club;
import com.example.clutchfinal.Model.Pabellon;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class FabricaPabellonService {
    public Pabellon createPabellon(PabellonDTO dto){
        Pabellon pabellon = new Pabellon();
        pabellon.setId(dto.getId());
        pabellon.setCodigoPostal(dto.getCodigoPostal());
        pabellon.setDireccion(dto.getDireccion());
        pabellon.setNombrePabellon(dto.getNombrePabellon());
        return pabellon;
    }

    public PabellonDTO createPabellonDTO(Pabellon pabellon){
        PabellonDTO dto = new PabellonDTO();
        dto.setId(pabellon.getId());
        dto.setCodigoPostal(pabellon.getCodigoPostal());
        dto.setDireccion(pabellon.getDireccion());
        dto.setNombrePabellon(pabellon.getNombrePabellon());
        Set<Long> clubIds = pabellon.getClubes().stream()
                .map(Club::getId)
                .collect(Collectors.toSet());
        dto.setClubIds(clubIds);
        return dto;
    }

    public List<PabellonDTO> createPabellonesDTO(List<Pabellon> listaPabellones){
        return listaPabellones.stream().map(this::createPabellonDTO).collect(Collectors.toList());
    }
}
