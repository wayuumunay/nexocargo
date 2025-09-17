import React, { useState } from 'react';
import axios from 'axios';

const CreateTrip = () => {
    const [formData, setFormData] = useState({
        ubicacion_inicio: '',
        ubicacion_final: '',
        descripcion_carga: '',
        precio_ofrecido: ''
    });

    const { ubicacion_inicio, ubicacion_final, descripcion_carga, precio_ofrecido } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            }
        };

        try {
            const res = await axios.post('http://localhost:3001/api/trips', formData, config);
            console.log(res.data);
            alert('¡Viaje publicado exitosamente!');
        } catch (error) {
            console.error(error.response.data);
            alert('Hubo un error al publicar el viaje.');
        }
    };

    return (
        <div>
            <h2>Crear un Nuevo Viaje</h2>
            <form onSubmit={onSubmit}>
                <div>
                    <input type="text" placeholder="Ubicación de Inicio" name="ubicacion_inicio" value={ubicacion_inicio} onChange={onChange} required />
                </div>
                <div>
                    <input type="text" placeholder="Ubicación Final" name="ubicacion_final" value={ubicacion_final} onChange={onChange} required />
                </div>
                <div>
                    <textarea placeholder="Descripción de la Carga (tamaño, peso, etc.)" name="descripcion_carga" value={descripcion_carga} onChange={onChange} required />
                </div>
                <div>
                    <input type="number" placeholder="Precio Ofrecido" name="precio_ofrecido" value={precio_ofrecido} onChange={onChange} required />
                </div>
                <button type="submit">Publicar Viaje</button>
            </form>
        </div>
    );
};

export default CreateTrip;