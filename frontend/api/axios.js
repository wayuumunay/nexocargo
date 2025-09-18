import axios from 'axios';


// --- LÍNEA DE PRUEBA PARA VERCEL ---
console.log("VITE_API_URL leída durante la construcción:", import.meta.env.VITE_API_URL);


// Creamos una instancia de axios con la URL base de nuestro backend
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001'
});

export default api;