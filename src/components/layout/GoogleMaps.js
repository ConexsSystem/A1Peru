import React, { useEffect, useRef } from 'react';
import auto from '../image/ima_tdisponible.png';
import './googlemaps.css';

const GoogleMaps = React.memo(({ markers, polylines = [], onMarkerClick, infoData }) => {
    const mapRef = useRef(null);
    const markersRef = useRef({});
    const infoWindowRef = useRef(null);
    const polylineRef = useRef(null);
    const boundsInitialized = useRef(false);             // <-- ref para controlar ajuste inicial

    // 1. Inicializar el mapa (una sola vez)
    useEffect(() => {
        const checkGoogleMapsLoaded = setInterval(() => {
            if (window.google && window.google.maps) {
                clearInterval(checkGoogleMapsLoaded);

                if (!mapRef.current) {
                    mapRef.current = new window.google.maps.Map(
                        document.getElementById('google-map'),
                        {
                            center: { lat: -12.09029571708219, lng: -77.02909310828508 },
                            zoom: 12,
                            mapId: 'c53885c5f8f23073',
                            mapTypeControl: false,
                            fullscreenControl: false,
                            streetViewControl: false,
                            zoomControl: false,
                        }
                    );
                }
                if (!infoWindowRef.current) {
                    infoWindowRef.current = new window.google.maps.InfoWindow();
                }
            }
        }, 100);

        return () => clearInterval(checkGoogleMapsLoaded);
    }, []);

    // 2. Crear contenido para markers
    // Funciones para crear el contenido de los markers
    const createCircleMarker = (number) => {
        // Crea el contenedor principal (círculo)
        const markerDiv = document.createElement('div');
        markerDiv.style.position = 'relative';
        markerDiv.style.width = '28px';
        markerDiv.style.height = '28px';
        markerDiv.style.backgroundColor = '#62ABE6';
        markerDiv.style.border = '2px solid #223d53';
        markerDiv.style.borderRadius = '50%';
        markerDiv.style.display = 'flex';
        markerDiv.style.alignItems = 'center';
        markerDiv.style.justifyContent = 'center';
        markerDiv.style.boxShadow = '0 0 6px rgba(0,0,0,0.3)';

        // Añade un texto dentro del círculo
        markerDiv.innerHTML = `<span style="color: white; font-size: 14px; font-weight: bold;">${number}</span>`;

        // Crea el triángulo que simula la punta del marker
        const pointer = document.createElement('div');
        pointer.style.position = 'absolute';
        pointer.style.bottom = '-10px';
        pointer.style.left = '50%';
        pointer.style.transform = 'translateX(-50%)';
        pointer.style.width = '0';
        pointer.style.height = '0';
        pointer.style.borderLeft = '8px solid transparent';
        pointer.style.borderRight = '8px solid transparent';
        pointer.style.borderTop = '10px solid #122618';

        markerDiv.appendChild(pointer);

        return markerDiv;
    };

    const createImageMarker = (angle = 0, imageUrl = auto) => {
        const markerDiv = document.createElement('div');
        markerDiv.style.width = '40px';
        markerDiv.style.height = '40px';
        markerDiv.style.display = 'flex';
        markerDiv.style.justifyContent = 'center';
        markerDiv.style.alignItems = 'center';

        const img = document.createElement('img');
        img.src = imageUrl;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.transform = `rotate(${angle}deg)`;
        img.style.transition = 'transform 0.5s ease-out';

        markerDiv.appendChild(img);

        return markerDiv;
    };

    // 3. Renderizar/actualizar markers
    // 3. Renderizar/actualizar markers sin parpadeo
    useEffect(() => {
        if (!mapRef.current || !window.google?.maps) return;

        // 1. Calcula los keys “deseados” de los markers entrantes
        const newKeys = markers.map((m, i) => m.id ?? `marker-${i}`);

        // 2. Elimina solo los markers que ya no existen
        Object.keys(markersRef.current).forEach(key => {
            if (!newKeys.includes(key)) {
                // quita del mapa y borra la referencia
                markersRef.current[key].setMap(null);
                delete markersRef.current[key];
            }
        });

        // 3. Añade o actualiza cada marker entrante
        markers.forEach((markerData, index) => {
            const key = markerData.id ?? `marker-${index}`;
            const pos = new window.google.maps.LatLng(markerData.lat, markerData.lng);

            // Crea el contenido (círculo o imagen)
            let content;
            if (markerData.type === 'image') {
                content = createImageMarker(markerData.angle, markerData.imageUrl);
            } else {
                content = createCircleMarker(markerData.number ?? index + 1);
            }

            if (markersRef.current[key]) {
                const existing = markersRef.current[key];
                // 1) Actualizamos posición asignando directamente:
                existing.position = pos;
                // 2) Si cambió el contenido (ángulo, número…), lo reasignamos:
                if (existing.content !== content) {
                    existing.content = content;
                }
            } else {
                // 3b. No existe: créalo de cero
                const advMarker = new window.google.maps.marker.AdvancedMarkerElement({
                    map: mapRef.current,
                    position: pos,
                    title: markerData.direccion ?? '',
                    content,
                });
                advMarker.addListener('gmp-click', () => onMarkerClick?.(markerData, key));
                markersRef.current[key] = advMarker;
            }
        });

        // 4. Ajuste de bounds SOLO la primera vez
        if (!boundsInitialized.current) {
            const bounds = new window.google.maps.LatLngBounds();
            markers
                .filter(m => (m.type ?? 'circle') === 'circle')
                .forEach(m => bounds.extend({ lat: m.lat, lng: m.lng }));
            if (!bounds.isEmpty()) {
                mapRef.current.fitBounds(bounds, { padding: 50 });
                window.google.maps.event.addListenerOnce(mapRef.current, 'idle', () => {
                    if (mapRef.current.getZoom() > 14) {
                        mapRef.current.setZoom(14);
                    }
                });
            }
            boundsInitialized.current = true;
        }

    }, [markers, onMarkerClick]);

    // useEffect(() => {
    //     if (!mapRef.current || !window.google.maps) return;

    //     // Limpia marcadores viejos
    //     Object.values(markersRef.current).forEach(m => m.map = null);
    //     markersRef.current = {};

    //     markers.forEach((markerData, index) => {
    //         if (typeof markerData.lat !== 'number' || typeof markerData.lng !== 'number') {
    //             console.error('Coordenadas inválidas para el marcador:', markerData);
    //             return;
    //         }
    //         const key = markerData.id ?? `marker-${index}`;
    //         const pos = new window.google.maps.LatLng(markerData.lat, markerData.lng);
    //         let content;
    //         if (markerData.type === 'image') {
    //             content = createImageMarker(markerData.angle, markerData.imageUrl);
    //         } else {
    //             content = createCircleMarker(markerData.number ?? index + 1);
    //         }

    //         const advMarker = new window.google.maps.marker.AdvancedMarkerElement({
    //             map: mapRef.current,
    //             position: pos,
    //             title: markerData.direccion ?? '',
    //             content,
    //         });
    //         advMarker.addListener('gmp-click', () => onMarkerClick?.(markerData, key));
    //         markersRef.current[key] = advMarker;
    //     });

    //     // // Ajustar bounds por círculos
    //     // const bounds = new window.google.maps.LatLngBounds();
    //     // markers
    //     //     .filter(m => (m.type ?? 'circle') === 'circle')
    //     //     .forEach(m => bounds.extend({ lat: m.lat, lng: m.lng }));
    //     // if (!bounds.isEmpty()) {
    //     //     mapRef.current.fitBounds(bounds, { padding: 50 });
    //     //     window.google.maps.event.addListenerOnce(mapRef.current, 'idle', () => {
    //     //         if (mapRef.current.getZoom() > 14) {
    //     //             mapRef.current.setZoom(14);
    //     //         }
    //     //     });
    //     // }

    //     // Ajustar bounds por círculos solo la primera vez
    //     if (!boundsInitialized.current) {
    //         const bounds = new window.google.maps.LatLngBounds();
    //         markers
    //             .filter(m => (m.type ?? 'circle') === 'circle')
    //             .forEach(m => bounds.extend({ lat: m.lat, lng: m.lng }));

    //         if (!bounds.isEmpty()) {
    //             mapRef.current.fitBounds(bounds, { padding: 50 });
    //             window.google.maps.event.addListenerOnce(mapRef.current, 'idle', () => {
    //                 if (mapRef.current.getZoom() > 14) {
    //                     mapRef.current.setZoom(14);
    //                 }
    //             });
    //         }
    //         boundsInitialized.current = true; // ¡marcamos que ya centramos una vez!
    //     }
    // }, [markers, onMarkerClick]);

    // 4. Dibujar Polyline cuando polylinePath tenga >1 punto
    // Efecto para dibujar cada Polyline según polylines prop
    useEffect(() => {
        if (!mapRef.current || !window.google?.maps) return;

        // Limpiamos todas las polylines anteriores
        if (polylineRef.current) {
            polylineRef.current.forEach(line => line.setMap(null));
        }
        polylineRef.current = [];

        // Mapa de colores por estado
        const colorByEstado = {
            13: '#a950e8',  // en el punto
            14: '#a45200',  // contacto
            15: '#0bed8b',  // proceso
        };

        // Por cada trazo, si tiene al menos 2 puntos, lo dibujamos
        polylines.forEach(({ estado, path }) => {
            if (path.length > 1) {
                const line = new window.google.maps.Polyline({
                    path,
                    geodesic: true,
                    strokeOpacity: 0.8,
                    strokeWeight: 4,
                    strokeColor: colorByEstado[estado] || '#000000',
                    map: mapRef.current,
                });
                polylineRef.current.push(line);
            }
        });
    }, [polylines]);


    // 5. InfoWindow según infoData
    useEffect(() => {
        if (!infoWindowRef.current || !mapRef.current) return;

        if (infoData) {
            const marker = markersRef.current[infoData.id];
            if (marker) {
                const telefonoLink = infoData.telefono
                    ? `<a href="https://wa.me/${infoData.telefono}" target="_blank">${infoData.telefono}</a>`
                    : 'N/A';
                const content = `
          <div style="font-size:14px; text-align:center;">
            <strong>${infoData.nombres || 'Sin nombre'}</strong>
            <p>Teléfono: ${telefonoLink}</p>
          </div>`;
                infoWindowRef.current.setContent(content);
                infoWindowRef.current.open({
                    anchor: marker,
                    map: mapRef.current,
                    shouldFocus: false,
                });
            }
        } else {
            infoWindowRef.current.close();
        }
    }, [infoData]);

    return (
        <div
            id="google-map"
            style={{ width: '100%', height: '100%', borderRadius: '16px' }}
        />
    );
});

export default GoogleMaps;


// import React, { useEffect, useRef } from 'react';
// import auto from '../image/ima_tdisponible.png';
// import './googlemaps.css'

// const GoogleMaps = React.memo(({ markers, onMarkerClick, infoData }) => {
//     const mapRef = useRef(null);
//     const markersRef = useRef({});
//     const infoWindowRef = useRef(null);

//     // Inicializar el mapa (una sola vez)
//     useEffect(() => {
//         const checkGoogleMapsLoaded = setInterval(() => {
//             if (window.google && window.google.maps) {
//                 clearInterval(checkGoogleMapsLoaded);
//                 if (!mapRef.current) {
//                     mapRef.current = new window.google.maps.Map(
//                         document.getElementById('google-map'),
//                         {
//                             center: { lat: -12.09029571708219, lng: -77.02909310828508 },
//                             zoom: 12,
//                             mapId: 'c53885c5f8f23073',
//                             mapTypeControl: false,
//                             fullscreenControl: false,
//                             streetViewControl: false,
//                             zoomControl: false,
//                         }
//                     );
//                     // console.log('Mapa inicializado.');
//                 }
//                 // Creamos el InfoWindow una sola vez
//                 if (!infoWindowRef.current) {
//                     infoWindowRef.current = new window.google.maps.InfoWindow();
//                 }
//             }
//         }, 100);
//         return () => clearInterval(checkGoogleMapsLoaded);
//     }, []);

//     // Funciones para crear el contenido de los markers
//     const createCircleMarker = (number) => {
//         // Crea el contenedor principal (círculo)
//         const markerDiv = document.createElement('div');
//         markerDiv.style.position = 'relative';
//         markerDiv.style.width = '28px';
//         markerDiv.style.height = '28px';
//         markerDiv.style.backgroundColor = '#14964c'; // Rojo
//         markerDiv.style.border = '2px solid #122618';
//         markerDiv.style.borderRadius = '50%';
//         markerDiv.style.display = 'flex';
//         markerDiv.style.alignItems = 'center';
//         markerDiv.style.justifyContent = 'center';
//         markerDiv.style.boxShadow = '0 0 6px rgba(0,0,0,0.3)';

//         // Añade un texto dentro del círculo
//         markerDiv.innerHTML = `<span style="color: white; font-size: 14px; font-weight: bold;">${number}</span>`;

//         // Crea el triángulo que simula la punta del marker
//         const pointer = document.createElement('div');
//         pointer.style.position = 'absolute';
//         pointer.style.bottom = '-10px';
//         pointer.style.left = '50%';
//         pointer.style.transform = 'translateX(-50%)';
//         pointer.style.width = '0';
//         pointer.style.height = '0';
//         pointer.style.borderLeft = '8px solid transparent';
//         pointer.style.borderRight = '8px solid transparent';
//         pointer.style.borderTop = '10px solid #122618';

//         markerDiv.appendChild(pointer);

//         return markerDiv;
//     };

//     const createImageMarker = (angle = 0, imageUrl = auto) => {
//         const markerDiv = document.createElement('div');
//         markerDiv.style.width = '40px';
//         markerDiv.style.height = '40px';
//         markerDiv.style.display = 'flex';
//         markerDiv.style.justifyContent = 'center';
//         markerDiv.style.alignItems = 'center';

//         const img = document.createElement('img');
//         img.src = imageUrl;
//         img.style.width = '100%';
//         img.style.height = '100%';
//         img.style.transform = `rotate(${angle}deg)`;
//         img.style.transition = 'transform 0.5s ease-out';

//         markerDiv.appendChild(img);

//         return markerDiv;
//     };

//     // Actualizar o crear markers imperativamente
//     useEffect(() => {
//         if (!mapRef.current || !window.google || !window.google.maps) return;

//         // console.log('Renderizando marcadores:', markers);

//         // Verifica si los marcadores ya existen y si no han cambiado
//         const existingMarkers = Object.keys(markersRef.current);
//         const newMarkers = markers.map((marker) => marker.id || `marker-${markers.indexOf(marker)}`);

//         if (existingMarkers.length === newMarkers.length && existingMarkers.every((id) => newMarkers.includes(id))) {
//             // console.log('Los marcadores no han cambiado, evitando re-renderizado.');
//             return;
//         }

//         // Elimina los marcadores anteriores del mapa
//         Object.values(markersRef.current).forEach((marker) => {
//             marker.map = null;
//         });
//         markersRef.current = {};

//         // Itera sobre cada marcador recibido por props y crea el marcador correspondiente
//         markers.forEach((markerData, index) => {
//             if (typeof markerData.lat !== 'number' || typeof markerData.lng !== 'number') {
//                 console.error('Coordenadas inválidas para el marcador:', markerData);
//                 return;
//             }

//             const markerKey = markerData.id ? markerData.id : `marker-${index}`;
//             const newPosition = new window.google.maps.LatLng(
//                 markerData.lat,
//                 markerData.lng
//             );

//             let contentElement;
//             const markerType = markerData.type || 'circle';
//             if (markerType === 'circle') {
//                 const number = markerData.number || index + 1;
//                 contentElement = createCircleMarker(number);
//             }
//             else if (markerType === 'image') {
//                 const angle = markerData.angle || 0;
//                 const imageUrl = markerData.imageUrl || auto;
//                 contentElement = createImageMarker(angle, imageUrl);
//             }

//             const advancedMarker = new window.google.maps.marker.AdvancedMarkerElement({
//                 map: mapRef.current,
//                 position: newPosition,
//                 title: markerData.direccion || `Marker ${index + 1}`,
//                 content: contentElement,
//             });

//             // Usamos el evento 'click' para capturar el click
//             advancedMarker.addListener('gmp-click', () => {
//                 // console.log("Marker clicked:", markerData, markerKey);
//                 if (onMarkerClick) {
//                     onMarkerClick(markerData, markerKey);
//                 }
//             });

//             markersRef.current[markerKey] = advancedMarker;
//         });

//         // Ajusta el mapa para que se muestren solo los marcadores de tipo "circle"
//         const bounds = new window.google.maps.LatLngBounds();
//         markers.forEach((markerData) => {
//             const markerType = markerData.type || 'circle';
//             if (markerType === 'circle') {
//                 bounds.extend({ lat: markerData.lat, lng: markerData.lng });
//             }
//         });

//         if (!bounds.isEmpty()) {
//             mapRef.current.fitBounds(bounds, { padding: 50 });
//             window.google.maps.event.addListenerOnce(mapRef.current, 'idle', () => {
//                 const maxZoom = 13;
//                 if (mapRef.current.getZoom() > maxZoom) {
//                     mapRef.current.setZoom(maxZoom);
//                 }
//             });
//         }
//     }, [markers, onMarkerClick]);



//     // Efecto para mostrar o actualizar el InfoWindow según infoData del padre
//     useEffect(() => {
//         if (!infoWindowRef.current || !mapRef.current || !window.google || !window.google.maps) return;

//         if (infoData) {
//             const marker = markersRef.current[infoData.id];
//             if (marker) {
//                 // Si infoData.telefono existe, usamos la URL de WhatsApp; de lo contrario, mostramos 'N/A'
//                 const telefonoLink = infoData.telefono
//                     ? `<a href="https://wa.me/${infoData.telefono}" target="_blank">${infoData.telefono}</a>`
//                     : 'N/A';

//                 const content = `
//               <div style="font-size:14px;">
//                 <div style="display: flex; flex-direction: column; align-items: center, justify-content: center;">
//                 <strong>${infoData.nombres || 'Sin nombre'}</strong>
//                 <p>
//                 Teléfono: ${telefonoLink}
//                 </p>
//                 </div>
//               </div>
//             `;

//                 infoWindowRef.current.setContent(content);
//                 infoWindowRef.current.open({
//                     anchor: marker,
//                     map: mapRef.current,
//                     shouldFocus: false,
//                 });
//             }
//         } else {
//             infoWindowRef.current.close();
//         }
//     }, [infoData]);


//     return (
//         <div
//             id="google-map"
//             style={{ width: '100%', height: '100%', borderRadius: '16px' }}
//         >
//             {/* Cargando el mapa... */}
//         </div>
//     );
// });

// export default GoogleMaps;
