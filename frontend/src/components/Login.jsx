import React, { useState } from 'react';
import axios from 'axios';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const onChange = e => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const onSubmit = async e => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:3001/api/users/login', formData);
            
            const { token, user } = res.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            alert('¡Inicio de sesión exitoso!');
            window.location.reload();

        } catch (error) {
            if (error.response) {
                console.error('Error en el login:', error.response.data);
                alert(`Error: ${error.response.data.error || 'Credenciales inválidas'}`);
            } else {
                console.error('Error de conexión:', error.message);
                alert('No se pudo conectar con el servidor. Por favor, asegúrate de que el backend esté funcionando.');
            }
        }
    };

    return (
        <article>
            <header><h2>Iniciar Sesión</h2></header>
            <form onSubmit={onSubmit}>
                <label htmlFor="email">Correo Electrónico</label>
                <input type="email" name="email" value={formData.email} onChange={onChange} required />
                <label htmlFor="password">Contraseña</label>
                <input type="password" name="password" value={formData.password} onChange={onChange} required />
                <button type="submit">Iniciar Sesión</button>
            </form>
        </article>
    );
};

export default Login;