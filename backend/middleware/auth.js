const jwt = require('jsonwebtoken');

function auth(req, res, next) {
    // 1. Obtener el token del header de la petición
    const token = req.header('x-auth-token');

    // 2. Verificar si no hay token
    if (!token) {
        return res.status(401).json({ error: 'No hay token, permiso denegado.' });
    }

    try {
        // 3. Verificar si el token es válido
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Guardar el payload del token (que contiene el id del usuario) en el objeto de la petición
        req.user = decoded.user;

        // 5. Llamar a next() para que la petición continúe su camino
        next();
    } catch (error) {
        res.status(401).json({ error: 'El token no es válido.' });
    }
}

module.exports = auth;