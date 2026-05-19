package com.example.clutchfinal.Security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final AuthenticationProvider authenticationProvider;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST, "/clutch/usuarios/login", "/clutch/usuarios").permitAll()
                        .requestMatchers(HttpMethod.GET, "/clutch/**").hasAnyRole("ADMIN", "ESPECTADOR", "ANOTADOR")
                        .requestMatchers(HttpMethod.POST, "/clutch/favoritos").hasAnyRole("ADMIN", "ESPECTADOR")
                        .requestMatchers(HttpMethod.PUT, "/clutch/favoritos/**").hasAnyRole("ADMIN", "ESPECTADOR")
                        .requestMatchers(HttpMethod.DELETE, "/clutch/favoritos/**").hasAnyRole("ADMIN", "ESPECTADOR")
                        .requestMatchers(HttpMethod.POST,
                                "/clutch/partidos/eventos",
                                "/clutch/partidos/*/iniciar-periodo",
                                "/clutch/partidos/*/fin-periodo",
                                "/clutch/partidos/*/finalizar",
                                "/clutch/partidos/*/actas/inicializar")
                        .hasAnyRole("ADMIN", "ANOTADOR")
                        .requestMatchers(HttpMethod.POST, "/clutch/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/clutch/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/clutch/**").hasRole("ADMIN")
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
