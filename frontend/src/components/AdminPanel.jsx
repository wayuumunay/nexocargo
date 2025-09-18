import React, { useState, useEffect } from 'react';
import api from 'axios';

const AdminPanel = ({ adminKey }) => {
    const [pendingDrivers, setPendingDrivers] = useState([]);
    const [pendingPayments, setPendingPayments] = useState([]);
    const [allUsers, setAllUsers] = useState([]); // Nuevo estado para la lista de todos los usuarios
    const [loading, setLoading] = useState(true);
    const [selectedUserId, setSelectedUserId] = useState(''); // Nuevo estado para el usuario seleccionado

    // La función ahora buscará los 3 tipos de datos
    const fetchData = async () => {
        setLoading(true);
        try {
            const config = { headers: { 'x-admin-key': adminKey } };
            const [driversRes, paymentsRes, usersRes] = await Promise.all([
                api.get('/api/admin/pending-drivers', config),
                api.get('/api/admin/pending-verifications', config),
                api.get('/api/admin/users', config) // Petición para la nueva lista
            ]);
            setPendingDrivers(driversRes.data);
            setPendingPayments(paymentsRes.data);
            setAllUsers(usersRes.data);
        } catch (error) {
            console.error("Error al cargar datos del panel de admin:", error);
            alert("No se pudieron cargar los datos. ¿La clave de admin es correcta?");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (adminKey) {
            fetchData();
        }
    }, [adminKey]);

    const handleApproveDriver = async (driverId) => {
        if (!window.confirm(`¿Seguro que quieres aprobar al conductor con ID: ${driverId}?`)) return;
        try {
            const config = { headers: { 'x-admin-key': adminKey } };
            await api.put(`/api/admin/approve-driver/${driverId}`, null, config);
            alert('Conductor aprobado.');
            fetchData(); // Recargamos los datos
        } catch (error) {
            alert('Error al aprobar conductor.');
        }
    };

    const handleApprovePayment = async (driverId) => {
        if (!window.confirm(`¿Seguro que quieres aprobar el pago del conductor con ID: ${driverId}?`)) return;
        try {
            const config = { headers: { 'x-admin-key': adminKey } };
            await api.put(`/api/admin/approve-payment/${driverId}`, null, config);
            alert('Pago aprobado.');
            fetchData(); // Recargamos los datos
        } catch (error) {
            alert('Error al aprobar el pago.');
        }
    };

    // Nueva función para resetear la contraseña
    const handleResetPassword = async () => {
        const selectedUser = allUsers.find(user => user.id === parseInt(selectedUserId));
        if (!selectedUser) return;

        const newPassword = window.prompt(`Ingresa la NUEVA contraseña temporal para el usuario ${selectedUser.email}:`);
        if (!newPassword || newPassword.length < 6) {
            alert("La contraseña debe tener al menos 6 caracteres.");
            return;
        }
        try {
            const config = { headers: { 'x-admin-key': adminKey } };
            const body = { newPassword };
            const res = await api.put(`/api/admin/reset-password/${selectedUserId}`, body, config);
            alert(res.data.message);
        } catch (error) {
            alert('Error al resetear la contraseña.');
            console.error(error);
        }
    };

    if (loading) return <progress indeterminate="true"></progress>;

    return (
        <div>
            <article>
                <header><h3>Conductores Pendientes de Aprobación</h3></header>
                {pendingDrivers.length === 0 ? <p>No hay conductores pendientes.</p> : (
                    <table>
                        <thead><tr><th>Nombre</th><th>Email</th><th>Patente</th><th>Foto</th><th>Acción</th></tr></thead>
                        <tbody>
                            {pendingDrivers.map(driver => (
                                <tr key={driver.id}>
                                    <td>{driver.nombre_completo}</td>
                                    <td>{driver.email}</td>
                                    <td>{driver.patente}</td>
                                    <td><a href={driver.foto_url} target="_blank" rel="noopener noreferrer">Ver Foto</a></td>
                                    <td><button onClick={() => handleApproveDriver(driver.id)}>Aprobar</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </article>

            <article style={{ marginTop: '2rem' }}>
                <header><h3>Pagos Pendientes de Verificación</h3></header>
                {pendingPayments.length === 0 ? <p>No hay pagos pendientes.</p> : (
                     <table>
                        <thead><tr><th>Nombre</th><th>Email</th><th>Comprobante</th><th>Acción</th></tr></thead>
                        <tbody>
                            {pendingPayments.map(payment => (
                                <tr key={payment.id}>
                                    <td>{payment.nombre_completo}</td>
                                    <td>{payment.email}</td>
                                    <td><a href={payment.comprobante_url} target="_blank" rel="noopener noreferrer">Ver Comprobante</a></td>
                                    <td><button onClick={() => handleApprovePayment(payment.id)}>Aprobar Pago</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </article>

            {/* --- SECCIÓN DE GESTIÓN DE USUARIOS AÑADIDA --- */}
            <article style={{ marginTop: '2rem' }}>
                <header><h3>Gestión de Usuarios (Resetear Contraseña)</h3></header>
                
                <label htmlFor="user-select">Selecciona un usuario:</label>
                <select 
                    id="user-select"
                    value={selectedUserId} 
                    onChange={e => setSelectedUserId(e.target.value)}
                >
                    <option value="" disabled>-- Elige un usuario --</option>
                    {allUsers.map(user => (
                        <option key={user.id} value={user.id}>
                            {user.nombre_completo} ({user.email}) - {user.tipo_de_usuario}
                        </option>
                    ))}
                </select>

                {/* El botón solo aparece si se ha seleccionado un usuario */}
                {selectedUserId && (
                    <button 
                        className="secondary" 
                        onClick={handleResetPassword} 
                        style={{ marginTop: '1rem' }}
                    >
                        Resetear Contraseña
                    </button>
                )}
            </article>
        </div>
    );
};

export default AdminPanel;