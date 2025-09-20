const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const connectionConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  family: 4, // Forzar IPv4
};

const localConfig = { /* ... tu config local ... */ };

const pool = new Pool(isProduction ? connectionConfig : localConfig);
module.exports = pool;