import React from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Componente que renderiza el ToastContainer. 
// Este componente debe incluirse una sola vez en la aplicación, generalmente en el componente raíz.
const ToastifyComponent = () => {
    return (
        <ToastContainer
            position="top-center"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
        />
    );
};

// Funciones helper para disparar notificaciones
export const notifySuccess = (message) => {
    // console.log('🔔 notifySuccess:', message);
    // console.log('se ejecuta toaste')
    toast.success(message);
};

export const notifyError = (message) => {
    toast.error(message);
};

export const notifyInfo = (message) => {
    toast.info(message);
};

export const notifyWarning = (message) => {
    toast.warn(message);
};

export default ToastifyComponent;
