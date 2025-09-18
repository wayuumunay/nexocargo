import React, { useState, useEffect } from 'react';
import api from 'axios';

const PaymentView = ({ userStatus }) => {
    // Leemos los datos desde las variables de entorno del frontend
    const cbu = import.meta.env.VITE_PAYMENT_CBU;
    const alias = import.meta.env.VITE_PAYMENT_ALIAS;
    const holder = import.meta.env.VITE_PAYMENT_HOLDER;

    const [pendingTrip, setPendingTrip] = useState(null);
    const [proofUrl, setProofUrl] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPendingTrip = async () => {
            if (userStatus === 'pago_pendiente') {
                try {
                    const token = localStorage.getItem('token');
                    const config = { headers: { 'x-auth-token': token } };
                    const res = await api.get('/api/trips/my-pending-trip', config);
                    setPendingTrip(res.data);
                } catch (error) {
                    console.error("Error al obtener el viaje pendiente", error);
                }
            }
            setLoading(false);
        };
        fetchPendingTrip();
    }, [userStatus]);

    const handleSubmitProof = async (e) => {
        e.preventDefault();
        if (!proofUrl) {
            return alert('Por favor, pega el enlace a tu comprobante.');
        }
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            const body = { proofUrl };
            await api.post(`/api/trips/upload-proof/${pendingTrip.id}`, body, config);
            alert('Comprobante enviado con éxito. Será revisado por un administrador.');
            window.location.reload();
        } catch (error) {
            console.error('Error al enviar el comprobante:', error.response ? error.response.data : error.message);
            alert('No se pudo enviar el comprobante.');
        }
    };

    if (loading) {
        return <progress indeterminate="true"></progress>;
    }

    if (userStatus === 'verificacion_pendiente') {
        return (
            <article>
                <header><h2>Pago en Verificación</h2></header>
                <p>Tu comprobante ya fue recibido y está **pendiente de revisión** por un administrador.</p>
                <p>Este proceso puede demorar hasta 24 horas hábiles.</p>
            </article>
        );
    }

    if (userStatus === 'pago_pendiente' && pendingTrip) {
        const commission = parseFloat(pendingTrip.precio_final || pendingTrip.precio_ofrecido) * 0.10;
        return (
            <article>
                <header><h2>Pago de Comisión Pendiente</h2></header>
                <p>Para volver a aceptar viajes, debes transferir la comisión del 10% de tu último viaje.</p>
                <h4>Instrucciones de Pago:</h4>
                <ul>
                    {/* Mostramos los datos leídos desde el archivo .env */}
                    <li><strong>Monto a transferir:</strong> $ARS {commission.toFixed(2)}</li>
                    <li><strong>CBU:</strong> {cbu}</li>
                    <li><strong>Alias:</strong> {alias}</li>
                    <li><strong>Titular:</strong> {holder}</li>
                </ul>
                <form onSubmit={handleSubmitProof}>
                    <label htmlFor="proofUrl">Enlace a tu Comprobante de Pago</label>
                    <input 
                        type="text"
                        name="proofUrl"
                        value={proofUrl}
                        onChange={(e) => setProofUrl(e.target.value)}
                        placeholder="Sube el comprobante a postimages.org y pega el enlace aquí"
                        required
                    />
                    <button type="submit">Enviar Comprobante</button>
                </form>
            </article>
        );
    }
    
    return <article>Tu cuenta se encuentra restringida. Contacta a soporte.</article>;
};

export default PaymentView;