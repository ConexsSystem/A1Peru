import { useState, useCallback } from 'react';
import axios from 'axios';

export const useLocationSuggestions = (baseUrl, idempresa, key) => {
    const [originSuggestions, setOriginSuggestions] = useState([]);
    const [destinationSuggestions, setDestinationSuggestions] = useState([]);

    // Obtener sugerencias de ubicación
    const fetchSuggestions = useCallback(async (inputValue, setSuggestions) => {
        const query = inputValue.trim().toLowerCase();
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }

        try {
            const GEO_API_URL = process.env.REACT_APP_GEO_API_URL?.replace(/\/?$/, "");
            const response = await fetch(
                `${GEO_API_URL}/api/v3/place/${encodeURIComponent(query)}/0/demo?country=PE`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: 'Basic c3lzdGVtM3c6NkVpWmpwaWp4a1hUZUFDbw==',
                        'Content-Type': 'application/json',
                    },
                }
            );
            const data = await response.json();
            setSuggestions(data.coincidencias || []);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            setSuggestions([]);
        }
    }, []);

    // Obtener dirección desde coordenadas
    const fetchGeocoding = useCallback(async (coordinate, index = null, setOrigin, setDestination, setAdditionalDestinations) => {
        try {
            const formattedCoordinate = coordinate.replace(/,/g, ', ');
            const GEO_API_URL = process.env.REACT_APP_GEO_API_URL?.replace(/\/?$/, "");
            const url = `${GEO_API_URL}/api/v3/geocoding/${formattedCoordinate}/0/udemo`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.status === 200) {
                const address = data.address;

                if (index === 'origin') {
                    setOrigin(address);
                    fetchSuggestions(address, setOriginSuggestions);
                } else if (index === null) {
                    setDestination(address);
                    fetchSuggestions(address, setDestinationSuggestions);
                } else {
                    setAdditionalDestinations(prev => {
                        const updated = [...prev];
                        updated[index].value = address;
                        fetchSuggestions(address, sugg => {
                            updated[index].suggestions = sugg;
                            setAdditionalDestinations([...updated]);
                        });
                        return updated;
                    });
                }
                return true;
            }
        } catch (error) {
            console.error('Error fetching geocoding:', error);
        }
        return false;
    }, [fetchSuggestions]);

    // Obtener zona desde coordenadas
    const fetchZone = useCallback(async (lat, lng) => {
        try {
            const responseZona = await axios.post(
                `${baseUrl}api/IntranetApp/Zona`,
                { id_empresa_taxi: idempresa, lat, lng },
                { headers: { Authorization: `Bearer ${key}` } }
            );
            if (responseZona.data.status_code === 200 && responseZona.data.status === "success") {
                return responseZona.data.data;
            }
        } catch (error) {
            console.error("Error fetching zone:", error);
        }
        return null;
    }, [baseUrl, idempresa, key]);

    // Manejar selección de sugerencia - versión simplificada
    const handleSelectSuggestion = useCallback(async (
        suggestion,
        isOrigin = true,
        index = null,
        setOrigin,
        setDestination,
        setAdditionalDestinations,
        setOriginSuggestions,
        setDestinationSuggestions,
        tempArray,
        setTempArray,
        markers,
        setMarkers,
        reorderMarkers,
        markForTariffRecalculation,
        favorites,
        updateFavoriteButton
    ) => {
        const selectedText = `${suggestion.direccion}, ${suggestion.distrito}`.slice(0, 250);

        // Normalizar texto para comparación
        const normalize = str => str.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

        // Manejo especial para aeropuerto
        const airportAddrs = [
            "aeropuerto internacional jorge chavez, av. elmer faucett, callao",
            'aeropuerto internacional "jorge chavez" (lim), av. elmer faucett, callao, peru',
            "international airport jorge chavez"
        ];

        const isAirport = airportAddrs.includes(normalize(suggestion.direccion)) ||
            (suggestion.lat === -12.0222649 && suggestion.lng === -77.1191992);

        const finalLat = isAirport ? -12.022816 : suggestion.lat;
        const finalLng = isAirport ? -77.107902 : suggestion.lng;

        const idcaja = isOrigin ? 'origin' : (index === null ? 'destination' : `additional-${index}`);
        const zonaObtenida = await fetchZone(finalLat, finalLng);

        // Actualizar botón de favorito
        if (updateFavoriteButton) {
            updateFavoriteButton(idcaja, finalLat, finalLng);
        }

        const newEntry = {
            inputValue: selectedText,
            lat: finalLat,
            lng: finalLng,
            dist: 0,
            tiempo: 0,
            monto: 0,
            zona: zonaObtenida || '',
            idcaja
        };

        // Actualizar tempArray
        setTempArray(prev => {
            const idx = prev.findIndex(x => x.idcaja === idcaja);
            if (idx >= 0) {
                const a = [...prev];
                a[idx] = newEntry;
                return a;
            }
            return [...prev, newEntry];
        });

        // Actualizar marcadores (usando la función reorderMarkers del componente padre)
        if (reorderMarkers) {
            setMarkers(prev => reorderMarkers([...prev.filter(m => m.idcaja !== idcaja), {
                idcaja,
                lat: finalLat,
                lng: finalLng,
                direccion: selectedText,
                type: 'circle',
                zona: newEntry.zona
            }]));
        }

        // Actualizar inputs
        if (idcaja === 'origin') {
            setOrigin(selectedText);
            setOriginSuggestions([]);
        } else if (idcaja === 'destination') {
            setDestination(selectedText);
            setDestinationSuggestions([]);
        } else {
            setAdditionalDestinations(prev => {
                const arr = [...prev];
                arr[index] = { value: selectedText, suggestions: [] };
                return arr;
            });
        }

        // Marcar para recalcular tarifa si la función existe
        if (markForTariffRecalculation) {
            markForTariffRecalculation();
        }
    }, [fetchZone]);

    // Verificar si el input es una coordenada
    const isCoordinate = useCallback((value) => {
        return /^-?\d{1,2}\.\d+,\s*-?\d{1,3}\.\d+$/.test(value);
    }, []);

    return {
        // Estados
        originSuggestions,
        destinationSuggestions,

        // Funciones
        fetchSuggestions,
        fetchGeocoding,
        fetchZone,
        handleSelectSuggestion,
        isCoordinate,

        // Setters
        setOriginSuggestions,
        setDestinationSuggestions,
    };
}; 