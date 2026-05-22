package com.example.clutchfinal.Security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfiguration {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfiguration(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST, "/auth/login", "/clutch/usuarios/login", "/clutch/usuarios", "/clutch/usuarios/").permitAll()
                        .requestMatchers(HttpMethod.GET, "/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/clutch/favoritos/**").hasAnyRole("ADMIN", "ESPECTADOR")
                        .requestMatchers(HttpMethod.PUT, "/clutch/favoritos/**").hasAnyRole("ADMIN", "ESPECTADOR")
                        .requestMatchers(HttpMethod.DELETE, "/clutch/favoritos/**").hasAnyRole("ADMIN", "ESPECTADOR")
                        .requestMatchers(HttpMethod.PUT, "/clutch/usuarios/**").hasAnyRole("ADMIN", "ESPECTADOR")
                        .requestMatchers(HttpMethod.POST,
                                "/clutch/partidos/**", "/clutch/actas/**", "/clutch/historial-partidos/**",
                                "/clutch/temporadas/**", "/clutch/jugadores/**", "/clutch/pabellones/**",
                                "/clutch/grupos/**", "/clutch/inscripciones/**", "/clutch/fases/**",
                                "/clutch/entrenadores/**", "/clutch/equipos/**", "/clutch/clubes/**",
                                "/clutch/divisiones/**", "/clutch/categorias/**")
                            .hasAnyRole("ADMIN", "ANOTADOR")
                        .requestMatchers(HttpMethod.PUT,
                                "/clutch/partidos/**", "/clutch/actas/**", "/clutch/historial-partidos/**",
                                "/clutch/temporadas/**", "/clutch/jugadores/**", "/clutch/pabellones/**",
                                "/clutch/grupos/**", "/clutch/inscripciones/**", "/clutch/fases/**",
                                "/clutch/entrenadores/**", "/clutch/equipos/**", "/clutch/clubes/**",
                                "/clutch/divisiones/**", "/clutch/categorias/**")
                            .hasAnyRole("ADMIN", "ANOTADOR")
                        .requestMatchers(HttpMethod.DELETE,
                                "/clutch/partidos/**", "/clutch/actas/**", "/clutch/historial-partidos/**",
                                "/clutch/temporadas/**", "/clutch/jugadores/**", "/clutch/pabellones/**",
                                "/clutch/grupos/**", "/clutch/inscripciones/**", "/clutch/fases/**",
                                "/clutch/entrenadores/**", "/clutch/equipos/**", "/clutch/clubes/**",
                                "/clutch/divisiones/**", "/clutch/categorias/**")
                            .hasAnyRole("ADMIN", "ANOTADOR")
                        .requestMatchers(HttpMethod.POST, "/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
