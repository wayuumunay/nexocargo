const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// Configuración para producción (Railway)
const connectionConfig = {
  connectionString: process.env.DATABASE_URL, // Railway provee esta variable
  ssl: {
    rejectUnauthorized: false
  }
};

// Configuración para desarrollo (tu PC)
const localConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

// Usamos la configuración de producción si NODE_ENV es 'production', si no, la local.
const pool = new Pool(isProduction ? connectionConfig : localConfig);

module.exports = pool;