const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const auth = require('../middleware/auth');
// Ya no se necesitan 'sendEmail' ni 'crypto'

// @ruta   POST api/users/register
router.post('/register', async (req, res) => {
    const client = await pool.connect();
    try {
        const { nombre_completo, email, password, telefono, tipo_de_usuario, patente, foto_url } = req.body;

        const userExists = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
        }
        
        if (tipo_de_usuario === 'conductor') {
            if (!patente) return res.status(400).json({ error: 'La patente es requerida para conductores.' });
            const cleanedPatente = patente.replace(/\s/g, '').toUpperCase();
            const patenteRegex = /^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/;
            if (!patenteRegex.test(cleanedPatente)) {
                return res.status(400).json({ error: 'El formato de la patente no es válido. Debe ser LLLNNN o LLNNNLL.' });
            }
            const patentExists = await pool.query('SELECT * FROM Vehiculos WHERE patente = $1', [cleanedPatente]);
            if (patentExists.rows.length > 0) {
                return res.status(400).json({ error: 'La patente ingresada ya se encuentra registrada en otro usuario.' });
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        await client.query('BEGIN');

        // Volvemos a la inserción simple, sin el token de verificación
        const newUserResult = await client.query(
            'INSERT INTO usuarios (nombre_completo, email, password, telefono, tipo_de_usuario) VALUES ($1, $2, $3, $4, $5) RETURNING id, email',
            [nombre_completo, email, hashedPassword, telefono, tipo_de_usuario]
        );
        const newUser = newUserResult.rows[0];

        if (tipo_de_usuario === 'conductor') {
            const cleanedPatente = patente.replace(/\s/g, '').toUpperCase();
            if (!foto_url) throw new Error('La foto del vehículo es requerida para conductores.');
            await client.query(
                'INSERT INTO Vehiculos (conductor_id, patente, foto_url) VALUES ($1, $2, $3)',
                [newUser.id, cleanedPatente, foto_url]
            );
        }
        
        await client.query('COMMIT');
        res.status(201).json({ 
            message: 'Registro exitoso.', // Mensaje simplificado
            user: newUser 
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error.message);
        res.status(500).send(error.message || 'Error en el servidor');
    } finally {
        client.release();
    }
});

// La ruta GET /verify/:token ha sido eliminada.

// @ruta   POST api/users/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const userResult = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }
        const user = userResult.rows[0];
        
        // Se elimina el chequeo de 'is_email_verified'
        
        if (user.tipo_de_usuario === 'conductor' && user.estado_conductor === 'pendiente_aprobacion') {
            return res.status(403).json({ error: 'Tu cuenta de conductor está pendiente de aprobación por un administrador.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ 
            message: 'Inicio de sesión exitoso.',
            token: token,
            user: {
                id: user.id,
                nombre_completo: user.nombre_completo,
                email: user.email,
                tipo_de_usuario: user.tipo_de_usuario
            }
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
});

// @ruta   GET api/users/me
router.get('/me', auth, async (req, res) => {
    try {
        const user = await pool.query('SELECT id, nombre_completo, email, telefono, tipo_de_usuario, estado_conductor FROM usuarios WHERE id = $1', [req.user.id]);
        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        res.json(user.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
});

module.exports = router;