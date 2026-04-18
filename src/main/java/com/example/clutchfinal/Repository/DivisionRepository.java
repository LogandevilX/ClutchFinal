package com.example.clutchfinal.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.clutchfinal.Model.Division;

@Repository
public interface DivisionRepository extends JpaRepository<Division, Long> {
}
