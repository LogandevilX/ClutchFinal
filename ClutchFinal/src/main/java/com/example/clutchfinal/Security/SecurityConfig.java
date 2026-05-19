package com.example.clutchfinal.Security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST, "/clutch/usuarios/login", "/clutch/usuarios").permitAll()

                        // ESPECTADOR: solo lectura + gestión de favoritos
                        .requestMatchers(HttpMethod.GET, "/clutch/**").hasAnyRole("ADMIN", "ESPECTADOR", "ANOTADOR")
                        .requestMatchers(HttpMethod.POST, "/clutch/favoritos").hasAnyRole("ADMIN", "ESPECTADOR")
                        .requestMatchers(HttpMethod.PUT, "/clutch/favoritos/**").hasAnyRole("ADMIN", "ESPECTADOR")
                        .requestMatchers(HttpMethod.DELETE, "/clutch/favoritos/**").hasAnyRole("ADMIN", "ESPECTADOR")

                        // ANOTADOR: solo acciones POST que afectan al partido
                        .requestMatchers(HttpMethod.POST,
                                "/clutch/partidos/eventos",
                                "/clutch/partidos/*/iniciar-periodo",
                                "/clutch/partidos/*/fin-periodo",
                                "/clutch/partidos/*/finalizar",
                                "/clutch/partidos/*/actas/inicializar")
                        .hasAnyRole("ADMIN", "ANOTADOR")

                        // ADMIN: creación/edición/borrado de catálogos y entidades maestras
                        .requestMatchers(HttpMethod.POST, "/clutch/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/clutch/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/clutch/**").hasRole("ADMIN")

                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
