package com.example.clutchfinal.Fabrica;

import org.springframework.stereotype.Service;
import com.example.clutchfinal.DTO.CategoriaDTO;
import com.example.clutchfinal.Model.Categoria;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FabricaCategoriaService {
    public Categoria createCategoria(CategoriaDTO dto){
        Categoria categoria = new Categoria();
        categoria.setId(dto.getId());
        categoria.setNombreCategoria(dto.getNombreCategoria());
        categoria.setGenero(dto.getGenero());
        categoria.setEdadMax(dto.getEdadMax());
        return categoria;
    }

    public CategoriaDTO createCategoriaDTO(Categoria categoria){
        CategoriaDTO dto = new CategoriaDTO();
        dto.setId(categoria.getId());
        dto.setNombreCategoria(categoria.getNombreCategoria());
        dto.setGenero(categoria.getGenero());
        dto.setEdadMax(categoria.getEdadMax());
        if (categoria.getTemporada() != null) {
            dto.setTemporadaId(categoria.getTemporada().getId());
        }
        return dto;
    }

    public List<CategoriaDTO> createCategoriasDTO(List<Categoria> lista){
        return lista.stream().map(this::createCategoriaDTO).collect(Collectors.toList());
    }
}
