// App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/pages/Login';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/pages/Dashboard';
import Request from './components/pages/Request';
import MyServices from './components/pages/MyServices';
import History from './components/pages/History';
import Favorites from './components/pages/Favorites';
import Valide from './components/pages/Valide';
import PersonalServices from './components/pages/ServicesPers';
import PersonalHistory from './components/pages/HistoryPers';
import Personal from './components/pages/Personal';
import CostCenter from './components/pages/CostCenter';
import Areas from './components/pages/Areas';
import Tracking from './components/pages/Tracking';
import ToastifyComponent from './utils/ToastifyComponent';
import Vale from './components/pages/Vale';
import './App.css';

// Layout para rutas protegidas
const AppLayout = () => {
  // Verifica nuevamente la autenticación al renderizar el layout
  const key = localStorage.getItem('key');
  if (!key) {
    // Si no hay token, redirige a la ruta raíz (o a /login)
    return <Navigate to="/" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <ToastifyComponent /> {/* Importante mostrarlo aquí */}
        <Routes>
          {/* Si el usuario autenticado ingresa a la raíz, redirigimos a /dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/request" element={<Request />} />
          <Route path="/myservices" element={<MyServices />} />
          <Route path="/history" element={<History />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/valide" element={<Valide />} />
          <Route path="/personalservices" element={<PersonalServices />} />
          <Route path="/personalhistory" element={<PersonalHistory />} />
          <Route path="/personal" element={<Personal />} />
          <Route path="/costcenter" element={<CostCenter />} />
          <Route path="/areas" element={<Areas />} />
        </Routes>
      </div>
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  // Guardamos los valores iniciales de las keys críticas después del login
  const [initialStorageValues, setInitialStorageValues] = useState(null);

  useEffect(() => {
    const key = localStorage.getItem('key');
    setIsAuthenticated(!!key);

    // Si está autenticado, guardamos los valores críticos para comparar luego.
    if (key) {
      setInitialStorageValues({
        key: localStorage.getItem('key'),
        idcliente: localStorage.getItem('idcliente'),
        idpersonal: localStorage.getItem('idpersonal'),
        nombrecomercial: localStorage.getItem('nombrecomercial'),
        administrador: localStorage.getItem('administrador'),
        apellidos: localStorage.getItem('apellidos'),
        eliminado: localStorage.getItem('eliminado'),
        fotourl: localStorage.getItem('fotourl'),
        idcondicion: localStorage.getItem('idcondicion'),
        idpersonaljefe: localStorage.getItem('idpersonaljefe'),
        idvalidaservicio: localStorage.getItem('idvalidaservicio'),
        nombres: localStorage.getItem('nombres'),
        telefonoprincipal: localStorage.getItem('telefonoprincipal'),
      });
    }
  }, []);

  // Una vez autenticado, establecemos un "watcher" sobre localStorage.
  useEffect(() => {
    if (!isAuthenticated || !initialStorageValues) return;

    // Guardamos las funciones originales
    const originalSetItem = localStorage.setItem;
    const originalRemoveItem = localStorage.removeItem;
    const protectedKeys = Object.keys(initialStorageValues);

    // Función que revisa si alguna key crítica cambió
    const checkProtectedKeys = () => {
      for (let key of protectedKeys) {
        if (localStorage.getItem(key) !== initialStorageValues[key]) {
          // Si hubo cambio, borramos localStorage y redirigimos.
          localStorage.clear();
          window.location.href = '/';
          return;
        }
      }
    };

    // Sobrescribir setItem
    localStorage.setItem = function (key, value) {
      const result = originalSetItem.apply(this, arguments);
      if (protectedKeys.includes(key)) {
        checkProtectedKeys();
      }
      return result;
    };

    // Sobrescribir removeItem
    localStorage.removeItem = function (key) {
      const result = originalRemoveItem.apply(this, arguments);
      if (protectedKeys.includes(key)) {
        checkProtectedKeys();
      }
      return result;
    };

    // Agregar listener para cambios desde otras pestañas
    const storageEventHandler = (event) => {
      if (protectedKeys.includes(event.key)) {
        checkProtectedKeys();
      }
    };

    window.addEventListener('storage', storageEventHandler);

    return () => {
      // Restaurar funciones originales y remover el listener
      localStorage.setItem = originalSetItem;
      localStorage.removeItem = originalRemoveItem;
      window.removeEventListener('storage', storageEventHandler);
    };
  }, [isAuthenticated, initialStorageValues]);

  // Mientras se verifica la autenticación, mostramos un indicador de carga.
  if (isAuthenticated === null) {
    return;
  }

  return (
    <Router>
      <Routes>
        {/* Ruta pública, accesible sin autenticación */}
        <Route path="/tracking" element={<Tracking />} />
        <Route path="/vale" element={<Vale />} />
        {/* Para el resto de las rutas, si está autenticado se muestra el layout protegido; de lo contrario, se redirige a Login */}
        <Route path="/*" element={isAuthenticated ? <AppLayout /> : <Login />} />
      </Routes>
    </Router>
  );
}

export default App;