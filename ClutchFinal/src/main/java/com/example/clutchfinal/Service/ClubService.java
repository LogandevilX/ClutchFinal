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
        if (dto.getId() != null) {
            throw new IllegalArgumentException("Para crear un club no debes enviar ID.");
        }
        Club club = fabricaClubService.createClub(dto);
        validarEscudo(dto.getEscudo());
        if (dto.getPabellonIds() != null) {
            aplicarPabellones(dto, club);
        }
        return fabricaClubService.createClubDTO(clubRepository.save(club));
    }

    public ClubDTO update(Long id, ClubDTO dto){
        Club club = clubRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Club no encontrado con ID: " + id));

        club.setNombreClub(dto.getNombreClub());
        club.setCif(dto.getCif());
        club.setTelefono(dto.getTelefono());
        club.setDirectorTecnico(dto.getDirectorTecnico());
        club.setEscudo(dto.getEscudo());

        validarEscudo(dto.getEscudo());
        if (dto.getPabellonIds() != null) {
            aplicarPabellones(dto, club);
        }

        return fabricaClubService.createClubDTO(clubRepository.save(club));
    }

    private void validarEscudo(String escudo) {
        // Comprobamos que el jpg introducido existo en el direcorio correcto
        if(escudo != null && !escudo.isEmpty()){
            Path ruta = Paths.get("upload/escudos/", escudo);
            if (!Files.exists(ruta)) {
                throw new RuntimeException("El escudo no existe en la carpeta uploads/escudos");
            }
        }
    }

    private void aplicarPabellones(ClubDTO dto, Club club) {
        Set<Pabellon> pabellones = dto.getPabellonIds().stream()
                .map(id -> pabellonRepository.findById(id)
                        .orElseThrow(() -> new NoSuchElementException("Pabellon no encontrado con ID: " + id)))
                .collect(Collectors.toSet());

        if (pabellones.size() != dto.getPabellonIds().size()) {
            throw new NoSuchElementException("Uno o más pabellones no fueron encontrados");
        }
        club.setPabellones(pabellones);
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
