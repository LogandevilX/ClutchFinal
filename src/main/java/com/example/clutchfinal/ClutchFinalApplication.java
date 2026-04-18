package com.example.clutchfinal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class ClutchFinalApplication {

    public static void main(String[] args) {
        SpringApplication.run(ClutchFinalApplication.class, args);
    }

}
