import React, { useState } from 'react';
import api from '../api/axios'; // Corregimos la importación para usar nuestro archivo centralizado
import EyeIcon from './EyeIcon';
import EyeSlashIcon from './EyeSlashIcon';

const Register = () => {
    const [formData, setFormData] = useState({
        nombre_completo: '',
        email: '',
        password: '',
        password2: '',
        telefono: '',
        tipo_de_usuario: 'cliente',
        patente: '',
        foto_url: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showPassword2, setShowPassword2] = useState(false);

    const { nombre_completo, email, password, password2, telefono, tipo_de_usuario, patente, foto_url } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();

        if (password !== password2) {
            alert('Las contraseñas no coinciden.');
            return;
        }

        if (tipo_de_usuario === 'conductor') {
            const cleanedPatente = patente.replace(/\s/g, '').toUpperCase();
            const patenteRegex = /^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/;
            if (!patenteRegex.test(cleanedPatente)) {
                alert('El formato de la patente no es válido. Debe ser LLLNNN (ej: ABC123) o LLNNNLL (ej: AB123CD).');
                return;
            }
        }

        try {
            const { password2, ...dataToSend } = formData;
            await api.post('/api/users/register', dataToSend);
            
            if (dataToSend.tipo_de_usuario === 'conductor') {
                alert('¡Usuario registrado exitosamente! Tu cuenta será revisada por un administrador antes de ser activada.');
            } else {
                alert('¡Usuario registrado exitosamente! Ya puedes iniciar sesión.');
            }
            
            window.location.reload();
        } catch (error) {
            // --- MANEJO DE ERRORES MEJORADO ---
            if (error.response) {
                // El servidor respondió con un error (ej: email duplicado)
                console.error('Error en el registro:', error.response.data);
                // Muestra el mensaje de error específico del backend
                alert(`Error: ${error.response.data.error || 'No se pudo completar el registro.'}`);
            } else {
                // El servidor no respondió o hubo un error de red (CORS, etc.)
                console.error('Error de conexión:', error.message);
                alert('No se pudo conectar con el servidor. Revisa la consola (F12) para más detalles.');
            }
        }
    };

    return (
        <article>
            <header><h2>Registro</h2></header>
            <form onSubmit={onSubmit}>
                <label htmlFor="nombre_completo">Nombre Completo</label>
                <input type="text" name="nombre_completo" value={nombre_completo} onChange={onChange} required />

                <label htmlFor="telefono">Número de Teléfono (WhatsApp)</label>
                <input type="tel" name="telefono" value={telefono} onChange={onChange} required />

                <label htmlFor="email">Correo Electrónico</label>
                <input type="email" name="email" value={email} onChange={onChange} required />

                <label htmlFor="password">Contraseña</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'center' }}>
                    <input 
                        type={showPassword ? 'text' : 'password'} 
                        name="password" 
                        value={password} 
                        onChange={onChange} 
                        required 
                        minLength="6" 
                    />
                    <button type="button" className="secondary outline" onClick={() => setShowPassword(!showPassword)} style={{ padding: '0.5rem', width: 'auto' }}>
                        {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                    </button>
                </div>

                <label htmlFor="password2">Repetir Contraseña</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'center' }}>
                    <input 
                        type={showPassword2 ? 'text' : 'password'} 
                        name="password2" 
                        value={password2} 
                        onChange={onChange} 
                        required 
                        minLength="6" 
                    />
                    <button type="button" className="secondary outline" onClick={() => setShowPassword2(!showPassword2)} style={{ padding: '0.5rem', width: 'auto' }}>
                        {showPassword2 ? <EyeSlashIcon /> : <EyeIcon />}
                    </button>
                </div>
                
                <label htmlFor="tipo_de_usuario">Quiero registrarme como:</label>
                <select name="tipo_de_usuario" value={tipo_de_usuario} onChange={onChange}>
                    <option value="cliente">Cliente (para enviar fletes)</option>
                    <option value="conductor">Conductor (para realizar fletes)</option>
                </select>

                {tipo_de_usuario === 'conductor' && (
                    <>
                        <hr />
                        <p><strong>Datos del vehículo (requerido para conductores)</strong></p>
                        <label htmlFor="patente">Número de Patente</label>
                        <input type="text" name="patente" value={patente} onChange={onChange} required />
                        <label htmlFor="foto_url">Enlace a Foto del Vehículo (debe verse la patente)</label>
                        <input type="text" name="foto_url" value={foto_url} onChange={onChange} required placeholder="Sube la foto a postimages.org y pega el enlace aquí" />
                    </>
                )}

                <button type="submit" style={{ marginTop: '1rem' }}>Registrarse</button>
            </form>
        </article>
    );
};

export default Register;