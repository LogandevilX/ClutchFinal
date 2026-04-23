package com.example.clutchfinal.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.clutchfinal.DTO.EquipoDTO;
import com.example.clutchfinal.DTO.EquipoDetalleDTO;
import com.example.clutchfinal.DTO.EquipoResponseDTO;
import com.example.clutchfinal.DTO.EntrenadorDTO;
import com.example.clutchfinal.DTO.JugadorResponseDTO;
import com.example.clutchfinal.Fabrica.FabricaEntrenadorService;
import com.example.clutchfinal.Fabrica.FabricaEquipoService;
import com.example.clutchfinal.Fabrica.FabricaJugadorService;
import com.example.clutchfinal.Model.*;
import com.example.clutchfinal.Repository.CategoriaRepository;
import com.example.clutchfinal.Repository.ClubRepository;
import com.example.clutchfinal.Repository.EntrenadorRepository;
import com.example.clutchfinal.Repository.EquipoRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

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
    @Autowired
    private EntrenadorRepository entrenadorRepository;
    @Autowired
    private FabricaEntrenadorService fabricaEntrenadorService;
    @Autowired
    private FabricaJugadorService fabricaJugadorService;

    public EquipoDTO save(EquipoDTO dto){
        Equipo equipo;
        if (dto.getId() == null) {
            equipo = fabricaEquipoService.createEquipo(dto);
        } else {
            equipo = equipoRepository.findById(dto.getId())
                    .orElseThrow(() -> new NoSuchElementException("Equipo no encontrado con ID: " + dto.getId()));
            equipo.setNombreEquipo(dto.getNombreEquipo());
            equipo.setPartidosGanados(dto.getPartidosGanados() != null ? dto.getPartidosGanados() : 0);
            equipo.setPartidosPerdidos(dto.getPartidosPerdidos() != null ? dto.getPartidosPerdidos() : 0);
            equipo.setPuntos(dto.getPuntos() != null ? dto.getPuntos() : 0);
            equipo.setPosicion(dto.getPosicion());
            equipo.setPuntosAFavor(dto.getPuntosAFavor() != null ? dto.getPuntosAFavor() : BigDecimal.ZERO);
            equipo.setPuntosEnContra(dto.getPuntosEnContra() != null ? dto.getPuntosEnContra() : BigDecimal.ZERO);
        }

        Optional<Club> clubOpt = clubRepository.findById(dto.getClubId());
        if (clubOpt.isEmpty()) {
            throw new NoSuchElementException("Club no encontrado con ID: " + dto.getClubId());
        }
        equipo.setClub(clubOpt.get());

        Equipo equipoGuardado = equipoRepository.save(equipo);

        if (dto.getEntrenadorIds() != null && !dto.getEntrenadorIds().isEmpty()) {
            Set<Long> idsSinDuplicados = dto.getEntrenadorIds().stream().collect(Collectors.toSet());
            if (idsSinDuplicados.size() != dto.getEntrenadorIds().size()) {
                throw new IllegalArgumentException("No se permiten IDs de entrenadores duplicados en el mismo equipo.");
            }
            if (idsSinDuplicados.size() > 2) {
                throw new IllegalArgumentException("Un equipo solo puede tener 2 entrenadores.");
            }

            List<Entrenador> entrenadores = dto.getEntrenadorIds().stream()
                    .map(id -> entrenadorRepository.findById(id)
                            .orElseThrow(() -> new NoSuchElementException("Entrenador no encontrado con ID: " + id)))
                    .toList();
            entrenadorRepository.saveAll(entrenadores);
        }

        return fabricaEquipoService.createEquipoDTO(equipoGuardado);
    }

    public EquipoDetalleDTO findById(Long id){
        return equipoRepository.findById(id)
                .map(this::createEquipoDetalle)
                .orElse(null);
    }

    public List<EquipoResponseDTO> findAll(){
        return equipoRepository.findAll().stream()
                .map(this::createEquipoResponse)
                .toList();
    }


    private EquipoDetalleDTO createEquipoDetalle(Equipo equipo) {
        String escudo = equipoRepository.getEscudo(equipo.getId());
        String pabellon = equipoRepository.getPabellon(equipo.getId());

        List<EntrenadorDTO> entrenadores = equipo.getEntrenadores().stream()
                .map(fabricaEntrenadorService::createEntrenadorDTO)
                .toList();

        List<JugadorResponseDTO> jugadores = equipo.getJugadores().stream()
                .map(fabricaJugadorService::createResponseDTO)
                .toList();

        return fabricaEquipoService.createEquipoDetalleDTO(equipo, escudo, pabellon, entrenadores, jugadores);
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
