package com.example.clutchfinal.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.clutchfinal.Model.Club;

@Repository
public interface ClubRepository extends JpaRepository<Club, Long> {
}