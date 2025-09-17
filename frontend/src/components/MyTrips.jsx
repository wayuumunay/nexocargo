import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MyTrips = () => {
    const [myTrips, setMyTrips] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMyTrips = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            const res = await axios.get('http://localhost:3001/api/trips/my-trips', config);
            setMyTrips(res.data);
        } catch (error) {
            console.error('Error al obtener mis viajes:', error.response ? error.response.data : error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyTrips();
    }, []);

    const handleAcceptCounter = async (tripId) => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            await axios.put(`http://localhost:3001/api/trips/accept-counter/${tripId}`, null, config);
            alert('¡Contraoferta aceptada! El viaje ha sido confirmado.');
            fetchMyTrips();
        } catch (error) {
            console.error('Error al aceptar la contraoferta:', error.response ? error.response.data : error.message);
            alert('No se pudo aceptar la contraoferta.');
        }
    };

    const handleRejectCounter = async (tripId) => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            await axios.put(`http://localhost:3001/api/trips/reject-counter/${tripId}`, null, config);
            alert('Contraoferta rechazada. El viaje vuelve a estar disponible para otros conductores.');
            fetchMyTrips();
        } catch (error) {
            console.error('Error al rechazar la contraoferta:', error.response ? error.response.data : error.message);
            alert('No se pudo rechazar la contraoferta.');
        }
    };

    const handleCancelByClient = async (tripId) => {
        if (!window.confirm('¿Seguro que quieres cancelar este viaje permanentemente? Esta acción no se puede deshacer.')) return;
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            await axios.put(`http://localhost:3001/api/trips/cancel/client/${tripId}`, null, config);
            alert('Viaje cancelado.');
            fetchMyTrips();
        } catch (error) {
            alert('No se pudo cancelar el viaje.');
        }
    };

    const handleFindAnotherDriver = async (tripId) => {
        if (!window.confirm('¿Seguro que quieres quitar al conductor actual y volver a publicar este viaje?')) return;
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            await axios.put(`http://localhost:3001/api/trips/reassign/${tripId}`, null, config);
            alert('El viaje ha sido publicado nuevamente.');
            fetchMyTrips();
        } catch (error) {
            alert('No se pudo republicar el viaje.');
        }
    };

    if (loading) {
        return <progress indeterminate="true"></progress>;
    }

    return (
        <div>
            <h2>Mis Solicitudes de Viaje</h2>
            {myTrips.length === 0 ? (
                <article>Aún no has publicado ningún viaje.</article>
            ) : (
                <div>
                    {myTrips.map(trip => (
                        <article key={trip.id}>
                            <header>
                                <strong>De:</strong> {trip.ubicacion_inicio} <br/>
                                <strong>A:</strong> {trip.ubicacion_final}
                            </header>
                            <p><strong>Estado:</strong> {trip.estado_viaje}</p>
                            <p><strong>Precio Original:</strong> ${trip.precio_ofrecido}</p>
                            
                            {trip.estado_viaje === 'contraoferta' && (
                                <div style={{ backgroundColor: '#0c0a0aff', padding: '10px', marginTop: '10px' }}>
                                    <p><strong>¡Nueva Contraoferta Recibida!</strong></p>
                                    <p><strong>Nuevo Precio: ${trip.precio_final}</strong></p>
                                    <button onClick={() => handleAcceptCounter(trip.id)}>Aceptar Contraoferta</button>
                                    <button onClick={() => handleRejectCounter(trip.id)} className="secondary" style={{ marginLeft: '10px' }}>Rechazar</button>
                                </div>
                            )}

                            {trip.conductor_id && (
                                <div style={{ backgroundColor: '#0c0a0aff', padding: '10px', marginTop: '10px', borderRadius: '5px' }}>
                                    <strong>Datos de Contacto del Conductor:</strong>
                                    <p style={{ margin: '5px 0 0 0' }}>Nombre: {trip.conductor_nombre}</p>
                                    <p style={{ margin: '5px 0 0 0' }}>Teléfono: {trip.conductor_telefono}</p>
                                </div>
                            )}
                            
                            <footer style={{ paddingTop: '1rem' }}>
                                <div className="grid">
                                    {/* Si el viaje está aceptado, el cliente puede cancelar o buscar otro conductor */}
                                    {trip.estado_viaje === 'aceptado' && (
                                        <>
                                            <button onClick={() => handleCancelByClient(trip.id)} className="secondary outline">Cancelar Viaje</button>
                                            <button onClick={() => handleFindAnotherDriver(trip.id)}>Buscar Otro Conductor</button>
                                        </>
                                    )}
                                </div>
                            </footer>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyTrips;