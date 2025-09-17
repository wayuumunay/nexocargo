import React, { useState, useEffect } from 'react';
import { Routes, Route, Outlet, Link } from 'react-router-dom';
import AdminPanel from './components/AdminPanel';
import Register from './components/Register';
import Login from './components/Login';
import DriverDashboard from './components/DriverDashboard';
import MyTrips from './components/MyTrips';
import CreateTrip from './components/CreateTrip';
// Se eliminan las importaciones de VerificationSuccess y EmailVerification

// --- Componente para la Estructura Visual Permanente ---
const Layout = () => (
  <main className="container">
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Link to="/">
        <img src="/logo.png" alt="NexoCargo Logo" style={{ height: '120px' }} />
      </Link>
      <p style={{ margin: 0, color: 'yellow' }}>
          <strong>Versión BETA</strong> <br />
          Únicamente disponible para Mar del Plata
      </p>
    </header>
    <hr />
    <Outlet /> 
  </main>
);

// --- Componente para la Vista del Usuario Logueado ---
const UserView = ({ user, handleLogout }) => (
  <div>
    <div style={{ margin: '1rem 0' }}>
      <span>Bienvenido, {user.nombre_completo}</span>
      <button onClick={handleLogout} style={{ marginLeft: '10px' }}>Cerrar Sesión</button>
    </div>
    <hr />
    {user.tipo_de_usuario === 'conductor' ? <DriverDashboard /> : <ClientView />}
  </div>
);

// --- Componente para la Vista del Cliente ---
const ClientView = () => {
  const [clientView, setClientView] = useState('my-trips');
  return (
    <div>
      <nav>
        <button onClick={() => setClientView('my-trips')}>Ver Mis Viajes</button>
        <button onClick={() => setClientView('create')}>Crear Nuevo Viaje</button>
      </nav>
      <hr />
      {clientView === 'my-trips' ? <MyTrips /> : <CreateTrip />}
    </div>
  );
};

// --- Componente para la Vista de Login/Registro ---
const AuthView = () => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem' }}>
    <Register />
    <Login />
  </div>
);

// --- Componente para el Panel de Admin Protegido ---
const AdminView = () => {
  const [adminKey, setAdminKey] = useState(null);

  useEffect(() => {
    if (!adminKey) {
      const key = window.prompt("Ingresa la clave de administrador:");
      if (key && key.trim() === import.meta.env.VITE_ADMIN_SECRET_KEY) {
        setAdminKey(key.trim());
      } else {
        alert("Clave incorrecta.");
        window.location.href = '/';
      }
    }
  }, []);

  return adminKey ? <AdminPanel adminKey={adminKey} /> : <progress indeterminate="true"></progress>;
};

// --- Componente Principal que Maneja las Rutas ---
function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.reload();
  };

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        
        <Route index element={user ? <UserView user={user} handleLogout={handleLogout} /> : <AuthView />} />
        <Route path="admin" element={<AdminView />} />
        
        {/* --- RUTAS DE VERIFICACIÓN ELIMINADAS --- */}
        
        <Route path="*" element={<h3>Página no encontrada</h3>} />
      </Route>
    </Routes>
  );
}

export default App;