import React, { useState, useEffect } from 'react';
import api from '../api/axios'; // Cambiamos la importación

const MyAcceptedTrips = () => {
    const [acceptedTrips, setAcceptedTrips] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAcceptedTrips = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            // Usamos 'api' y una ruta relativa
            const res = await api.get('/api/trips/my-accepted-trips', config);
            setAcceptedTrips(res.data);
        } catch (error) {
            console.error('Error al obtener los viajes aceptados:', error.response ? error.response.data : error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAcceptedTrips();
    }, []);

    const handleFinishTrip = async (tripId) => {
        if (!window.confirm('¿Estás seguro de que quieres marcar este viaje como finalizado? Tu cuenta se bloqueará hasta que se verifique el pago de la comisión.')) {
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            // Usamos 'api' y una ruta relativa
            await api.put(`/api/trips/finish/${tripId}`, null, config);
            alert('Viaje finalizado. Ahora debes reportar el pago de la comisión para poder aceptar nuevos viajes.');
            window.location.reload();
        } catch (error) {
            console.error('Error al finalizar el viaje:', error.response ? error.response.data : error.message);
            alert('No se pudo finalizar el viaje.');
        }
    };

    const handleCancelTrip = async (tripId) => {
        if (!window.confirm('¿Seguro que quieres cancelar este viaje? El viaje volverá a estar disponible para otros conductores.')) return;
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            // Usamos 'api' y una ruta relativa
            await api.put(`/api/trips/cancel/driver/${tripId}`, null, config);
            alert('Has cancelado el viaje.');
            fetchAcceptedTrips(); // Recargamos la lista
        } catch (error) {
            alert('No se pudo cancelar el viaje.');
        }
    };

    if (loading) {
        return <progress indeterminate="true"></progress>;
    }

    return (
        <div>
            <h2>Mis Viajes Aceptados</h2>
            {acceptedTrips.length === 0 ? (
                <article>No tienes viajes aceptados en este momento.</article>
            ) : (
                <div>
                    {acceptedTrips.map(trip => (
                        <article key={trip.id}>
                            <header>
                                <strong>De:</strong> {trip.ubicacion_inicio} <br />
                                <strong>A:</strong> {trip.ubicacion_final}
                            </header>
                            <p><strong>Carga:</strong> {trip.descripcion_carga}</p>
                            
                            <div style={{ backgroundColor: '#0c0a0aff', padding: '10px', marginTop: '10px', borderRadius: '5px' }}>
                                <strong>Datos de Contacto del Cliente:</strong>
                                <p style={{ margin: '5px 0 0 0' }}>Nombre: {trip.cliente_nombre}</p>
                                <p style={{ margin: '5px 0 0 0' }}>Teléfono: {trip.cliente_telefono}</p>
                            </div>

                            <footer style={{ paddingTop: '1rem' }}>
                                <div className="grid">
                                    <div><strong>Precio Final: ${trip.precio_final || trip.precio_ofrecido}</strong></div>
                                    <div style={{ textAlign: 'right' }}>
                                        <button onClick={() => handleCancelTrip(trip.id)} className="secondary outline">Cancelar Viaje</button>
                                        <button onClick={() => handleFinishTrip(trip.id)} style={{ marginLeft: '10px' }}>Finalizar Viaje</button>
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

export default MyAcceptedTrips;