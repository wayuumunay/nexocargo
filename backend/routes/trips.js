const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pool = require('../config/db');
const sendEmail = require('../utils/emailService');

// Middleware para verificar si el conductor está habilitado
const isDriverEnabled = async (req, res, next) => {
    try {
        const driverResult = await pool.query("SELECT estado_conductor FROM Usuarios WHERE id = $1", [req.user.id]);
        if (driverResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario conductor no encontrado.' });
        }
        if (driverResult.rows[0].estado_conductor !== 'habilitado') {
            return res.status(403).json({ error: 'Tu cuenta está bloqueada hasta que se verifique el pago de tu último viaje.' });
        }
        next();
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
};

// --- RUTAS GET ---
router.get('/', auth, async (req, res) => {
    try {
        const availableTrips = await pool.query("SELECT * FROM Viajes WHERE estado_viaje = 'nuevo' ORDER BY fecha_creacion DESC");
        res.json(availableTrips.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
});

// GET /api/trips/my-trips (Para clientes, CON DATOS DEL CONDUCTOR)
router.get('/my-trips', auth, async (req, res) => {
    try {
        const cliente_id = req.user.id;
        const myTrips = await pool.query(
            `SELECT 
                v.*, 
                c.nombre_completo AS conductor_nombre, 
                c.telefono AS conductor_telefono 
             FROM Viajes v
             LEFT JOIN Usuarios c ON v.conductor_id = c.id
             WHERE v.cliente_id = $1 
             ORDER BY v.fecha_creacion DESC`,
            [cliente_id]
        );
        res.json(myTrips.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
});

// GET /api/trips/my-accepted-trips (Para conductores, CON DATOS DEL CLIENTE)
router.get('/my-accepted-trips', auth, async (req, res) => {
    try {
        const conductor_id = req.user.id;
        const acceptedTrips = await pool.query(
            `SELECT 
                v.*, 
                u.nombre_completo AS cliente_nombre, 
                u.telefono AS cliente_telefono 
             FROM Viajes v
             JOIN Usuarios u ON v.cliente_id = u.id
             WHERE v.conductor_id = $1 AND (v.estado_viaje = 'aceptado' OR v.estado_viaje = 'finalizado')
             ORDER BY v.fecha_creacion DESC`,
            [conductor_id]
        );
        res.json(acceptedTrips.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
});

router.get('/my-pending-trip', auth, async (req, res) => {
    try {
        const conductor_id = req.user.id;
        const pendingTrip = await pool.query(
            "SELECT * FROM Viajes WHERE conductor_id = $1 AND estado_viaje = 'finalizado' AND comprobante_url IS NULL ORDER BY fecha_creacion DESC LIMIT 1",
            [conductor_id]
        );
        if (pendingTrip.rows.length === 0) {
            return res.json(null);
        }
        res.json(pendingTrip.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
});


// --- RUTAS POST y PUT :) ---
router.post('/', auth, async (req, res) => {
    try {
        const { ubicacion_inicio, ubicacion_final, descripcion_carga, precio_ofrecido } = req.body;
        const newTrip = await pool.query(
            `INSERT INTO Viajes (cliente_id, ubicacion_inicio, ubicacion_final, descripcion_carga, precio_ofrecido) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [req.user.id, ubicacion_inicio, ubicacion_final, descripcion_carga, precio_ofrecido]
        );
        res.status(201).json(newTrip.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
});

router.put('/accept/:id', auth, isDriverEnabled, async (req, res) => {
    try {
        const { id: tripId } = req.params;
        const { id: conductorId } = req.user;
        const tripResult = await pool.query(
            `SELECT v.*, u.email as cliente_email FROM Viajes v JOIN Usuarios u ON v.cliente_id = u.id WHERE v.id = $1`,
            [tripId]
        );
        if (tripResult.rows.length === 0) return res.status(404).json({ error: 'Viaje no encontrado.' });
        if (tripResult.rows[0].estado_viaje !== 'nuevo') return res.status(400).json({ error: 'Este viaje ya no está disponible.' });
        
        const updatedTrip = await pool.query(`UPDATE Viajes SET conductor_id = $1, estado_viaje = 'aceptado' WHERE id = $2 RETURNING *`, [conductorId, tripId]);
        
        sendEmail(
            tripResult.rows[0].cliente_email,
            '¡Un conductor ha aceptado tu viaje en NexoCargo!',
            `<h1>¡Buenas noticias!</h1><p>Un conductor ha aceptado tu flete. Pronto se pondrá en contacto contigo.</p><p>ID del Viaje: ${tripId}</p>`
        );

        res.json(updatedTrip.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
});

router.put('/counter-offer/:id', auth, isDriverEnabled, async (req, res) => {
    try {
        const { id: tripId } = req.params;
        const { id: conductorId } = req.user;
        const { newPrice } = req.body;
        if (!newPrice || newPrice <= 0) return res.status(400).json({ error: 'Se requiere un precio válido.' });
        
        const tripResult = await pool.query(
            `SELECT v.*, u.email as cliente_email FROM Viajes v JOIN Usuarios u ON v.cliente_id = u.id WHERE v.id = $1`,
            [tripId]
        );

        if (tripResult.rows.length === 0) return res.status(404).json({ error: 'Viaje no encontrado.' });
        if (tripResult.rows[0].estado_viaje !== 'nuevo') return res.status(400).json({ error: 'Este viaje ya no está disponible para negociar.' });
        
        const updatedTrip = await pool.query(`UPDATE Viajes SET conductor_id = $1, estado_viaje = 'contraoferta', precio_final = $2 WHERE id = $3 RETURNING *`, [conductorId, newPrice, tripId]);
        
        sendEmail(
            tripResult.rows[0].cliente_email,
            '¡Has recibido una contraoferta en NexoCargo!',
            `<h1>Nueva Contraoferta</h1><p>Un conductor está interesado en tu viaje por un nuevo precio de $${newPrice}.</p><p>Inicia sesión en NexoCargo para aceptar o rechazar la oferta.</p>`
        );
        
        res.json(updatedTrip.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
});

router.put('/accept-counter/:id', auth, async (req, res) => {
    try {
        const { id: tripId } = req.params;
        const { id: clienteId } = req.user;
        const tripResult = await pool.query(
            `SELECT v.*, c.email as conductor_email FROM Viajes v JOIN Usuarios c ON v.conductor_id = c.id WHERE v.id = $1 AND v.cliente_id = $2 AND v.estado_viaje = 'contraoferta'`,
            [tripId, clienteId]
        );

        if (tripResult.rows.length === 0) return res.status(404).json({ error: 'Contraoferta no encontrada.' });
        
        const updatedTrip = await pool.query(`UPDATE Viajes SET estado_viaje = 'aceptado' WHERE id = $1 RETURNING *`, [tripId]);
        
        sendEmail(
            tripResult.rows[0].conductor_email,
            '¡Tu contraoferta ha sido aceptada!',
            `<h1>¡Contraoferta Aceptada!</h1><p>El cliente ha aceptado tu nuevo precio. Ya puedes ver sus datos de contacto en tu panel de "Mis Viajes Aceptados".</p>`
        );

        res.json(updatedTrip.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
});

router.put('/reject-counter/:id', auth, async (req, res) => {
    try {
        const { id: tripId } = req.params;
        const { id: clienteId } = req.user;
        const tripResult = await pool.query( "SELECT * FROM Viajes WHERE id = $1 AND cliente_id = $2 AND estado_viaje = 'contraoferta'", [tripId, clienteId]);
        if (tripResult.rows.length === 0) {
            return res.status(404).json({ error: 'Contraoferta no encontrada.' });
        }
        const updatedTrip = await pool.query( `UPDATE Viajes SET estado_viaje = 'nuevo', conductor_id = NULL, precio_final = NULL WHERE id = $1 RETURNING *`, [tripId]);
        res.json(updatedTrip.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
});

router.put('/finish/:id', auth, async (req, res) => {
    try {
        const tripId = req.params.id;
        const conductorId = req.user.id;
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query("UPDATE Viajes SET estado_viaje = 'finalizado' WHERE id = $1 AND conductor_id = $2", [tripId, conductorId]);
            await client.query("UPDATE Usuarios SET estado_conductor = 'pago_pendiente' WHERE id = $1", [conductorId]);
            await client.query('COMMIT');
            res.json({ message: 'Viaje finalizado. Tu cuenta está pendiente de pago.' });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        res.status(500).send('Error en el servidor');
    }
});

router.post('/upload-proof/:id', auth, async (req, res) => {
    try {
        const tripId = req.params.id;
        const conductorId = req.user.id;
        const { proofUrl } = req.body;
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query("UPDATE Viajes SET comprobante_url = $1 WHERE id = $2 AND conductor_id = $3", [proofUrl, tripId, conductorId]);
            await client.query("UPDATE Usuarios SET estado_conductor = 'verificacion_pendiente' WHERE id = $1", [conductorId]);
            await client.query('COMMIT');
            res.json({ message: 'Comprobante enviado. Esperando aprobación del administrador.' });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        res.status(500).send('Error en el servidor');
    }
});

router.put('/cancel/client/:id', auth, async (req, res) => {
    try {
        const { id: tripId } = req.params;
        const { id: clienteId } = req.user;
        const updatedTrip = await pool.query(
            "UPDATE Viajes SET estado_viaje = 'cancelado_cliente' WHERE id = $1 AND cliente_id = $2 RETURNING *",
            [tripId, clienteId]
        );
        if (updatedTrip.rows.length === 0) {
            return res.status(404).json({ error: 'Viaje no encontrado o no autorizado.' });
        }
        res.json(updatedTrip.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
});

router.put('/cancel/driver/:id', auth, async (req, res) => {
    try {
        const { id: tripId } = req.params;
        const { id: conductorId } = req.user;
        const updatedTrip = await pool.query(
            "UPDATE Viajes SET estado_viaje = 'nuevo', conductor_id = NULL, precio_final = NULL WHERE id = $1 AND conductor_id = $2 RETURNING *",
            [tripId, conductorId]
        );
        if (updatedTrip.rows.length === 0) {
            return res.status(404).json({ error: 'Viaje no encontrado o no autorizado.' });
        }
        res.json(updatedTrip.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
});

router.put('/reassign/:id', auth, async (req, res) => {
    try {
        const { id: tripId } = req.params;
        const { id: clienteId } = req.user;
        const updatedTrip = await pool.query(
            "UPDATE Viajes SET estado_viaje = 'nuevo', conductor_id = NULL, precio_final = NULL WHERE id = $1 AND cliente_id = $2 RETURNING *",
            [tripId, clienteId]
        );
        if (updatedTrip.rows.length === 0) {
            return res.status(404).json({ error: 'Viaje no encontrado o no autorizado.' });
        }
        res.json(updatedTrip.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
});

module.exports = router;