package com.example.clutchfinal.Fabrica;


import org.springframework.stereotype.Service;
import com.example.clutchfinal.DTO.ClubDTO;
import com.example.clutchfinal.DTO.ClubResponseDTO;
import com.example.clutchfinal.Model.Club;
import com.example.clutchfinal.Model.Pabellon;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class FabricaClubService {
    public Club createClub(ClubDTO dto){
        Club club = new Club();
        club.setId(dto.getId());
        club.setNombreClub(dto.getNombreClub());
        club.setCif(dto.getCif());
        club.setTelefono(dto.getTelefono());
        club.setDirectorTecnico(dto.getDirectorTecnico());
        club.setEscudo(dto.getEscudo());
        return club;
    }

    public ClubDTO createClubDTO(Club club){
        ClubDTO dto = new ClubDTO();
        dto.setId(club.getId());
        dto.setNombreClub(club.getNombreClub());
        dto.setCif(club.getCif());
        dto.setTelefono(club.getTelefono());
        dto.setDirectorTecnico(club.getDirectorTecnico());
        dto.setEscudo(club.getEscudo());
        Set<Long> pabellonIds = club.getPabellones().stream()
                .map(Pabellon::getId)
                .collect(Collectors.toSet());
        dto.setPabellonIds(pabellonIds);
        return dto;
    }

    public ClubResponseDTO createResponseDTO(Club club){
        ClubResponseDTO dto = new ClubResponseDTO();
        dto.setId(club.getId());
        dto.setNombreClub(club.getNombreClub());
        dto.setCif(club.getCif());
        dto.setTelefono(club.getTelefono());
        dto.setDirectorTecnico(club.getDirectorTecnico());
        // Nos aseguramos de que la respuesta contenga la ruta relativa del escudo
        if(club.getEscudo() != null)
            dto.setPathEscudo("/escudos/" +club.getEscudo());

        Set<Long> pabellonIds = club.getPabellones().stream()
                .map(Pabellon::getId)
                .collect(Collectors.toSet());
        dto.setPabellonIds(pabellonIds);
        return dto;
    }

    public List<ClubResponseDTO> createClubesDTO(List<Club> listaClubes){
        return listaClubes.stream().map(this::createResponseDTO).collect(Collectors.toList());
    }
}
