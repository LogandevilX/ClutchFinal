package com.example.clutchfinal.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.clutchfinal.Model.Fase;

@Repository
public interface FaseRepository extends JpaRepository<Fase, Long> {
}
