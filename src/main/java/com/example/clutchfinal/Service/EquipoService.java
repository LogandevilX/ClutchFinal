package com.example.clutchfinal.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.clutchfinal.DTO.EquipoDTO;
import com.example.clutchfinal.DTO.EquipoResponseDTO;
import com.example.clutchfinal.Fabrica.FabricaEquipoService;
import com.example.clutchfinal.Model.Club;
import com.example.clutchfinal.Model.Equipo;
import com.example.clutchfinal.Repository.CategoriaRepository;
import com.example.clutchfinal.Repository.ClubRepository;
import com.example.clutchfinal.Repository.EquipoRepository;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class EquipoService {
    @Autowired
    private FabricaEquipoService fabricaEquipoService;
    @Autowired
    private EquipoRepository equipoRepository;
    @Autowired
    private ClubRepository clubRepository;
    @Autowired
    private CategoriaRepository categoriaRepository;

    public EquipoDTO save(EquipoDTO dto){
        Equipo equipo = fabricaEquipoService.createEquipo(dto);

        Optional<Club> clubOpt = clubRepository.findById(dto.getClubId());
        if (clubOpt.isEmpty()) {
            throw new NoSuchElementException("Club no encontrado con ID: " + dto.getClubId());
        }
        equipo.setClub(clubOpt.get());

        return fabricaEquipoService.createEquipoDTO(equipoRepository.save(equipo));
    }

    public EquipoResponseDTO findById(Long id){
        return equipoRepository.findById(id)
                .map(this::createEquipoResponse)
                .orElse(null);
    }

    public List<EquipoResponseDTO> findAll(){
        return equipoRepository.findAll().stream()
                .map(this::createEquipoResponse)
                .toList();
    }

    private EquipoResponseDTO createEquipoResponse(Equipo equipo) {
        String escudo = equipoRepository.getEscudo(equipo.getId());
        String pabellon = equipoRepository.getPabellon(equipo.getId());
        return fabricaEquipoService.createEquipoResponseDTO(equipo, escudo, pabellon);
    }

    public void deleteById(Long id){
        equipoRepository.deleteById(id);
    }
}
