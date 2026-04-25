### JERARQUÍA DE LA COMPETICIÓN ###

-- clutch.Temporadas definition
CREATE TABLE `Temporadas` (
                              `id_temporada` int(11) NOT NULL AUTO_INCREMENT,
                              `denominacion` varchar(25) NOT NULL,
                              `fecha_inicio` date NOT NULL,
                              `fecha_fin` date NULL,
                              `estado` varchar(20) NOT NULL,
                              PRIMARY KEY (`id_temporada`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- clutch.Categorias definition
CREATE TABLE `Categorias` (
                              `id_categoria` int(11) NOT NULL AUTO_INCREMENT,
                              `id_temporada` int(11) NOT NULL,
                              `nombre_categoria` varchar(50) NOT NULL,
                              `genero` varchar(20) NOT NULL,
                              `edad_min` int(11) NOT NULL,
                              `edad_max` int(11) NOT NULL,
                              PRIMARY KEY (`id_categoria`),
                              KEY `fk_cat_temporada` (`id_temporada`),
                              CONSTRAINT `fk_cat_temporada` FOREIGN KEY (`id_temporada`) REFERENCES `Temporadas` (`id_temporada`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- clutch.Divisiones definition
CREATE TABLE `Divisiones` (
                              `id_division` int(11) NOT NULL AUTO_INCREMENT,
                              `id_categoria` int(11) NOT NULL,
                              `nombre_division` varchar(50) NOT NULL,
                              PRIMARY KEY (`id_division`),
                              KEY `fk_div_categoria` (`id_categoria`),
                              CONSTRAINT `fk_div_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `Categorias` (`id_categoria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- clutch.Fases definition

CREATE TABLE `Fases` (
                         `id_fase` int(11) NOT NULL AUTO_INCREMENT,
                         `id_division` int(11) NOT NULL,
                         `nombre_fase` varchar(100) NOT NULL,
                         `fecha_inicio` datetime NOT NULL,
                         `fecha_fin` datetime NULL,
                         PRIMARY KEY (`id_fase`),
                         KEY `fk_fase_division` (`id_division`),
                         CONSTRAINT `fk_fase_division` FOREIGN KEY (`id_division`) REFERENCES `Divisiones` (`id_division`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- clutch.Grupos definition
CREATE TABLE `Grupos` (
                          `id_grupo` int(11) NOT NULL AUTO_INCREMENT,
                          `id_fase` int(11) NOT NULL,
                          `nombre_grupo` varchar(50) NOT NULL,
                          PRIMARY KEY (`id_grupo`),
                          KEY `fk_grup_fase` (`id_fase`),
                          CONSTRAINT `fk_grup_fase` FOREIGN KEY (`id_fase`) REFERENCES `Fases` (`id_fase`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- clutch.Inscripciones definition
CREATE TABLE `Inscripciones` (
                                 `id_inscripcion` int(11) NOT NULL AUTO_INCREMENT,
                                 `id_fase` int(11) NOT NULL,
                                 `id_grupo` int(11) NOT NULL,
                                 `id_equipo` int(11) NOT NULL,
                                 `fecha_inscripcion` datetime NOT NULL,
                                 PRIMARY KEY (`id_inscripcion`),
                                 UNIQUE KEY `unique_equipo_fase` (`id_equipo`,`id_fase`),
                                 KEY `fk_ins_fase` (`id_fase`),
                                 KEY `fk_ins_grupo` (`id_grupo`),
                                 CONSTRAINT `fk_ins_equipo` FOREIGN KEY (`id_equipo`) REFERENCES `Equipos` (`id_equipo`) ON DELETE CASCADE ON UPDATE CASCADE,
                                 CONSTRAINT `fk_ins_fase` FOREIGN KEY (`id_fase`) REFERENCES `Fases` (`id_fase`) ON DELETE CASCADE ON UPDATE CASCADE,
                                 CONSTRAINT `fk_ins_grupo` FOREIGN KEY (`id_grupo`) REFERENCES `Grupos` (`id_grupo`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

### PARTICIPANTES ###

-- clutch.Clubes definition

CREATE TABLE `Clubes` (
`id_club` int(11) NOT NULL AUTO_INCREMENT,
`nombre_club` varchar(100) NOT NULL,
`CIF` varchar(20) DEFAULT NULL,
`telefono` varchar(100) DEFAULT NULL,
`director_tecnico` varchar(100) DEFAULT NULL,
`escudo` varchar(255) NULL,
PRIMARY KEY (`id_club`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- clutch.Pabellones definition
CREATE TABLE `Pabellones` (
`id_pabellon` int(11) NOT NULL AUTO_INCREMENT,
`codigo_postal` int(11) NOT NULL,
`direccion` varchar(255) NOT NULL,
`nombre_pabellon` varchar(100) NOT NULL,
PRIMARY KEY (`id_pabellon`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- clutch.Clubes_Pabellones definition
CREATE TABLE `Clubes_Pabellones` (
                                     `id_club` int(11) NOT NULL,
                                     `id_pabellon` int(11) NOT NULL,
                                     PRIMARY KEY (`id_club`,`id_pabellon`),
                                     KEY `fk_cp_pabellon` (`id_pabellon`),
                                     CONSTRAINT `fk_cp_club` FOREIGN KEY (`id_club`) REFERENCES `Clubes` (`id_club`),
                                     CONSTRAINT `fk_cp_pabellon` FOREIGN KEY (`id_pabellon`) REFERENCES `Pabellones` (`id_pabellon`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- clutch.Entrenadores definition
CREATE TABLE `Entrenadores` (
                                `id_entrenador` int(11) NOT NULL AUTO_INCREMENT,
                                id_equipo int(11) NOT NULL,
                                `DNI` varchar(15) NOT NULL,
                                `nombre` varchar(50) NOT NULL,
                                `primer_apellido` varchar(50) NOT NULL,
                                `segundo_apellido` varchar(50) DEFAULT NULL,
                                `telefono` varchar(15) NOT NULL,
                                `fecha_nacimiento` datetime NOT NULL,
                                `titulo` varchar(50) NOT NULL,
                                PRIMARY KEY (`id_entrenador`),
                                UNIQUE KEY `DNI` (`DNI`),
                                KEY `fk_ent_equipo` (`id_equipo`),
                                CONSTRAINT `fk_ent_equipo` FOREIGN KEY (`id_equipo`) REFERENCES `Equipos` (`id_equipo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- clutch.Equipos definition
CREATE TABLE `Equipos` (
                           `id_equipo` int(11) NOT NULL AUTO_INCREMENT,
                           `id_club` int(11) NOT NULL,
                           `id_categoria` int(11) NOT NULL,
                           `nombre_equipo` varchar(100) NOT NULL,
                           `partidos_ganados` int(11) NOT NULL DEFAULT 0,
                           `partidos_perdidos` int(11) NOT NULL DEFAULT 0,
                           `puntos` int(11) NOT NULL DEFAULT 0,
                           `posicion` int(11) NOT NULL,
                           `puntos_a_favor` decimal(4,2) NOT NULL DEFAULT 0.00,
                           `puntos_en_contra` decimal(4,2) NOT NULL DEFAULT 0.00,
                           PRIMARY KEY (`id_equipo`),
                           KEY `fk_eq_club` (`id_club`),
                           KEY `fk_eq_categoria` (`id_categoria`),
                           CONSTRAINT `fk_eq_club` FOREIGN KEY (`id_club`) REFERENCES `Clubes` (`id_club`),
                           CONSTRAINT `fk_eq_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `Categorias` (`id_categoria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
-- clutch.Jugadores definition
CREATE TABLE `Jugadores` (
                             `id_jugador` int(11) NOT NULL AUTO_INCREMENT,
                             `id_club` int(11) NOT NULL,
                             `DNI` varchar(15) NOT NULL,
                             `nombre` varchar(50) NOT NULL,
                             `primer_apellido` varchar(50) NOT NULL,
                             `segundo_apellido` varchar(50) DEFAULT NULL,
                             `fecha_nacimiento` datetime NOT NULL,
                             `genero` varchar(50) DEFAULT NULL,
                             `foto` varchar(255) NOT NULL,
                             PRIMARY KEY (`id_jugador`),
                             UNIQUE KEY `DNI` (`DNI`),
                             KEY `fk_jug_club` (`id_club`),
                             CONSTRAINT `fk_jug_club` FOREIGN KEY (`id_club`) REFERENCES `Clubes` (`id_club`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- clutch.Equipos_Jugadores definition
CREATE TABLE `Equipos_Jugadores` (
                                     `id_jugador` int(11) NOT NULL,
                                     `id_equipo` int(11) NOT NULL,
                                     PRIMARY KEY (`id_jugador`,`id_equipo`),
                                     KEY `fk_eqjug_equipo` (`id_equipo`),
                                     CONSTRAINT `fk_eqjug_equipo` FOREIGN KEY (`id_equipo`) REFERENCES `Equipos` (`id_equipo`),
                                     CONSTRAINT `fk_eqjug_jugador` FOREIGN KEY (`id_jugador`) REFERENCES `Jugadores` (`id_jugador`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

### ENTIDADES DE PARTIDO ###

-- clutch.Partidos definition
CREATE TABLE `Partidos` (
`id_partido` int(11) NOT NULL AUTO_INCREMENT,
`id_grupo` int(11) NOT NULL,
`id_inscripcion_local` int(11) NOT NULL,
`id_inscripcion_visitante` int(11) NOT NULL,
`jornada` int(11) NOT NULL,
`fecha_hora_inicio` datetime NOT NULL,
`fecha_hora_fin` datetime NULL,
`puntos_local` int(11) NOT NULL DEFAULT 0,
`puntos_visitante` int(11) NOT NULL DEFAULT 0,
`pabellonDeJuego` varchar(50) NOT NULL,
PRIMARY KEY (`id_partido`),
KEY `fk_part_grupo` (`id_grupo`),
KEY `fk_part_ins_loc` (`id_inscripcion_local`),
KEY `fk_part_ins_vis` (`id_inscripcion_visitante`),
CONSTRAINT `fk_part_grupo` FOREIGN KEY (`id_grupo`) REFERENCES `Grupos` (`id_grupo`),
CONSTRAINT `fk_part_ins_loc` FOREIGN KEY (`id_inscripcion_local`) REFERENCES `Inscripciones` (`id_inscripcion`),
CONSTRAINT `fk_part_ins_vis` FOREIGN KEY (`id_inscripcion_visitante`) REFERENCES `Inscripciones` (`id_inscripcion`),
CONSTRAINT `chk_equipos_distintos` CHECK (`id_inscripcion_local` <> `id_inscripcion_visitante`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- clutch.Actas definition
CREATE TABLE `Actas` (
`id_acta` int(11) NOT NULL AUTO_INCREMENT,
`id_partido` int(11) NOT NULL,
`id_jugador` int(11) NOT NULL,
`id_equipo` int(11) NOT NULL,
`dorsal` int(11) NOT NULL DEFAULT 0,
`minutos_jugados` decimal(5,1) NOT NULL DEFAULT 0.0,
`puntos` int(11) NOT NULL DEFAULT 0,
`tl_tirados` int(11) NOT NULL DEFAULT 0,
`tl_anotados` int(11) NOT NULL DEFAULT 0,
`t2_tirados` int(11) NOT NULL DEFAULT 0,
`t2_anotados` int(11) NOT NULL DEFAULT 0,
`triples_tirados` int(11) NOT NULL DEFAULT 0,
`triples_anotados` int(11) NOT NULL DEFAULT 0,
`rebotes` int(11) NOT NULL DEFAULT 0,
`tapones` int(11) NOT NULL DEFAULT 0,
`robos` int(11) NOT NULL DEFAULT 0,
`perdida` int(11) NOT NULL DEFAULT 0,
`valoracion` int(11) NOT NULL DEFAULT 0,
`+/-` int(11) NOT NULL DEFAULT 0,
PRIMARY KEY (`id_acta`),
KEY `fk_acta_partido` (`id_partido`),
KEY `fk_acta_jugador` (`id_jugador`),
KEY `fk_acta_equipo` (`id_equipo`),
CONSTRAINT `fk_acta_equipo` FOREIGN KEY (`id_equipo`) REFERENCES `Equipos` (`id_equipo`),
CONSTRAINT `fk_acta_jugador` FOREIGN KEY (`id_jugador`) REFERENCES `Jugadores` (`id_jugador`),
CONSTRAINT `fk_acta_partido` FOREIGN KEY (`id_partido`) REFERENCES `Partidos` (`id_partido`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- clutch.Historial_Partidos definition
CREATE TABLE `Historial_Partidos` (
      `id_evento` int(11) NOT NULL AUTO_INCREMENT,
      `id_partido` int(11) NOT NULL,
      `id_equipo` int(11) NOT NULL,
      `id_jugador` int(11) NULL,
      `id_entrenador` int(11) NULL,
      `tipo_evento` varchar(50) NOT NULL,
      `acierto` varchar(50) DEFAULT NULL,
      `periodo` int(11) NOT NULL,
      `minuto` int(11) NOT NULL,
      `segundo` int(11) NOT NULL DEFAULT 0,
      `posicion` varchar(50) DEFAULT NULL,
      PRIMARY KEY (`id_evento`),
      KEY `fk_hist_partido` (`id_partido`),
      KEY `fk_hist_equipo` (`id_equipo`),
      KEY `fk_hist_jugador` (`id_jugador`),
      KEY `fk_hist_entrenador` (`id_entrenador`),
      CONSTRAINT `fk_hist_entrenador` FOREIGN KEY (`id_entrenador`) REFERENCES `Entrenadores` (`id_entrenador`),
      CONSTRAINT `fk_hist_equipo` FOREIGN KEY (`id_equipo`) REFERENCES `Equipos` (`id_equipo`),
      CONSTRAINT `fk_hist_jugador` FOREIGN KEY (`id_jugador`) REFERENCES `Jugadores` (`id_jugador`),
      CONSTRAINT `fk_hist_partido` FOREIGN KEY (`id_partido`) REFERENCES `Partidos` (`id_partido`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- clutch.Usuarios definition
CREATE TABLE `Usuarios` (
                            `id_usuario` int(11) NOT NULL AUTO_INCREMENT,
                            `email` varchar(100) NOT NULL,
                            `password` varchar(255) NOT NULL,
                            `apodo` varchar(50) NOT NULL,
                            `rol` varchar(20) NOT NULL,
                            `fecha_registro` datetime NOT NULL DEFAULT current_timestamp(),
                            PRIMARY KEY (`id_usuario`),
                            UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- clutch.Empleados definition
CREATE TABLE `Empleados` (
                             `id_empleado` int(11) NOT NULL,
                             `nombre` varchar(100) NOT NULL,
                             `apellidos` varchar(100) NOT NULL,
                             `DNI` varchar(15) NOT NULL,
                             PRIMARY KEY (`id_empleado`),
                             UNIQUE KEY `DNI` (`DNI`),
                             CONSTRAINT `fk_emp_usuario` FOREIGN KEY (`id_empleado`) REFERENCES `Usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- clutch.Favoritos definition
CREATE TABLE `Favoritos` (
                             `id_favorito` int(11) NOT NULL AUTO_INCREMENT,
                             `id_usuario` int(11) NOT NULL,
                             `id_equipo` int(11) DEFAULT NULL,
                             `id_jugador` int(11) DEFAULT NULL,
                             PRIMARY KEY (`id_favorito`),
                             UNIQUE KEY `unique_fav_equipo` (`id_usuario`,`id_equipo`),
                             UNIQUE KEY `unique_fav_jugador` (`id_usuario`,`id_jugador`),
                             KEY `fk_fav_equipo` (`id_equipo`),
                             KEY `fk_fav_jugador` (`id_jugador`),
                             CONSTRAINT `fk_fav_equipo` FOREIGN KEY (`id_equipo`) REFERENCES `Equipos` (`id_equipo`) ON DELETE CASCADE,
                             CONSTRAINT `fk_fav_jugador` FOREIGN KEY (`id_jugador`) REFERENCES `Jugadores` (`id_jugador`) ON DELETE CASCADE,
                             CONSTRAINT `fk_fav_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `Usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
