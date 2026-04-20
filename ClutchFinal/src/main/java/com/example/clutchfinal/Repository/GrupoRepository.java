package com.example.clutchfinal.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.clutchfinal.Model.Grupo;

@Repository
public interface GrupoRepository extends JpaRepository<Grupo, Long> {
}
