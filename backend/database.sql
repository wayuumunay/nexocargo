-- Borra las tablas en el orden correcto, manejando dependencias con CASCADE
DROP TABLE IF EXISTS Vehiculos;
DROP TABLE IF EXISTS Viajes;
DROP TABLE IF EXISTS Usuarios CASCADE;

-- Tabla de Usuarios
-- Esta tabla almacenará la información tanto de clientes como de conductores.
CREATE TABLE Usuarios (
    id SERIAL PRIMARY KEY, -- SERIAL crea un número único que se auto-incrementa
    nombre_completo VARCHAR(255) NOT NULL, -- NOT NULL significa que este campo es obligatorio
    email VARCHAR(255) UNIQUE NOT NULL, -- UNIQUE asegura que no haya dos emails iguales
    password VARCHAR(255) NOT NULL, -- Guardaremos una versión encriptada de la contraseña
    telefono VARCHAR(50),
    tipo_de_usuario VARCHAR(10) NOT NULL, -- Puede ser 'cliente' o 'conductor'
    calificacion_promedio NUMERIC(3, 2) DEFAULT 0.00, -- Ej: 4.50
    estado_conductor VARCHAR(25) DEFAULT 'inactivo' NOT NULL, -- 'inactivo', 'habilitado', 'bloqueado_pago_pendiente', etc.
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- Guarda la fecha y hora de registro
);

-- Tabla de Vehículos
-- Cada vehículo debe pertenecer a un usuario que sea conductor.
CREATE TABLE Vehiculos (
    id SERIAL PRIMARY KEY,
    -- FOREIGN KEY: Crea una relación. Cada vehículo está atado a un 'id' de la tabla Usuarios.
    -- ON DELETE CASCADE: Si un usuario es eliminado, todos sus vehículos se eliminan automáticamente.
    conductor_id INTEGER NOT NULL REFERENCES Usuarios(id) ON DELETE CASCADE,
    patente VARCHAR(20) UNIQUE NOT NULL, -- La patente debe ser única
    marca VARCHAR(100),
    modelo VARCHAR(100),
    descripcion TEXT
);

-- Tabla de Viajes
-- El corazón de la aplicación, conectando a un cliente con un conductor.
CREATE TABLE Viajes (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES Usuarios(id),
    -- El conductor_id puede ser nulo al principio, cuando el viaje aún no ha sido aceptado.
    conductor_id INTEGER REFERENCES Usuarios(id),
    ubicacion_inicio TEXT NOT NULL,
    ubicacion_final TEXT NOT NULL,
    descripcion_carga TEXT,
    precio_ofrecido NUMERIC(10, 2) NOT NULL,
    precio_final NUMERIC(10, 2),
    estado_viaje VARCHAR(50) NOT NULL DEFAULT 'nuevo', -- 'nuevo', 'aceptado', 'en_curso', 'finalizado', etc.
    comprobante_url TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);