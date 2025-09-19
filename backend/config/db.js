const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// Configuración para producción (Render/Railway)
const connectionConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // --- LÍNEA AÑADIDA ---
  // Forzamos el uso de IPv4
  family: 4, 
};

// Configuración para desarrollo (tu PC)
const localConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

const pool = new Pool(isProduction ? connectionConfig : localConfig);

module.exports = pool;