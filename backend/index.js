require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Importamos todas las rutas que usará la aplicación
const userRoutes = require('./routes/users');
const tripRoutes = require('./routes/trips');
const adminRoutes = require('./routes/admin');

const app = express();
// Usamos el puerto que nos asigne Render/Railway en producción, o el 3001 en tu computadora
const PORT = process.env.PORT || 3001;

// --- CONFIGURACIÓN DE CORS PARA PRODUCCIÓN ---
// Le decimos al backend que solo acepte peticiones desde la URL de tu frontend
const corsOptions = {
  origin: 'https://nexocargo.vercel.app' 
};

// Middlewares
app.use(cors(corsOptions)); // Usamos la nueva configuración
app.use(express.json());

// Rutas
app.use('/api/users', userRoutes); 
app.use('/api/trips', tripRoutes);
app.use('/api/admin', adminRoutes);

// Arranque del Servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});