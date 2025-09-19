const { Pool } = require('pg');
require('dotenv').config();

// Establece la zona horaria a UTC para compatibilidad
process.env.TZ = 'UTC';

const isProduction = process.env.NODE_ENV === 'production';

const connectionConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
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