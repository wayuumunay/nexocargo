require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Importamos todas las rutas que usará la aplicación
const userRoutes = require('./routes/users');
const tripRoutes = require('./routes/trips');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/users', userRoutes); 
app.use('/api/trips', tripRoutes);
app.use('/api/admin', adminRoutes); // Esta línea faltaba

// Arranque del Servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});