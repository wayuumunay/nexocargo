const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const sendEmail = require('../utils/emailService');

// Middleware de autenticación para el admin
const adminAuth = (req, res, next) => {
    const providedKey = req.header('x-admin-key');
    const expectedKey = process.env.ADMIN_SECRET_KEY;

    console.log('--- Verificación de Clave de Admin ---');
    console.log('Clave Esperada (desde backend/.env):', expectedKey);
    console.log('Clave Recibida (desde el frontend):', providedKey);
    console.log('-----------------------------------');

    if (providedKey === expectedKey) {
        next();
    } else {
        res.status(401).json({ error: 'Acceso no autorizado.' });
    }
};

// Ruta para aprobar un pago y habilitar a un conductor
router.put('/approve-payment/:conductorId', adminAuth, async (req, res) => {
    try {
        const { conductorId } = req.params;
        const updatedUser = await pool.query(
            "UPDATE Usuarios SET estado_conductor = 'habilitado' WHERE id = $1 AND tipo_de_usuario = 'conductor' RETURNING id, nombre_completo, estado_conductor",
            [conductorId]
        );
        if (updatedUser.rows.length === 0) {
            return res.status(404).json({ error: 'Conductor no encontrado.' });
        }
        res.json({ message: 'Conductor habilitado exitosamente.', user: updatedUser.rows[0] });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
});

// Ruta para ver conductores pendientes de aprobación inicial
router.get('/pending-drivers', adminAuth, async (req, res) => {
    try {
        const pendingDrivers = await pool.query(
            `SELECT u.id, u.nombre_completo, u.email, v.patente, v.foto_url
             FROM Usuarios u
             JOIN Vehiculos v ON u.id = v.conductor_id
             WHERE u.estado_conductor = 'pendiente_aprobacion'`
        );
        res.json(pendingDrivers.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
});

// Ruta para aprobar un nuevo conductor
router.put('/approve-driver/:driverId', adminAuth, async (req, res) => {
    try {
        const { driverId } = req.params;
        const updatedUser = await pool.query(
            "UPDATE Usuarios SET estado_conductor = 'habilitado' WHERE id = $1 AND estado_conductor = 'pendiente_aprobacion' RETURNING id, nombre_completo, estado_conductor",
            [driverId]
        );
        if (updatedUser.rows.length === 0) {
            return res.status(404).json({ error: 'Conductor no encontrado o ya aprobado.' });
        }
        res.json({ message: 'Conductor aprobado y habilitado.', user: updatedUser.rows[0] });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
});

// Ruta para ver los pagos pendientes de verificación
router.get('/pending-verifications', adminAuth, async (req, res) => {
    try {
        const pending = await pool.query(
            `SELECT DISTINCT ON (u.id)
                u.id, u.nombre_completo, u.email,
                v.comprobante_url
             FROM Usuarios u
             JOIN Viajes v ON u.id = v.conductor_id
             WHERE u.estado_conductor = 'verificacion_pendiente' AND v.comprobante_url IS NOT NULL
             ORDER BY u.id, v.fecha_creacion DESC`
        );
        res.json(pending.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
});
// --- AÑADE ESTA RUTA SI FALTA ---
// @ruta   GET api/admin/users
// @desc   Obtener una lista de todos los usuarios
// @acceso Admin
router.get('/users', adminAuth, async (req, res) => {
    try {
        const allUsers = await pool.query(
            "SELECT id, nombre_completo, email, tipo_de_usuario, estado_conductor FROM Usuarios ORDER BY id ASC"
        );
        res.json(allUsers.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
});
// @ruta   GET api/admin/test-email
// @desc   Enviar un email de prueba
// @acceso Admin
router.get('/test-email', adminAuth, async (req, res) => {
    try {
        const to = process.env.EMAIL_FROM; // Nos enviaremos un email a nosotros mismos
        const subject = 'Prueba de Email desde NexoCargo';
        const html = '<h1>¡Hola!</h1><p>Si recibes esto, el sistema de correos de NexoCargo está funcionando.</p>';

        await sendEmail(to, subject, html);

        res.send('Intentando enviar email de prueba. Revisa tu bandeja de entrada.');
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error al intentar enviar el email de prueba.');
    }
});
module.exports = router;