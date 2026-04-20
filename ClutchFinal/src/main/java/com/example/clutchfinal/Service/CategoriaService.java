package com.example.clutchfinal.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.clutchfinal.DTO.CategoriaDTO;
import com.example.clutchfinal.Fabrica.FabricaCategoriaService;
import com.example.clutchfinal.Model.Categoria;
import com.example.clutchfinal.Model.Temporada;
import com.example.clutchfinal.Repository.CategoriaRepository;
import com.example.clutchfinal.Repository.TemporadaRepository;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class CategoriaService {
    @Autowired
    private FabricaCategoriaService fabricaCategoriaService;
    @Autowired
    private CategoriaRepository categoriaRepository;
    @Autowired
    private TemporadaRepository temporadaRepository;

    public CategoriaDTO save(CategoriaDTO dto){
        Categoria categoria = fabricaCategoriaService.createCategoria(dto);

        Optional<Temporada> temporadaOpt = temporadaRepository.findById(dto.getTemporadaId());
        if (temporadaOpt.isEmpty()) {
            throw new NoSuchElementException("Temporada no encontrada con ID: " + dto.getTemporadaId());
        }
        categoria.setTemporada(temporadaOpt.get());

        return fabricaCategoriaService.createCategoriaDTO(categoriaRepository.save(categoria));
    }

    public CategoriaDTO findById(Long id){
        return categoriaRepository.findById(id)
                .map(fabricaCategoriaService::createCategoriaDTO)
                .orElse(null);
    }

    public List<CategoriaDTO> findAll(){
        return fabricaCategoriaService.createCategoriasDTO(categoriaRepository.findAll());
    }

    public void deleteById(Long id){
        categoriaRepository.deleteById(id);
    }
}
