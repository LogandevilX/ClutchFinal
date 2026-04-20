package com.example.clutchfinal.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.clutchfinal.DTO.PabellonDTO;
import com.example.clutchfinal.Fabrica.FabricaPabellonService;
import com.example.clutchfinal.Model.Club;
import com.example.clutchfinal.Model.Pabellon;
import com.example.clutchfinal.Repository.ClubRepository;
import com.example.clutchfinal.Repository.PabellonRepository;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PabellonService {
    @Autowired
    private FabricaPabellonService fabricaPabellonService;
    @Autowired
    private PabellonRepository pabellonRepository;
    @Autowired
    private ClubRepository clubRepository;

    public PabellonDTO save(PabellonDTO dto){
        Pabellon pabellon = fabricaPabellonService.createPabellon(dto);

        if (dto.getClubIds() != null && !dto.getClubIds().isEmpty()) {
            Set<Club> clubes = dto.getClubIds().stream()
                    .map(id -> clubRepository.findById(id)
                            .orElseThrow(() -> new NoSuchElementException("Club no encontrado con ID: " + id)))
                    .collect(Collectors.toSet());

            if (clubes.size() != dto.getClubIds().size()) {
                throw new NoSuchElementException("Uno o más clubes no fueron encontrados");
            }
            pabellon.setClubes(clubes);
        }

        return fabricaPabellonService.createPabellonDTO(pabellonRepository.save(pabellon));
    }

    public PabellonDTO findById(Long id){
        return pabellonRepository.findById(id)
                .map(fabricaPabellonService::createPabellonDTO)
                .orElse(null);
    }

    public List<PabellonDTO> findAll(){
        return fabricaPabellonService.createPabellonesDTO(pabellonRepository.findAll());
    }

    public void deleteById(Long id){
        pabellonRepository.deleteById(id);
    }
}
