import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './sidebar.css';
import logoSidebar from '../image/isologo_negativo.png';
import {
  TbLayoutDashboardFilled, TbMapPinFilled, TbArrowBigLeftLinesFilled, TbRosetteDiscountCheckFilled,
  TbLayoutListFilled, TbUserFilled, TbBrandWhatsappFilled, TbHeartFilled, TbFolderFilled,
  TbFiltersFilled, TbHelpSquareRoundedFilled, TbHourglassFilled, TbMenu2
} from "react-icons/tb";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false); // Estado del sidebar

  const empresa = localStorage.getItem('nombrecomercial');
  const administrador = localStorage.getItem('administrador');

  const Logout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <>
      {/* Botón hamburguesa */}
      <TbMenu2 className='icon-hamburger' onClick={() => setIsOpen(!isOpen)} />

      <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div>
          <div className="sidebar-logo">
            <img src={logoSidebar} alt="Logo Intranet" />
          </div>
          <ul onClick={() => setIsOpen(false)}> {/* Cierra al hacer clic */}
            <li><NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""}><TbLayoutDashboardFilled />Panel</NavLink></li>
            <li><NavLink to="/request" className={({ isActive }) => isActive ? "active" : ""}><TbMapPinFilled />Solicitar</NavLink></li>
            <li><NavLink to="/myservices" className={({ isActive }) => isActive ? "active" : ""}><TbLayoutListFilled />Mis servicios</NavLink></li>
            <li><NavLink to="/history" className={({ isActive }) => isActive ? "active" : ""}><TbFolderFilled />Historial</NavLink></li>
            <li><NavLink to="/favorites" className={({ isActive }) => isActive ? "active" : ""}><TbHeartFilled />Favoritos</NavLink></li>

            {administrador === 'true' && (
              <>
                <li className='line-sidebar'></li>
                {/* <li><NavLink to="/timebasedservice" className={({ isActive }) => isActive ? "active" : ""}><TbHourglassFilled />Serv. por tiempo</NavLink></li> */}
                <li><NavLink to="/valide" className={({ isActive }) => isActive ? "active" : ""}><TbRosetteDiscountCheckFilled />Valida solicitud</NavLink></li>
                <li><NavLink to="/personalservices" className={({ isActive }) => isActive ? "active" : ""}><TbLayoutListFilled />Personal serv.</NavLink></li>
                <li><NavLink to="/personalhistory" className={({ isActive }) => isActive ? "active" : ""}><TbFolderFilled />Personal hist.</NavLink></li>
                <li><NavLink to="/personal" className={({ isActive }) => isActive ? "active" : ""}><TbUserFilled />Personal</NavLink></li>
                <li><NavLink to="/costcenter" className={({ isActive }) => isActive ? "active" : ""}><TbFiltersFilled />Centros costos</NavLink></li>
                <li><NavLink to="/areas" className={({ isActive }) => isActive ? "active" : ""}><TbFiltersFilled />Áreas</NavLink></li>
              </>
            )}

            <li className='line-sidebar'></li>
            <a href="https://wa.me/+51992191450" target="_blank" rel="noopener noreferrer"><li className='sidebar-support'><TbBrandWhatsappFilled />Whatsapp</li></a>
            <a href="https://www.a1perucorp.com/" target="_blank" rel="noopener noreferrer"><li className='sidebar-support'><TbHelpSquareRoundedFilled />Mesa de ayuda</li></a>
            <li className='sidebar-support' onClick={Logout}><TbArrowBigLeftLinesFilled />Cerrar sesión</li>
          </ul>
        </div>

        <div className='business-admin'>
          <p className='business'>{empresa}</p>
          <p className='isAdmin'>{administrador === 'true' ? 'Administrador' : 'Usuario'}</p>
          <p style={{ textAlign: 'center', fontWeight: '600', marginTop: '8px', fontSize: '12px' }}>Versión 1.0.9</p>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;