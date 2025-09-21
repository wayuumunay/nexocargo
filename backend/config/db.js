const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// Usamos la URL privada de Railway si existe, si no, la pública
const connectionString = process.env.RAILWAY_PRIVATE_DATABASE_URL || process.env.DATABASE_URL;

const connectionConfig = {
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  family: 4, // Forzamos IPv4 para máxima compatibilidad
};

const localConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

const pool = new Pool(isProduction ? connectionConfig : localConfig);

module.exports = pool;