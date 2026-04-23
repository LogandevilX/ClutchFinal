package com.example.clutchfinal.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.clutchfinal.DTO.ClubDTO;
import com.example.clutchfinal.DTO.ClubResponseDTO;
import com.example.clutchfinal.Fabrica.FabricaClubService;
import com.example.clutchfinal.Model.Club;
import com.example.clutchfinal.Model.Pabellon;
import com.example.clutchfinal.Repository.ClubRepository;
import com.example.clutchfinal.Repository.PabellonRepository;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ClubService {
    @Autowired
    private FabricaClubService fabricaClubService;
    @Autowired
    private ClubRepository clubRepository;
    @Autowired
    private PabellonRepository pabellonRepository;

    public ClubDTO save(ClubDTO dto){
        Club club;
        if (dto.getId() == null) {
            club = fabricaClubService.createClub(dto);
        } else {
            club = clubRepository.findById(dto.getId())
                    .orElseThrow(() -> new NoSuchElementException("Club no encontrado con ID: " + dto.getId()));
            club.setNombreClub(dto.getNombreClub());
            club.setCif(dto.getCif());
            club.setTelefono(dto.getTelefono());
            club.setDirectorTecnico(dto.getDirectorTecnico());
            club.setEscudo(dto.getEscudo());
        }

        // Comprobamos que el jpg introducido existo en el direcorio correcto
        if(dto.getEscudo() != null && !dto.getEscudo().isEmpty()){
            Path ruta = Paths.get("upload/escudos/", dto.getEscudo());
            if (!Files.exists(ruta)) {
                throw new RuntimeException("El escudo no existe en la carpeta uploads/escudos");
            }
        }

        if (dto.getPabellonIds() != null) {
            Set<Pabellon> pabellones = dto.getPabellonIds().stream()
                    .map(id -> pabellonRepository.findById(id)
                            .orElseThrow(() -> new NoSuchElementException("Pabellon no encontrado con ID: " + id)))
                    .collect(Collectors.toSet());

            if (pabellones.size() != dto.getPabellonIds().size()) {
                throw new NoSuchElementException("Uno o más pabellones no fueron encontrados");
            }
            club.setPabellones(pabellones);
        }

        return fabricaClubService.createClubDTO(clubRepository.save(club));
    }

    public ClubResponseDTO findById(Long id){
        return clubRepository.findById(id)
                .map(fabricaClubService::createResponseDTO)
                .orElse(null);
    }

    public List<ClubResponseDTO> findAll(){
        return fabricaClubService.createClubesDTO(clubRepository.findAll());
    }

    public void deleteById(Long id){
        clubRepository.deleteById(id);
    }
}
