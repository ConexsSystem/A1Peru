import { useState, useCallback } from 'react';
import axios from 'axios';
import { notifyError } from '../utils/ToastifyComponent';

export const useFavorites = (baseUrl, idpersonal, key) => {
    const [favorites, setFavorites] = useState([]);
    const [showAddFavorite, setShowAddFavorite] = useState({});
    const [showModalFavorite, setShowModalFavorite] = useState(false);
    const [favoriteToEdit, setFavoriteToEdit] = useState(null);
    const [modalCondicion, setModalCondicion] = useState(1);

    // Cargar favoritos
    const loadFavorites = useCallback(async (showLoader = false, setProgress = null) => {
        if (showLoader && setProgress) setProgress(true);
        try {
            const response = await axios.get(`${baseUrl}api/IntranetApp/Favoritosl`, {
                params: { idpersonal },
                headers: { Authorization: `Bearer ${key}` }
            });
            if (response.data.estatus === 200) {
                setFavorites(response.data.AFavoritosl);
            }
        } catch (error) {
            console.error('Error loading favorites:', error);
        } finally {
            if (showLoader && setProgress) setProgress(false);
        }
    }, [baseUrl, idpersonal, key]);

    // Agregar favorito
    const addFavorite = useCallback((idcaja, tempArray) => {
        const entry = tempArray.find(item => item.idcaja === idcaja);
        if (!entry) {
            notifyError('No hay datos para guardar como favorito.');
            return false;
        }

        setFavoriteToEdit({
            titulo: entry.inputValue,
            direccion: entry.inputValue,
            referencia: entry.inputValue,
            latitude: entry.lat,
            longitude: entry.lng,
        });
        setModalCondicion(1); // crear = 1, actualizar = 2
        setShowModalFavorite(true);
        return true;
    }, []);

    // Usar favorito
    const useFavorite = useCallback(async (fav, currentInput, tempArray, setTempArray, markers, setMarkers, setOrigin, setDestination, setAdditionalDestinations, fetchZone, reorderMarkers, markForTariffRecalculation) => {
        if (!currentInput) {
            notifyError('Selecciona primero un campo de dirección.');
            return false;
        }

        const idcaja = currentInput;
        const zonaFav = await fetchZone(fav.latitude, fav.longitude);
        const newEntry = {
            inputValue: fav.direccion,
            lat: fav.latitude,
            lng: fav.longitude,
            dist: 0,
            tiempo: 0,
            monto: 0,
            zona: zonaFav || '',
            idcaja
        };

        // Actualizar tempArray
        setTempArray(prev => {
            const idx = prev.findIndex(i => i.idcaja === idcaja);
            if (idx !== -1) {
                const a = [...prev];
                a[idx] = newEntry;
                return a;
            }
            return [...prev, newEntry];
        });

        // Actualizar marcadores
        setMarkers(prev => {
            const filt = prev.filter(m => m.idcaja !== idcaja);
            return reorderMarkers([...filt, {
                idcaja,
                lat: fav.latitude,
                lng: fav.longitude,
                direccion: fav.direccion,
                type: 'circle',
                zona: newEntry.zona
            }]);
        });

        // Rellenar input
        if (idcaja === 'origin') {
            setOrigin(fav.direccion);
        } else if (idcaja === 'destination') {
            setDestination(fav.direccion);
        } else {
            const index = parseInt(idcaja.split('-')[1], 10);
            setAdditionalDestinations(prev => {
                const arr = [...prev];
                arr[index] = { value: fav.direccion, suggestions: [] };
                return arr;
            });
        }

        setShowAddFavorite(prev => ({ ...prev, [idcaja]: false }));
        markForTariffRecalculation();
        return true;
    }, []);

    // Cerrar modal
    const closeModal = useCallback(() => {
        setShowModalFavorite(false);
        setFavoriteToEdit(null);
    }, []);

    // Verificar si una ubicación ya es favorita
    const isLocationFavorite = useCallback((lat, lng) => {
        return favorites.some(f => f.latitude === lat && f.longitude === lng);
    }, [favorites]);

    // Actualizar estado de botón de favorito
    const updateFavoriteButton = useCallback((idcaja, lat, lng) => {
        const matched = isLocationFavorite(lat, lng);
        setShowAddFavorite(prev => ({ ...prev, [idcaja]: !matched }));
    }, [isLocationFavorite]);

    return {
        // Estados
        favorites,
        showAddFavorite,
        showModalFavorite,
        favoriteToEdit,
        modalCondicion,

        // Funciones
        loadFavorites,
        addFavorite,
        useFavorite,
        closeModal,
        isLocationFavorite,
        updateFavoriteButton,

        // Setters para el modal
        setShowModalFavorite,
        setFavoriteToEdit,
        setModalCondicion,
        setShowAddFavorite,
    };
}; 