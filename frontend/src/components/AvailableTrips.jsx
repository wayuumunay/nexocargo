import React, { useState, useEffect } from 'react';
import api from 'axios';

const Dashboard = () => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrips = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { 'x-auth-token': token } };
                const res = await api.get('/api/trips', config);
                setTrips(res.data);
            } catch (error) {
                console.error('Error al obtener los viajes:', error.response ? error.response.data : error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchTrips();
    }, []);

    const handleAcceptTrip = async (tripId) => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            await api.put(`/api/trips/accept/${tripId}`, null, config);
            alert('¡Viaje aceptado con éxito!');
            setTrips(trips.filter(trip => trip.id !== tripId));
        } catch (error) {
            console.error('Error al aceptar el viaje:', error.response ? error.response.data : error.message);
            alert('No se pudo aceptar el viaje.');
        }
    };

    const handleCounterOffer = async (tripId) => {
        const newPrice = window.prompt('Ingresa tu contraoferta:');
        if (!newPrice || isNaN(newPrice)) {
            alert('Por favor, ingresa un precio válido.');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            const body = { newPrice };
            await api.put(`/api/trips/counter-offer/${tripId}`, body, config);
            alert('¡Contraoferta enviada!');
            setTrips(trips.filter(trip => trip.id !== tripId));
        } catch (error) {
            console.error('Error al enviar contraoferta:', error.response ? error.response.data : error.message);
            alert('No se pudo enviar la contraoferta.');
        }
    };

    if (loading) {
        return <progress indeterminate></progress>; // Usamos un componente de carga de Pico
    }

    return (
        <div>
            <h2>Viajes Disponibles</h2>
            {trips.length === 0 ? (
                <article>No hay viajes disponibles en este momento.</article>
            ) : (
                <div>
                    {trips.map(trip => (
                        // --- ESTA ES LA ESTRUCTURA MEJORADA ---
                        <article key={trip.id}>
                            <header>
                                <strong>De:</strong> {trip.ubicacion_inicio} <br />
                                <strong>A:</strong> {trip.ubicacion_final}
                            </header>
                            <p><strong>Carga:</strong> {trip.descripcion_carga}</p>
                            <footer>
                                <div className="grid">
                                    <div><strong>Precio Ofrecido: ${trip.precio_ofrecido}</strong></div>
                                    {/* Agrupamos los botones para que se vean bien */}
                                    <div style={{ textAlign: 'right' }}>
                                        <button className="secondary" onClick={() => handleCounterOffer(trip.id)}>Contraoferta</button>
                                        <button onClick={() => handleAcceptTrip(trip.id)} style={{ marginLeft: '10px' }}>Aceptar Viaje</button>
                                    </div>
                                </div>
                            </footer>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;