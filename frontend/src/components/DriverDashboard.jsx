import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AvailableTrips from './AvailableTrips';
import MyAcceptedTrips from './MyAcceptedTrips';
import PaymentView from './PaymentView';

const DriverDashboard = () => {
    const [driverProfile, setDriverProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('available');

    useEffect(() => {
        const fetchDriverProfile = async () => {
            console.log('Buscando perfil del conductor...'); // Espía 1
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { 'x-auth-token': token } };
                const res = await axios.get('http://localhost:3001/api/users/me', config);
                
                // --- ESPÍA 2: ¿Qué nos devuelve el backend? ---
                console.log('Perfil del conductor recibido del backend:', res.data);
                
                setDriverProfile(res.data);
            } catch (error) {
                console.error('Error al obtener el perfil del conductor', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDriverProfile();
    }, []);

    // --- ESPÍA 3: ¿Qué hay en el estado antes de decidir qué mostrar? ---
    console.log('Estado del perfil antes de renderizar:', driverProfile);

    if (loading) {
        return <progress indeterminate></progress>;
    }
    
    if (driverProfile && driverProfile.estado_conductor !== 'habilitado') {
        return <PaymentView userStatus={driverProfile.estado_conductor} />;
    }

    return (
        <div>
            <nav>
                <button onClick={() => setView('available')}>Viajes Disponibles</button>
                <button onClick={() => setView('accepted')} className="secondary">Mis Viajes Aceptados</button>
            </nav>
            <hr />
            {view === 'available' ? <AvailableTrips /> : <MyAcceptedTrips />}
        </div>
    );
};

export default DriverDashboard;