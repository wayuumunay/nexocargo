const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const connectionConfig = {
  connectionString: process.env.DATABASE_URL,
  // Forzamos el uso de SSL, requerido por la mayoría de BD en la nube
  ssl: {
    rejectUnauthorized: false
  },
  // Forzamos el uso de IPv4 para máxima compatibilidad
  family: 4, 
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