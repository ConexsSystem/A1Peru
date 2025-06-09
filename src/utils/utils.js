import { notifySuccess, notifyError } from './ToastifyComponent'

// Función auxiliar para formatear fechas ISO a YYYY-MM-DD
export const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    return `${año}-${mes}-${dia}`;
};

export const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${dd}-${mm}-${yyyy} ${hh}:${min}:${ss}`;
}

export const truncateText = (text, maxLength = 40) => {
    if (text.length > maxLength) {
        return text.slice(0, maxLength) + "...";
    }
    return text;
}

export const copyCode = (texto) => {
    navigator.clipboard.writeText(texto)
        .then(() => {
            notifySuccess('Código copiado: ' + texto);
        })
        .catch(err => {
            notifyError('Error al copiar: ', err);
        });
};
