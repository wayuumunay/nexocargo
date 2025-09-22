const { Pool } = require('pg');

// Carga las variables de entorno desde el archivo .env para desarrollo local
require('dotenv').config();

// Esta configuración unificada funciona tanto en local como en producción (Railway)
const pool = new Pool({
  // Railway provee estas variables automáticamente.
  // En tu computadora, las tomará de tu archivo .env.
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
  
  // La configuración SSL es necesaria para la conexión en producción en Railway.
  // No afectará tu conexión local si no la tienes configurada para usar SSL.
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;