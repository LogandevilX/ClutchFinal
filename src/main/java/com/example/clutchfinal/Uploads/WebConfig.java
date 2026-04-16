package com.example.clutchfinal.Uploads;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Esta clase sirve para exponer archivos ubicados fuera del SRC,
 * y así hcaer accesibles los archivos desde desde el frontend
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry){
        // Registro en el directorio escudos para los logos de los clubes
        registry.addResourceHandler("/escudos/**")
                .addResourceLocations("file:upload/escudos/");

        // Registro en el directorio perfiles para las fotos de los jugadores
        registry.addResourceHandler("/perfiles/**")
                .addResourceLocations("file:upload/perfiles/");
    }
}
