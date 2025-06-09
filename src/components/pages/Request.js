import React, { useState, useEffect, useCallback } from 'react';
import GoogleMaps from '../layout/GoogleMaps';
import Input from '../common/Input';
import Button from '../common/Button';
import Select from '../common/Select';
import { TbPlus, TbMinus, TbFlagHeart } from "react-icons/tb";
import axios from 'axios';
import './request.css';
import CircularProgress from '@mui/material/CircularProgress';
import { ModalFavorite } from '../layout/Modal';
import Box from '@mui/material/Box';
import { notifySuccess, notifyError } from '../../utils/ToastifyComponent'

const Request = () => {
  const baseUrl = process.env.REACT_APP_BASE_URL?.replace(/\/?$/, "/") || "";
  const idempresa = process.env.REACT_APP_IDEMPRESA;
  const key = localStorage.getItem('key');

  // Estados para datos del formulario y rutas
  const [progress, setProgress] = useState(false);
  const [origin, setOrigin] = useState('');
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destination, setDestination] = useState('');
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [additionalDestinations, setAdditionalDestinations] = useState([]);
  const [tempArray, setTempArray] = useState([]); // Cada objeto: { inputValue, lat, lng, dist, tiempo, monto, zona, idcaja }
  const [markers, setMarkers] = useState([]);
  const [showAddFavorite, setShowAddFavorite] = useState({});

  // Estados para control de cálculo automático de tarifa
  const [shouldCalculateTariff, setShouldCalculateTariff] = useState(false);
  const [tariffCalculated, setTariffCalculated] = useState(false);

  const [showModalFavorite, setShowModalFavorite] = useState(false);
  const [favoriteToEdit, setFavoriteToEdit] = useState(null);
  const [modalCondicion, setModalCondicion] = useState(1);

  // Datos obtenidos de la solicitud (select y autocompletado)
  const [dataArea, setDataArea] = useState([]);
  const [dataCentroCostos, setDataCentroCostos] = useState([]);
  const [dataMotivo, setDataMotivo] = useState([]);
  const [dataMovil, setDataMovil] = useState([]);
  const [dataPago, setDataPago] = useState([]);
  const [dataPersonal, setDataPersonal] = useState({});
  const [dataConfiguracion, setDataConfiguracion] = useState({});
  const [dataPersonalo, setDataPersonalo] = useState([]);
  const [dataIncremento, setDataIncremento] = useState('');
  const [favorites, setFavorites] = useState([]);

  // Campo actualmente enfocado (origin, destination, additional-i)
  const [currentInput, setCurrentInput] = useState(null);

  // Estados para usuario (si es para otro usuario)
  const [parami, setParami] = useState('');
  const [usuario, setUsuario] = useState('');
  const [telefono, setTelefono] = useState('');

  const [zona, setZona] = useState('');
  const [hora, setHora] = useState('');
  const [fecha, setFecha] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [tipopago, setTipopago] = useState('');
  const [tipomovil, setTipomovil] = useState('');
  const [area, setArea] = useState(''); // Valor predeterminado (se asigna de dataPersonal)
  const [centrocostos, setCentrocostos] = useState(''); // Valor predeterminado (se asigna de dataPersonal)
  const [motivo, setMotivo] = useState('');
  const [detalle, setDetalle] = useState('');
  const [fare, setFare] = useState(0);

  const idpersonal = localStorage.getItem('idpersonal');
  const idcliente = localStorage.getItem('idcliente');

  const optionUsuario = [
    { value: 'parami', label: 'Para mi' },
    { value: 'paraotrousuario', label: 'Para otro usuario' },
  ];

  // Función para verificar si se puede calcular la tarifa
  const canCalculateTariff = useCallback(() => {
    return tempArray.length >= 2 &&
      origin.trim() &&
      destination.trim() &&
      fecha.trim() &&
      hora.trim() &&
      tipopago.trim() &&
      tipomovil.trim();
  }, [tempArray, origin, destination, fecha, hora, tipopago, tipomovil]);

  // Función para marcar que se necesita recalcular la tarifa
  const markForTariffRecalculation = useCallback(() => {
    setTariffCalculated(false);
    setShouldCalculateTariff(true);
  }, []);

  // Carga inicial de favoritos
  const handleMyFavorites = useCallback(async (showLoader = false) => {
    if (showLoader) setProgress(true);
    try {
      const response = await axios.get(`${baseUrl}api/IntranetApp/Favoritosl`, {
        params: { idpersonal }, headers: { Authorization: `Bearer ${key}` }
      });
      if (response.data.estatus === 200) setFavorites(response.data.AFavoritosl);
    } catch (error) { } finally { if (showLoader) setProgress(false); }
  }, [baseUrl, idpersonal, key]);

  // Función para añadir favorito
  const handleAddFavorite = (idcaja) => {
    const entry = tempArray.find(item => item.idcaja === idcaja);
    if (!entry) return notifyError('No hay datos para guardar como favorito.');
    // Prepara los datos para el modal
    setFavoriteToEdit({
      titulo: entry.inputValue,
      direccion: entry.inputValue,
      referencia: entry.inputValue,
      latitude: entry.lat,
      longitude: entry.lng,
    });
    setModalCondicion(1);            // crear = 1, actualizar = 2, según tu lógica
    setShowModalFavorite(true);
  };

  const closeModal = () => {
    setShowModalFavorite(false);
    setFavoriteToEdit(null);
  };

  // Función para usar favorito en campo activo
  const handleUseFavorite = async (fav) => {
    if (!currentInput) return notifyError('Selecciona primero un campo de dirección.');
    const idcaja = currentInput;
    const zonaFav = await fetchZone(fav.latitude, fav.longitude);
    const newEntry = { inputValue: fav.direccion, lat: fav.latitude, lng: fav.longitude, dist: 0, tiempo: 0, monto: 0, zona: zonaFav || '', idcaja };
    // Actualizar tempArray
    setTempArray(prev => {
      const idx = prev.findIndex(i => i.idcaja === idcaja);
      if (idx !== -1) {
        const a = [...prev]; a[idx] = newEntry; return a;
      }
      return [...prev, newEntry];
    });
    // Actualizar marcadores
    setMarkers(prev => {
      const filt = prev.filter(m => m.idcaja !== idcaja);
      return reorderMarkers([...filt, { idcaja, lat: fav.latitude, lng: fav.longitude, direccion: fav.direccion, type: 'circle', zona: newEntry.zona }]);
    });
    // Rellenar input
    if (idcaja === 'origin') {
      setOrigin(fav.direccion);
      setOriginSuggestions([]);
    } else if (idcaja === 'destination') {
      setDestination(fav.direccion);
      setDestinationSuggestions([]);
    } else {
      const index = parseInt(idcaja.split('-')[1], 10);
      setAdditionalDestinations(prev => {
        const arr = [...prev]; arr[index] = { value: fav.direccion, suggestions: [] }; return arr;
      });
    }
    setShowAddFavorite(prev => ({ ...prev, [idcaja]: false }));
    markForTariffRecalculation();
  };

  // ----------------- Funciones de Sugerencias y Marcadores -----------------
  const reorderMarkers = (markersToSort) => {
    const priority = {
      'origin': 0,
      'destination': 1,
      'additional-0': 2,
      'additional-1': 3,
    };
    return markersToSort.slice().sort((a, b) => (priority[a.idcaja] ?? 99) - (priority[b.idcaja] ?? 99));
  };

  const removeMarkerByIdcaja = (idcaja) => {
    setMarkers(prev => reorderMarkers(prev.filter(m => m.idcaja !== idcaja)));
    setTempArray(prev => prev.filter(item => item.idcaja !== idcaja));
    markForTariffRecalculation();
  };

  const fetchSuggestions = async (inputValue, setSuggestions) => {
    const query = inputValue.trim().toLowerCase();
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await fetch(
        `https://v2.monterrico.app/api/v3/place/${encodeURIComponent(query)}/0/demo?country=PE`,
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
    }
  };

  const fetchGeocoding = async (coordinate, index = null) => {
    try {
      const formattedCoordinate = coordinate.replace(/,/g, ', ');
      const url = `https://v2.monterrico.app/api/v3/geocoding/${formattedCoordinate}/0/udemo`;
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
        markForTariffRecalculation();
      }
    } catch (error) {
      console.error('Error fetching geocoding:', error);
    }
  };

  const handleSelectSuggestion = async (suggestion, isOrigin = true, index = null) => {
    const selectedText = `${suggestion.direccion}, ${suggestion.distrito}`.slice(0, 250);
    const normalize = str => str.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
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
    const matched = favorites.some(f => f.latitude === finalLat && f.longitude === finalLng);
    setShowAddFavorite(prev => ({ ...prev, [idcaja]: !matched }));
    const newEntry = { inputValue: selectedText, lat: finalLat, lng: finalLng, dist: 0, tiempo: 0, monto: 0, zona: zonaObtenida || '', idcaja };
    setTempArray(prev => {
      const idx = prev.findIndex(x => x.idcaja === idcaja);
      if (idx >= 0) { const a = [...prev]; a[idx] = newEntry; return a; }
      return [...prev, newEntry];
    });
    setMarkers(prev => reorderMarkers([...prev.filter(m => m.idcaja !== idcaja), { idcaja, lat: finalLat, lng: finalLng, direccion: selectedText, type: 'circle', zona: newEntry.zona }]));
    if (idcaja === 'origin') {
      setOrigin(selectedText); setOriginSuggestions([]);
    } else if (idcaja === 'destination') {
      setDestination(selectedText); setDestinationSuggestions([]);
    } else {
      setAdditionalDestinations(prev => { const arr = [...prev]; arr[index] = { value: selectedText, suggestions: [] }; return arr; });
    }
    markForTariffRecalculation();
  };

  const handleOriginChange = (e) => {
    const value = e.target.value;
    setOrigin(value);
    setCurrentInput('origin');
    markForTariffRecalculation();
    if (!value.trim()) {
      setOriginSuggestions([]);
      return;
    }
    const isCoordinate = /^-?\d{1,2}\.\d+,\s*-?\d{1,3}\.\d+$/.test(value);
    if (isCoordinate) {
      setTimeout(() => { fetchGeocoding(value, 'origin'); }, 500);
    } else {
      setTimeout(() => { fetchSuggestions(value, setOriginSuggestions); }, 500);
    }
  };

  const handleDestinationChange = (value, index = null) => {
    if (index === null) {
      setDestination(value);
      setCurrentInput('destination');
      markForTariffRecalculation();
      if (!value.trim()) {
        setDestinationSuggestions([]);
        return;
      }
      const isCoordinate = /^-?\d{1,2}\.\d+,\s*-?\d{1,3}\.\d+$/.test(value);
      if (isCoordinate) {
        setTimeout(() => { fetchGeocoding(value, null); }, 500);
      } else {
        setTimeout(() => { fetchSuggestions(value, setDestinationSuggestions); }, 500);
      }
    } else {
      setAdditionalDestinations(prev => {
        const updated = [...prev];
        updated[index].value = value;
        return updated;
      });
      removeMarkerByIdcaja(`additional-${index}`);
      markForTariffRecalculation();
      if (!value.trim()) {
        setAdditionalDestinations(prev => {
          const updated = [...prev];
          updated[index].suggestions = [];
          return updated;
        });
        return;
      }
      const isCoordinate = /^-?\d{1,2}\.\d+,\s*-?\d{1,3}\.\d+$/.test(value);
      if (isCoordinate) {
        setTimeout(() => { fetchGeocoding(value, index); }, 500);
      } else {
        setTimeout(() => {
          fetchSuggestions(value, sugg => {
            setAdditionalDestinations(prev => {
              const updated = [...prev];
              updated[index].suggestions = sugg;
              return updated;
            });
          });
        }, 500);
      }
    }
  };

  // ✅ CORREGIDO: handleAddRoute ya NO llama a markForTariffRecalculation()
  const handleAddRoute = () => {
    if (additionalDestinations.length < 2) {
      setAdditionalDestinations(prev => [...prev, { value: '', suggestions: [] }]);
      // ❌ REMOVIDO: markForTariffRecalculation(); 
      // No debe recalcular porque solo estamos añadiendo un campo vacío
    } else {
      notifyError('Solo se permiten 2 destinos adicionales.');
    }
  };

  // ✅ CORRECTO: handleRemoveRoute SÍ debe recalcular porque elimina una dirección configurada
  const handleRemoveRoute = (index) => {
    setAdditionalDestinations(prev => prev.filter((_, i) => i !== index));
    removeMarkerByIdcaja(`additional-${index}`);
    setAdditionalDestinations(prev =>
      prev.map((dest, i) => ({ ...dest, idcaja: `additional-${i}` }))
    );
    setMarkers(prev =>
      prev.map(marker => {
        if (marker.idcaja.startsWith('additional-')) {
          const markerIndex = parseInt(marker.idcaja.split('-')[1], 10);
          if (markerIndex > index) {
            return { ...marker, idcaja: `additional-${markerIndex - 1}` };
          }
        }
        return marker;
      })
    );
    setTempArray(prev =>
      prev.map(item => {
        if (item.idcaja.startsWith('additional-')) {
          const itemIndex = parseInt(item.idcaja.split('-')[1], 10);
          if (itemIndex > index) {
            return { ...item, idcaja: `additional-${itemIndex - 1}` };
          }
        }
        return item;
      })
    );
    // ✅ CORRECTO: SÍ debe recalcular porque se eliminó una ruta
    markForTariffRecalculation();
  };

  const fetchZone = async (lat, lng) => {
    try {
      const responseZona = await axios.post(
        `${baseUrl}api/IntranetApp/Zona`,
        { id_empresa_taxi: idempresa, lat, lng },
        { headers: { Authorization: `Bearer ${key}` } }
      );
      if (responseZona.data.status_code === 200 && responseZona.data.status === "success") {
        setZona(responseZona.data.data);
        return responseZona.data.data;
      }
    } catch (error) {
      console.error("Error fetching zone:", error);
    }
    return null;
  };

  // ----------------- Funciones de Cálculo de Tarifa y Ajustes -----------------
  const calculateTariff = useCallback(async () => {
    if (!canCalculateTariff()) {
      return;
    }

    setProgress(true);

    if (tempArray.length < 2) {
      setProgress(false);
      return;
    }

    let total = 0;

    for (let i = 0; i < tempArray.length - 1; i++) {
      const start = tempArray[i];
      const end = tempArray[i + 1];

      try {
        const routeRes = await axios.get(
          `https://v2.monterrico.app/api/v3/route/${start.lat},${start.lng}/${end.lat},${end.lng}/-1/tarifaTotal`,
          { headers: { Authorization: 'Basic c3lzdGVtM3c6NkVpWmpwaWp4a1hUZUFDbw==' } }
        );

        const routeData = routeRes.data;

        if (routeData && routeData.route && routeData.route.length >= 2) {
          tempArray[i + 1].dist = routeData.distance;
          tempArray[i + 1].tiempo = routeData.time;

          const postData = {
            idcliente: idcliente,
            idempresa: parseInt(idempresa),
            tipomovil: tipomovil,
            distancia: routeData.distance,
            tiempo: routeData.time,
            pago: tipopago,
            zorigen: start.zona,
            zdestino: end.zona,
            fecha: fecha,
            hora: parseInt(hora.split(":")[0]),
          };

          const tarifaRes = await axios.post(
            `${baseUrl}api/IntranetApp/Tarifario`,
            postData,
            {
              headers: {
                Authorization: `Bearer ${key}`,
                "Content-Type": "application/json",
              }
            }
          );

          if (tarifaRes.data.estatus === 200) {
            total += tarifaRes.data.tarifa;
            setTempArray(prev => {
              const newArr = [...prev];
              newArr[i + 1] = { ...newArr[i + 1], monto: tarifaRes.data.tarifa };
              return newArr;
            });
          } else {
            setProgress(false);
            setTariffCalculated(false);
            return;
          }
        }
      } catch (error) {
        setProgress(false);
        console.error("Error al calcular ruta:", error);
        return;
      }
    }

    const horaPunta = await handleHoraPunta();
    const adjustedFare = await callAumentoTarifa(total, horaPunta);

    setFare(adjustedFare);
    setTariffCalculated(true);
    setShouldCalculateTariff(false);
    setProgress(false);
  }, [canCalculateTariff, tempArray, tipomovil, tipopago, fecha, hora, key, idcliente]);

  const handleHoraPunta = async () => {
    if (!fecha || !hora) {
      notifyError('Ingrese fecha y hora válidas.');
      return 0;
    }
    const dateObj = new Date(fecha);
    let diaSemana = dateObj.getDay() + 1;
    const hourInt = parseInt(hora.split(":")[0]);
    try {
      const response = await axios.get(`${baseUrl}api/IntranetApp/Horapuntademanda`, {
        params: {
          idempresas: idempresa,
          hora: hourInt,
          dia: diaSemana
        },
        headers: {
          Authorization: `Bearer ${key}`
        }
      });
      if (response.data && response.data.OHorapuntademanda) {
        return response.data.OHorapuntademanda.horapunt || 0;
      }
    } catch (error) {
      console.error("Error fetching hora punta:", error);
    }
    return 0;
  };

  const callAumentoTarifa = async (total, horaPunta) => {
    const body = {
      idcliente: Number(localStorage.getItem('idcliente')),
      monto: total,
      pago: tipopago,
      plataforma: "Intranet",
      punta: horaPunta,
      fecha: fecha,
      tipo: "Normal"
    };
    try {
      const response = await axios.post(`${baseUrl}api/IntranetApp/Tarifarioincremento`, body, {
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json"
        }
      });
      if (response.data) {
        setDataIncremento(response.data);
        const { mhorapunta, mhvalle, mcentral, mappweb } = response.data;
        const adjusted = total - (mhvalle) - (mappweb) + (mcentral) + (mhorapunta);
        return adjusted;
      }
    } catch (error) {
      console.error("Error en callAumentoTarifa:", error);
    }
    return total;
  };

  // ----------------- Función para Obtener Datos de Solicitante -----------------
  const dataSolicitante = useCallback(async () => {
    try {
      const responseSolicitud = await axios.get(`${baseUrl}api/IntranetApp/Solicitud`, {
        params: {
          idpersonal: idpersonal,
          idcliente: idcliente,
        },
        headers: {
          Authorization: `Bearer ${key}`,
        }
      });
      if (responseSolicitud.data.estatus === 200) {
        setDataArea(responseSolicitud.data.AArea);
        setDataCentroCostos(responseSolicitud.data.ACentrocostos);
        setDataMotivo(responseSolicitud.data.AMotivosolicitud);
        setDataMovil(responseSolicitud.data.AMovil);
        setDataPago(responseSolicitud.data.APago);
        setDataPersonal(responseSolicitud.data.OPersonal);
        setDataConfiguracion(responseSolicitud.data.OConfiguracion);
        setDataPersonalo(responseSolicitud.data.APersonalo);
      }
    } catch (error) {
      console.error(error.response?.data);
    }
  }, [baseUrl, idpersonal, key, idcliente]);

  // ----------------- Funciones para Usuario y Teléfono -----------------
  const handleUsuarioChange = (e) => {
    const value = e.target.value;
    setUsuario(value);
    const userObj = dataPersonalo.find(item => item.datpersonal === value);
    if (userObj) {
      setTelefono(userObj.telefonoprincipal);
      setArea(userObj.area);           // Actualiza el input de Área
      setCentrocostos(userObj.centrocostos); // Actualiza el input de Centro de costos
    } else {
      setTelefono('');
      setArea('');
      setCentrocostos('');
    }
  };

  const handleOptionUsuarioChange = (e) => {
    const newValue = e.target.value;
    setParami(newValue);
    setUsuario('')
    setTelefono(dataPersonal.telefonoprincipal);
    setArea(dataPersonal.area);
    setCentrocostos(dataPersonal.centrocostos);
  };

  const getCentroCostosId = (centrocostosValue) => {
    const found = dataCentroCostos.find(item => item.centrocostos === centrocostosValue);
    return found ? Number(found.idcentrocostos) : 0;
  };

  const getAreaId = (areaValue) => {
    const found = dataArea.find(item => item.area === areaValue);
    return found ? Number(found.idarea) : 0;
  };

  const getMotivoId = (motivoValue) => {
    const found = dataMotivo.find(item => item.motivosolicitud === motivoValue);
    return found ? Number(found.idmotivosolicitud) : 0;
  };

  const getMovilId = (tipomovilValue) => {
    const found = dataMovil.find(item => item.destipomovil === tipomovilValue);
    return found ? Number(found.idtipomovil) : 0;
  };

  // ----------------- Función para Registro del Servicio -----------------
  const sendServiceRequest = async () => {
    setProgress(true)

    // Dentro de sendServiceRequest, justo al inicio (antes de otras validaciones)
    if (!tipopago.trim()) {
      notifyError('El campo Tipo pago es obligatorio.');
      return;
    }
    if (!tipomovil.trim()) {
      notifyError('El campo Tipo movil es obligatorio.');
      return;
    }

    // Validaciones de campos obligatorios según dataConfiguracion (solo si no es Efectivo)
    if (tipopago !== "Efectivo") {
      if (dataConfiguracion.idcentrocostos && !centrocostos.trim()) {
        notifyError('El campo Centro de costos es obligatorio.');
        setProgress(false)
        return;
      }
      if (dataConfiguracion.idarea && !area.trim()) {
        notifyError('El campo Área es obligatorio.');
        setProgress(false)
        return;
      }
      if (dataConfiguracion.idmotsol && !motivo.trim()) {
        notifyError('El campo Motivo es obligatorio.');
        setProgress(false)
        return;
      }
      if (dataConfiguracion.iddetallemotivo && !detalle.trim()) {
        notifyError('El campo Detalle motivo es obligatorio.');
        setProgress(false)
        return;
      }

      if (dataConfiguracion.areacondicion === "Lista") {
        const areaValida = dataArea.some(item => item.area === area.trim());
        if (!areaValida) {
          notifyError('El valor ingresado en Área no está en la lista permitida.');
          setProgress(false);
          return;
        }
      }

      if (dataConfiguracion.centrocostoscondicion === "Lista") {
        const centroCostoValida = dataCentroCostos.some(item => item.centrocostos === centrocostos.trim());
        if (!centroCostoValida) {
          notifyError('El valor ingresado en Centro de costos no está en la lista permitida.');
          setProgress(false);
          return;
        }
      }
    }
    if (!origin || !destination || !fecha || !hora) {
      notifyError('Complete todos los campos obligatorios.');
      return;
    }

    const formattedFecha = `${fecha}T00:00:00`;

    const selectedUser = parami === 'paraotrousuario'
      ? dataPersonalo.find(u => u.datpersonal === usuario) || {}
      : dataPersonal;

    const tpersonal = [
      {
        idpersonal: selectedUser.idpersonal || idpersonal,
        datosusuario: selectedUser.datpersonal || dataPersonal.apenom || "",
        codigo: "",
        cargo: "",
        telprincipal: selectedUser.telefonoprincipal || dataPersonal.telefonoprincipal || "",
        telsecundario: "",
        emailt: "",
        tipot: ""
      }
    ];

    const truta = tempArray.map((item, index) => ({
      item: index + 1,
      personal: "",
      direccion: item.inputValue,
      referencia: "",
      zona: item.zona,
      latitude: item.lat,
      longitude: item.lng,
      tiporuta: dataConfiguracion.ttarifario || "COSTO KM.",
      distkm: item.dist || 0.0,
      minkm: item.tiempo || 0.0,
      costobase: 0.0,
      costokm: 0.0,
      costomin: 0.0,
      constante: 0.0,
      monto: item.monto || 0.0,
      nhoras: 0.0,
      tarifa: item.monto || 0.0,
      peaje: 0.0,
      parqueo: 0.0,
      tiempoespera: 0,
      tiempocosto: 0.0,
      desvio: 0.0,
      courier: 0.0,
      pesokg: 0.0,
      pesocosto: 0.0,
      subtotalruta: item.monto || 0.0,
      idr: index + 1,
    }));

    const postBody = {
      idcliente: Number(idcliente),
      cliente: dataPersonal.cliente,
      idsolicitante: idpersonal,
      solicitante: dataPersonal.apenom || "",
      idautorizado: idpersonal,
      autorizado: dataPersonal.apenom || "",
      idcentrocostos: getCentroCostosId(centrocostos),
      centrocostos: centrocostos,
      idarea: getAreaId(area),
      area: area,
      idmotivo: getMotivoId(motivo),
      motivo: motivo,
      motivodetalle: detalle,
      vuelo: "",
      aerolinea: "",
      procedencia: "",
      pago: tipopago,
      noperacion: "",
      nvale: "",
      voucher: "",
      comprobante: false,
      tipocomprobante: "",
      nruc: "",
      email: "",
      fecha: formattedFecha,
      hora: hora,
      prioridad: "Al Momento",
      adicional: 0.0,
      modo: "INTRANET",
      tipo: "Normal",
      idmovil: getMovilId(tipomovil),
      movil: tipomovil,
      categoria: "REGULAR",
      moneda: "NSOL",
      maletera: false,
      idioma: false,
      luna: false,
      eslan: "",
      atlan: "",
      serlan: "",
      subtotal: fare,
      peajes: 0.0,
      parqueos: 0.0,
      ipunta: dataIncremento.mhorapunta,
      icentral: dataIncremento.mcentral,
      dvalle: dataIncremento.mhvalle,
      dappweb: dataIncremento.mappweb,
      total: fare,
      automatico: false,
      comunidad: false,
      distancia: tempArray.reduce((acc, curr) => acc + (curr.dist || 0), 0),
      tiempo: tempArray.reduce((acc, curr) => acc + (curr.tiempo || 0), 0),
      dorigen: origin,
      zorigen: tempArray[0]?.zona || "",
      latorigen: tempArray[0]?.lat || 0,
      lonorigen: tempArray[0]?.lng || 0,
      ddestino: destination,
      zdestino: tempArray[tempArray.length - 1]?.zona || "",
      latdestino: tempArray[tempArray.length - 1]?.lat || 0,
      londestino: tempArray[tempArray.length - 1]?.lng || 0,
      tpersonal: tpersonal,
      truta: truta,
      ptraslado: selectedUser.datpersonal || dataPersonal.apenom,
      observaciones: observaciones,
      contacto: selectedUser.datpersonal || dataPersonal.apenom,
      telefono: selectedUser.telefonoprincipal || dataPersonal.telefonoprincipal,
      idempresas: idempresa,
      agente: "Intranet",
      ipregistro: "0.0.0.0",
      nchatwoot: ""
    };

    try {
      const response = await axios.post(
        `${baseUrl}api/IntranetApp/Serviciosr`,
        postBody,
        {
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json"
          }
        }
      );
      if (response.data) {
        setProgress(false)
        notifySuccess(`Registro exitoso. Id de reserva: ${response.data.idreserva}`);
        setOrigin('');
        setDestination('');
        setHora('');
        setFecha('');
        setObservaciones('');
        setTipopago(dataPago[0]?.tpago || '');
        setTipomovil(dataMovil[0]?.destipomovil || '');
        setArea(dataPersonal.area);
        setCentrocostos(dataPersonal.centrocostos);
        setMotivo('');
        setDetalle('');
        setTariffCalculated(false);
        setFare(0);
        setTempArray([]);
        setMarkers([]);
        setAdditionalDestinations([]);
      } else {
        notifyError('Error al enviar solicitud.');
      }
    } catch (error) {
      notifyError('Error al enviar solicitud.');
    }
  };

  useEffect(() => {
    if (dataPago.length > 0) {
      // Cuando dataPago se carga, asigna el primer valor como default
      setTipopago(dataPago[0].tpago);
    } if (dataMovil.length > 0) {
      // Cuando dataMovil se carga, asigna el primer valor como default
      setTipomovil(dataMovil[0].destipomovil);
    } if (dataPersonal) {
      // Cuando dataPersonal se carga, asigna el primer valor como default
      setArea(dataPersonal.area || '');
      setCentrocostos(dataPersonal.centrocostos || '');
    }

    const now = new Date();
    // YYYY‑MM‑DD para el input type="date"
    setFecha(now.toISOString().slice(0, 10));

    // HH:MM (pad inicio con cero si <10)
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setHora(`${hours}:${minutes}`);
  }, [dataPersonal, dataPago, dataMovil]);

  useEffect(() => {
    dataSolicitante();
    handleMyFavorites()
  }, [dataSolicitante, handleMyFavorites]);

  // Efecto principal para cálculo automático de tarifa
  useEffect(() => {
    if (shouldCalculateTariff && canCalculateTariff()) {
      const timeoutId = setTimeout(() => {
        calculateTariff();
      }, 1500); // Espera 1 segundo después del último cambio

      return () => clearTimeout(timeoutId);
    }
  }, [shouldCalculateTariff, canCalculateTariff, calculateTariff]);

  // ----------------- Renderizado del Componente -----------------
  return (
    <div className='page-request'>
      {progress && (
        <Box className='box-progress'>
          <CircularProgress color="primary\" size="3rem" />
        </Box>
      )}
      <div className='maps-page'>
        <GoogleMaps markers={markers} />
        <div className='box-request'>
          <div className='box-user'>
            <Select
              options={optionUsuario}
              value={parami}
              onChange={handleOptionUsuarioChange}
              className="type-document parami"
            />
            {parami === 'paraotrousuario' && (
              <div className='content-request'>
                <input
                  className='camp-request'
                  type="text"
                  list="usuarios"
                  placeholder="Nombre de usuario"
                  value={usuario}
                  onChange={handleUsuarioChange}
                />
                <datalist id="usuarios">
                  {dataPersonalo.map((item, index) => (
                    <option key={index} value={item.datpersonal} />
                  ))}
                </datalist>
                <input
                  className='camp-request'
                  type="text"
                  placeholder="Teléfono"
                  value={telefono}
                  readOnly
                />
              </div>
            )}
          </div>
          <label style={{ marginBottom: '-8px' }}>Dirección origen</label>
          <div className='box-origin-request'>
            {showAddFavorite['origin'] && <Button className="button-remove-route input-directions" label={<TbFlagHeart className="icon-favorite" />} onClick={() => handleAddFavorite('origin')} />}
            <Input
              type='text'
              placeholder="Av. Prolongacion Iquitos 2291, Lince"
              value={origin}
              onFocus={() => setCurrentInput('origin')}
              onClick={() => setCurrentInput('origin')}
              onChange={handleOriginChange}
            />
            {originSuggestions.length > 0 && (
              <ul className="suggestions-origen">
                {originSuggestions.map((suggestion, index) => (
                  <li key={index} onClick={() => handleSelectSuggestion(suggestion, true)}>
                    {`${suggestion.direccion}, ${suggestion.distrito}`}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <label style={{ marginBottom: '-8px' }}>Dirección destino</label>
          <div className="box-destination-request">
            {showAddFavorite['destination'] && <Button className="button-remove-route input-directions" label={<TbFlagHeart className="icon-favorite" />} onClick={() => handleAddFavorite('destination')} />}
            <div className='box-directions-button'>
              <Input
                type="text"
                placeholder="Ingresa destino"
                value={destination}
                className="input-request-destination input-directions"
                onFocus={() => setCurrentInput('destination')}
                onClick={() => setCurrentInput('destination')}
                onChange={e => handleDestinationChange(e.target.value)}
              />
              <Button
                className="button-add-route input-directions"
                label={<TbPlus className="icon-add" />}
                onClick={handleAddRoute}
              />
            </div>
            {destinationSuggestions.length > 0 && (
              <ul className="suggestions-destination">
                {destinationSuggestions.map((suggestion, index) => (
                  <li key={index} onClick={() => handleSelectSuggestion(suggestion, false)}>
                    {`${suggestion.direccion}, ${suggestion.distrito}`}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {additionalDestinations.map((dest, index) => (
            <div key={index} className="additional-destination">
              {showAddFavorite[`additional-${index}`] && <Button className="button-remove-route input-directions" label={<TbFlagHeart className="icon-favorite" />} onClick={() => handleAddFavorite(`additional-${index}`)} />}
              <div className='box-directions-button'>
                <Input
                  type="text"
                  placeholder="Ingresa destino adicional"
                  value={dest.value}
                  className="input-request-destination input-directions"
                  onFocus={() => setCurrentInput(`additional-${index}`)}
                  onClick={() => setCurrentInput(`additional-${index}`)}
                  onChange={e => handleDestinationChange(e.target.value, index)}
                />
                <Button
                  className="button-remove-route input-directions"
                  label={<TbMinus className="icon-minus" />}
                  onClick={() => handleRemoveRoute(index)}
                />
              </div>
              {dest.suggestions?.length > 0 && (
                <ul className="suggestions-destination-add">
                  {dest.suggestions.map((suggestion, i) => (
                    <li key={i} onClick={() => handleSelectSuggestion(suggestion, false, index)}>
                      {`${suggestion.direccion}, ${suggestion.distrito}`}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          <div className='box-favorite'>
            {favorites.map((fav, i) => (
              <div key={i} className='button-favorite'>
                <button
                  type="button"
                  onMouseDown={e => {
                    e.preventDefault();        // evita que el botón robe el foco
                    handleUseFavorite(fav);    // corre ANTES de que el input pierda el foco
                  }}
                >
                  {fav.titulo}
                </button>
              </div>
            ))}
          </div>

          <div className='content-request'>
            <div className='request'>
              <label>Fecha</label>
              <Input
                type='date'
                value={fecha}
                onChange={(e) => {
                  setFecha(e.target.value);
                  markForTariffRecalculation();
                }}
              />
            </div>
            <div className='request'>
              <label>Hora</label>
              <Input
                type='time'
                value={hora}
                onChange={(e) => {
                  setHora(e.target.value);
                  markForTariffRecalculation();
                }}
              />
            </div>
          </div>
          <div className='request'>
            <label>Observaciones</label>
            <textarea
              placeholder="Escribe tus observaciones para el servicio..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </div>
          <div className='content-request'>
            <div className='request'>
              <label>Tipo pago</label>
              <select
                className='camp-request-select'
                value={tipopago}
                onChange={(e) => {
                  setTipopago(e.target.value);
                  markForTariffRecalculation();
                }}
              >
                {dataPago.map((pago) => (
                  <option key={pago.tpago} value={pago.tpago}>{pago.tpago}</option>
                ))}
              </select>
            </div>
            <div className='request'>
              <label>Tipo movil</label>
              <select
                className='camp-request-select'
                value={tipomovil}
                onChange={(e) => {
                  setTipomovil(e.target.value);
                  markForTariffRecalculation();
                }}
              >
                <option value="">Selecciona</option>
                {dataMovil.map((movil) => (
                  <option key={movil.idtipomovil} value={movil.destipomovil}>{movil.destipomovil}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Si el tipo de pago es distinto a Efectivo, se muestran estos campos */}
          {(tipopago !== "Efectivo" && tipopago !== "Plin" && tipopago !== "Yape") && (
            <>
              <div className='content-request'>
                <div className='request'>
                  <label>Área</label>
                  <input
                    className='camp-request'
                    type="text"
                    list="areas"
                    placeholder="Operaciones"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                  />
                  <datalist id="areas">
                    {dataArea.map((item, index) => (
                      <option key={index} value={item.area} />
                    ))}
                  </datalist>
                </div>
                <div className='request'>
                  <label>Centro de costos</label>
                  <input
                    className='camp-request'
                    type="text"
                    list="centroCostos"
                    placeholder="C10245"
                    value={centrocostos}
                    onChange={(e) => setCentrocostos(e.target.value)}
                  />
                  <datalist id="centroCostos">
                    {dataCentroCostos.map((item, index) => (
                      <option key={index} value={item.centrocostos} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div className='content-request'>
                <div className='request'>
                  <label>Motivo</label>
                  <input
                    className='camp-request'
                    type="text"
                    list="motivos"
                    placeholder="Viaje por trabajo"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                  />
                  <datalist id="motivos">
                    {dataMotivo.map((item, index) => (
                      <option key={index} value={item.motivosolicitud} />
                    ))}
                  </datalist>
                </div>
                <div className='request'>
                  <label>Detalle</label>
                  <input
                    className='camp-request'
                    type="text"
                    placeholder="Retorno de mina"
                    value={detalle}
                    onChange={(e) => setDetalle(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}
          <div className="content-request">
            <div>
              <strong>Tarifa: </strong>
              S/{fare.toFixed(2)}
              {progress && <span style={{ marginLeft: '10px', fontSize: '14px', color: '#666' }}>Calculando...</span>}
            </div>
          </div>
          {/* El botón "Solicitar Servicio" se muestra solo si se consultó la tarifa */}
          {tariffCalculated && (
            <div className="content-request">
              <Button label="Solicitar Servicio" onClick={sendServiceRequest} />
            </div>
          )}
        </div>
      </div>
      <ModalFavorite
        showModalFavorite={showModalFavorite}
        closeModal={closeModal}
        favoritoSeleccionado={favoriteToEdit}
        condicion={modalCondicion}
        apiprincipal={() => handleMyFavorites(true)}
      />
    </div>
  );
};

export default Request;

// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import GoogleMaps from '../layout/GoogleMaps';
// import Input from '../common/Input';
// import Button from '../common/Button';
// import Select from '../common/Select';
// import { TbPlus, TbMinus, TbFlagHeart } from "react-icons/tb";
// import axios from 'axios';
// import './request.css';
// import CircularProgress from '@mui/material/CircularProgress';
// import { ModalFavorite } from '../layout/Modal';
// import Box from '@mui/material/Box';
// import { notifySuccess, notifyError } from '../../utils/ToastifyComponent'

// const Request = () => {
//   const baseUrl = process.env.REACT_APP_BASE_URL?.replace(/\/?$/, "/") || "";
//   const idempresa = process.env.REACT_APP_IDEMPRESA;
//   const key = localStorage.getItem('key');
//   const isCalculatingRef = useRef(false);

//   // Estados para datos del formulario y rutas
//   const [progress, setProgress] = useState(false);
//   const [origin, setOrigin] = useState('');
//   const [originSuggestions, setOriginSuggestions] = useState([]);
//   const [destination, setDestination] = useState('');
//   const [destinationSuggestions, setDestinationSuggestions] = useState([]);
//   const [additionalDestinations, setAdditionalDestinations] = useState([]);
//   const [tempArray, setTempArray] = useState([]); // Cada objeto: { inputValue, lat, lng, dist, tiempo, monto, zona, idcaja }
//   const [markers, setMarkers] = useState([]);
//   const [showAddFavorite, setShowAddFavorite] = useState({});

//   const [showModalFavorite, setShowModalFavorite] = useState(false);
//   const [favoriteToEdit, setFavoriteToEdit] = useState(null);
//   const [modalCondicion, setModalCondicion] = useState(1);

//   // Datos obtenidos de la solicitud (select y autocompletado)
//   const [dataArea, setDataArea] = useState([]);
//   const [dataCentroCostos, setDataCentroCostos] = useState([]);
//   const [dataMotivo, setDataMotivo] = useState([]);
//   const [dataMovil, setDataMovil] = useState([]);
//   const [dataPago, setDataPago] = useState([]);
//   const [dataPersonal, setDataPersonal] = useState({});
//   const [dataConfiguracion, setDataConfiguracion] = useState({});
//   const [dataPersonalo, setDataPersonalo] = useState([]);
//   const [dataIncremento, setDataIncremento] = useState('');
//   const [favorites, setFavorites] = useState([]);

//   // API favoritoscurrentInput
//   // Campo actualmente enfocado (origin, destination, additional-i)
//   const [currentInput, setCurrentInput] = useState(null);

//   // Estados para usuario (si es para otro usuario)
//   const [parami, setParami] = useState('');
//   const [usuario, setUsuario] = useState('');
//   const [telefono, setTelefono] = useState('');

//   const [zona, setZona] = useState('');
//   const [hora, setHora] = useState('');
//   const [fecha, setFecha] = useState('');
//   const [observaciones, setObservaciones] = useState('');
//   const [tipopago, setTipopago] = useState('');
//   const [tipomovil, setTipomovil] = useState('');
//   const [area, setArea] = useState(''); // Valor predeterminado (se asigna de dataPersonal)
//   const [centrocostos, setCentrocostos] = useState(''); // Valor predeterminado (se asigna de dataPersonal)
//   const [motivo, setMotivo] = useState('');
//   const [detalle, setDetalle] = useState('');
//   const [fare, setFare] = useState(0);
//   const [tariffCalculated, setTariffCalculated] = useState(false);

//   const idpersonal = localStorage.getItem('idpersonal');
//   const idcliente = localStorage.getItem('idcliente');

//   const optionUsuario = [
//     { value: 'parami', label: 'Para mi' },
//     { value: 'paraotrousuario', label: 'Para otro usuario' },
//   ];

//   // Carga inicial de favoritos
//   const handleMyFavorites = useCallback(async (showLoader = false) => {
//     if (showLoader) setProgress(true);
//     try {
//       const response = await axios.get(`${baseUrl}api/IntranetApp/Favoritosl`, {
//         params: { idpersonal }, headers: { Authorization: `Bearer ${key}` }
//       });
//       if (response.data.estatus === 200) setFavorites(response.data.AFavoritosl);
//     } catch (error) { } finally { if (showLoader) setProgress(false); }
//   }, [baseUrl, idpersonal, key]);

//   // Función para añadir favorito
//   const handleAddFavorite = (idcaja) => {
//     const entry = tempArray.find(item => item.idcaja === idcaja);
//     if (!entry) return notifyError('No hay datos para guardar como favorito.');
//     // Prepara los datos para el modal
//     setFavoriteToEdit({
//       titulo: entry.inputValue,
//       direccion: entry.inputValue,
//       referencia: entry.inputValue,
//       latitude: entry.lat,
//       longitude: entry.lng,
//     });
//     setModalCondicion(1);            // crear = 1, actualizar = 2, según tu lógica
//     setShowModalFavorite(true);
//   };

//   const closeModal = () => {
//     setShowModalFavorite(false);
//     setFavoriteToEdit(null);
//   };

//   // Función para usar favorito en campo activo
//   const handleUseFavorite = async (fav) => {
//     if (!currentInput) return notifyError('Selecciona primero un campo de dirección.');
//     const idcaja = currentInput;
//     const zonaFav = await fetchZone(fav.latitude, fav.longitude);
//     const newEntry = { inputValue: fav.direccion, lat: fav.latitude, lng: fav.longitude, dist: 0, tiempo: 0, monto: 0, zona: zonaFav || '', idcaja };
//     // Actualizar tempArray
//     setTempArray(prev => {
//       const idx = prev.findIndex(i => i.idcaja === idcaja);
//       if (idx !== -1) {
//         const a = [...prev]; a[idx] = newEntry; return a;
//       }
//       return [...prev, newEntry];
//     });
//     // Actualizar marcadores
//     setMarkers(prev => {
//       const filt = prev.filter(m => m.idcaja !== idcaja);
//       return reorderMarkers([...filt, { idcaja, lat: fav.latitude, lng: fav.longitude, direccion: fav.direccion, type: 'circle', zona: newEntry.zona }]);
//     });
//     // Rellenar input
//     if (idcaja === 'origin') {
//       setOrigin(fav.direccion);
//       setOriginSuggestions([]);
//     } else if (idcaja === 'destination') {
//       setDestination(fav.direccion);
//       setDestinationSuggestions([]);
//     } else {
//       const index = parseInt(idcaja.split('-')[1], 10);
//       setAdditionalDestinations(prev => {
//         const arr = [...prev]; arr[index] = { value: fav.direccion, suggestions: [] }; return arr;
//       });
//     }
//     setShowAddFavorite(prev => ({ ...prev, [idcaja]: false }));
//   };

//   // ----------------- Funciones de Sugerencias y Marcadores -----------------
//   const reorderMarkers = (markersToSort) => {
//     const priority = {
//       'origin': 0,
//       'destination': 1,
//       'additional-0': 2,
//       'additional-1': 3,
//     };
//     return markersToSort.slice().sort((a, b) => (priority[a.idcaja] ?? 99) - (priority[b.idcaja] ?? 99));
//   };

//   const removeMarkerByIdcaja = (idcaja) => {
//     setMarkers(prev => reorderMarkers(prev.filter(m => m.idcaja !== idcaja)));
//     setTempArray(prev => prev.filter(item => item.idcaja !== idcaja));
//     setTariffCalculated(false);
//   };

//   const fetchSuggestions = async (inputValue, setSuggestions) => {
//     const query = inputValue.trim().toLowerCase();
//     if (query.length < 3) {
//       setSuggestions([]);
//       return;
//     }
//     try {
//       const response = await fetch(
//         `https://v2.monterrico.app/api/v3/place/${encodeURIComponent(query)}/0/demo?country=PE`,
//         {
//           method: 'GET',
//           headers: {
//             Authorization: 'Basic c3lzdGVtM3c6NkVpWmpwaWp4a1hUZUFDbw==',
//             'Content-Type': 'application/json',
//           },
//         }
//       );
//       const data = await response.json();
//       setSuggestions(data.coincidencias || []);
//     } catch (error) {
//       console.error('Error fetching suggestions:', error);
//     }
//   };

//   const fetchGeocoding = async (coordinate, index = null) => {
//     try {
//       const formattedCoordinate = coordinate.replace(/,/g, ', ');
//       const url = `https://v2.monterrico.app/api/v3/geocoding/${formattedCoordinate}/0/udemo`;
//       const response = await fetch(url);
//       const data = await response.json();
//       if (data.status === 200) {
//         const address = data.address;
//         if (index === 'origin') {
//           setOrigin(address);
//           fetchSuggestions(address, setOriginSuggestions);
//         } else if (index === null) {
//           setDestination(address);
//           fetchSuggestions(address, setDestinationSuggestions);
//         } else {
//           setAdditionalDestinations(prev => {
//             const updated = [...prev];
//             updated[index].value = address;
//             fetchSuggestions(address, sugg => {
//               updated[index].suggestions = sugg;
//               setAdditionalDestinations([...updated]);
//             });
//             return updated;
//           });
//         }
//         setTariffCalculated(false);
//       }
//     } catch (error) {
//       console.error('Error fetching geocoding:', error);
//     }
//   };

//   const handleSelectSuggestion = async (suggestion, isOrigin = true, index = null) => {
//     const selectedText = `${suggestion.direccion}, ${suggestion.distrito}`.slice(0, 250);
//     const normalize = str => str.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
//     const airportAddrs = [
//       "aeropuerto internacional jorge chavez, av. elmer faucett, callao",
//       'aeropuerto internacional "jorge chavez" (lim), av. elmer faucett, callao, peru',
//       "international airport jorge chavez"
//     ];
//     const isAirport = airportAddrs.includes(normalize(suggestion.direccion)) ||
//       (suggestion.lat === -12.0222649 && suggestion.lng === -77.1191992);
//     const finalLat = isAirport ? -12.022816 : suggestion.lat;
//     const finalLng = isAirport ? -77.107902 : suggestion.lng;
//     const idcaja = isOrigin ? 'origin' : (index === null ? 'destination' : `additional-${index}`);
//     const zonaObtenida = await fetchZone(finalLat, finalLng);
//     const matched = favorites.some(f => f.latitude === finalLat && f.longitude === finalLng);
//     setShowAddFavorite(prev => ({ ...prev, [idcaja]: !matched }));
//     const newEntry = { inputValue: selectedText, lat: finalLat, lng: finalLng, dist: 0, tiempo: 0, monto: 0, zona: zonaObtenida || '', idcaja };
//     setTempArray(prev => {
//       const idx = prev.findIndex(x => x.idcaja === idcaja);
//       if (idx >= 0) { const a = [...prev]; a[idx] = newEntry; return a; }
//       return [...prev, newEntry];
//     });
//     setMarkers(prev => reorderMarkers([...prev.filter(m => m.idcaja !== idcaja), { idcaja, lat: finalLat, lng: finalLng, direccion: selectedText, type: 'circle', zona: newEntry.zona }]));
//     if (idcaja === 'origin') {
//       setOrigin(selectedText); setOriginSuggestions([]);
//     } else if (idcaja === 'destination') {
//       setDestination(selectedText); setDestinationSuggestions([]);
//     } else {
//       setAdditionalDestinations(prev => { const arr = [...prev]; arr[index] = { value: selectedText, suggestions: [] }; return arr; });
//     }
//     setTariffCalculated(false);
//   };

//   const handleOriginChange = (e) => {
//     const value = e.target.value;
//     setOrigin(value);
//     setCurrentInput('origin');
//     setTariffCalculated(false);
//     if (!value.trim()) {
//       setOriginSuggestions([]);
//       return;
//     }
//     const isCoordinate = /^-?\d{1,2}\.\d+,\s*-?\d{1,3}\.\d+$/.test(value);
//     if (isCoordinate) {
//       setTimeout(() => { fetchGeocoding(value, 'origin'); }, 500);
//     } else {
//       setTimeout(() => { fetchSuggestions(value, setOriginSuggestions); }, 500);
//     }
//   };

//   const handleDestinationChange = (value, index = null) => {
//     if (index === null) {
//       setDestination(value);
//       setCurrentInput(index === null ? 'destination' : `additional-${index}`);
//       setTariffCalculated(false);
//       if (!value.trim()) {
//         setDestinationSuggestions([]);
//         return;
//       }
//       const isCoordinate = /^-?\d{1,2}\.\d+,\s*-?\d{1,3}\.\d+$/.test(value);
//       if (isCoordinate) {
//         setTimeout(() => { fetchGeocoding(value, null); }, 500);
//       } else {
//         setTimeout(() => { fetchSuggestions(value, setDestinationSuggestions); }, 500);
//       }
//     } else {
//       setAdditionalDestinations(prev => {
//         const updated = [...prev];
//         updated[index].value = value;
//         return updated;
//       });
//       removeMarkerByIdcaja(`additional-${index}`);
//       setTariffCalculated(false);
//       if (!value.trim()) {
//         setAdditionalDestinations(prev => {
//           const updated = [...prev];
//           updated[index].suggestions = [];
//           return updated;
//         });
//         return;
//       }
//       const isCoordinate = /^-?\d{1,2}\.\d+,\s*-?\d{1,3}\.\d+$/.test(value);
//       if (isCoordinate) {
//         setTimeout(() => { fetchGeocoding(value, index); }, 500);
//       } else {
//         setTimeout(() => {
//           fetchSuggestions(value, sugg => {
//             setAdditionalDestinations(prev => {
//               const updated = [...prev];
//               updated[index].suggestions = sugg;
//               return updated;
//             });
//           });
//         }, 500);
//       }
//     }
//   };

//   const handleAddRoute = () => {
//     if (additionalDestinations.length < 2) {
//       setAdditionalDestinations(prev => [...prev, { value: '', suggestions: [] }]);
//       setTariffCalculated(false);
//     } else {
//       notifyError('Solo se permiten 2 destinos adicionales.');
//     }
//   };

//   const handleRemoveRoute = (index) => {
//     setAdditionalDestinations(prev => prev.filter((_, i) => i !== index));
//     removeMarkerByIdcaja(`additional-${index}`);
//     setAdditionalDestinations(prev =>
//       prev.map((dest, i) => ({ ...dest, idcaja: `additional-${i}` }))
//     );
//     setMarkers(prev =>
//       prev.map(marker => {
//         if (marker.idcaja.startsWith('additional-')) {
//           const markerIndex = parseInt(marker.idcaja.split('-')[1], 10);
//           if (markerIndex > index) {
//             return { ...marker, idcaja: `additional-${markerIndex - 1}` };
//           }
//         }
//         return marker;
//       })
//     );
//     setTempArray(prev =>
//       prev.map(item => {
//         if (item.idcaja.startsWith('additional-')) {
//           const itemIndex = parseInt(item.idcaja.split('-')[1], 10);
//           if (itemIndex > index) {
//             return { ...item, idcaja: `additional-${itemIndex - 1}` };
//           }
//         }
//         return item;
//       })
//     );
//     setTariffCalculated(false);
//   };

//   const fetchZone = async (lat, lng) => {
//     try {
//       const responseZona = await axios.post(
//         `${baseUrl}api/IntranetApp/Zona`,
//         { id_empresa_taxi: idempresa, lat, lng },
//         { headers: { Authorization: `Bearer ${key}` } }
//       );
//       if (responseZona.data.status_code === 200 && responseZona.data.status === "success") {
//         setZona(responseZona.data.data);
//         return responseZona.data.data;
//       }
//     } catch (error) {
//       console.error("Error fetching zone:", error);
//     }
//     return null;
//   };

//   // ----------------- Funciones de Cálculo de Tarifa y Ajustes -----------------
//   const calculateTariff = async () => {
//     setProgress(true)
//     if (tempArray.length < 2) {
//       notifyError('Debe seleccionar al menos dos puntos para calcular la tarifa.');
//       setProgress(false)
//       // alert("Debe seleccionar al menos dos puntos para calcular la tarifa.");
//       return;
//     }
//     let total = 0;
//     for (let i = 0; i < tempArray.length - 1; i++) {
//       const start = tempArray[i];
//       const end = tempArray[i + 1];
//       try {
//         const routeRes = await axios.get(
//           `https://v2.monterrico.app/api/v3/route/${start.lat},${start.lng}/${end.lat},${end.lng}/-1/tarifaTotal`,
//           { headers: { Authorization: 'Basic c3lzdGVtM3c6NkVpWmpwaWp4a1hUZUFDbw==' } }
//         );
//         const routeData = routeRes.data;
//         if (routeData && routeData.route && routeData.route.length >= 2) {
//           // Actualizamos los valores de distancia y tiempo para este tramo
//           tempArray[i + 1].dist = routeData.distance;
//           tempArray[i + 1].tiempo = routeData.time;
//           const postData = {
//             idcliente: localStorage.getItem('idcliente'),
//             idempresa: parseInt(idempresa),
//             tipomovil: tipomovil,
//             distancia: routeData.distance,
//             tiempo: routeData.time,
//             pago: tipopago,
//             zorigen: start.zona,
//             zdestino: end.zona,
//             fecha: fecha,
//             hora: parseInt(hora.split(":")[0]),
//           };
//           const tarifaRes = await axios.post(
//             `${baseUrl}api/IntranetApp/Tarifario`,
//             postData,
//             {
//               headers: {
//                 Authorization: `Bearer ${key}`,
//                 "Content-Type": "application/json",
//               }
//             }
//           );
//           if (tarifaRes.data.estatus === 200) {
//             setProgress(false)
//             setTariffCalculated(true);
//             notifySuccess('Tarifa obtenida');
//             total += tarifaRes.data.tarifa;
//             // Actualiza el tramo con la tarifa calculada
//             setTempArray(prev => {
//               const newArr = [...prev];
//               newArr[i + 1] = { ...newArr[i + 1], monto: tarifaRes.data.tarifa };
//               return newArr;
//             });
//           } else {
//             setProgress(false)
//             notifyError('No se pudo obtener tarifa, validar campos');
//             setTariffCalculated(false)
//           }
//         }
//       } catch (error) {
//         setProgress(false)
//         notifyError('No se pudo obtener tarifa, validar campos');
//         console.error("Error al calcular ruta:", error);
//       }
//     }
//     const horaPunta = await handleHoraPunta();
//     const adjustedFare = await callAumentoTarifa(total, horaPunta);
//     setFare(adjustedFare);
//   };

//   const handleHoraPunta = async () => {
//     if (!fecha || !hora) {
//       notifyError('Ingrese fecha y hora válidas.');
//       return 0;
//     }
//     const dateObj = new Date(fecha);
//     let diaSemana = dateObj.getDay() + 1;
//     const hourInt = parseInt(hora.split(":")[0]);
//     try {
//       const response = await axios.get(`${baseUrl}api/IntranetApp/Horapuntademanda`, {
//         params: {
//           idempresas: idempresa,
//           hora: hourInt,
//           dia: diaSemana
//         },
//         headers: {
//           Authorization: `Bearer ${key}`
//         }
//       });
//       if (response.data && response.data.OHorapuntademanda) {
//         return response.data.OHorapuntademanda.horapunt || 0;
//       }
//     } catch (error) {
//       console.error("Error fetching hora punta:", error);
//     }
//     return 0;
//   };

//   const callAumentoTarifa = async (total, horaPunta) => {
//     const body = {
//       idcliente: Number(localStorage.getItem('idcliente')),
//       monto: total,
//       pago: tipopago,
//       plataforma: "Intranet",
//       punta: horaPunta,
//       fecha: fecha,
//       tipo: "Normal"
//     };
//     try {
//       const response = await axios.post(`${baseUrl}api/IntranetApp/Tarifarioincremento`, body, {
//         headers: {
//           Authorization: `Bearer ${key}`,
//           "Content-Type": "application/json"
//         }
//       });
//       if (response.data) {
//         setDataIncremento(response.data);
//         const { mhorapunta, mhvalle, mcentral, mappweb } = response.data;
//         const adjusted = total - (mhvalle) - (mappweb) + (mcentral) + (mhorapunta);
//         // console.log("Tarifa ajustada:", adjusted);
//         return adjusted;
//       }
//     } catch (error) {
//       console.error("Error en callAumentoTarifa:", error);
//     }
//     return total;
//   };

//   // ----------------- Función para Obtener Datos de Solicitante -----------------
//   const dataSolicitante = useCallback(async () => {
//     try {
//       const responseSolicitud = await axios.get(`${baseUrl}api/IntranetApp/Solicitud`, {
//         params: {
//           idpersonal: idpersonal,
//           idcliente: idcliente,
//         },
//         headers: {
//           Authorization: `Bearer ${key}`,
//         }
//       });
//       if (responseSolicitud.data.estatus === 200) {
//         setDataArea(responseSolicitud.data.AArea);
//         setDataCentroCostos(responseSolicitud.data.ACentrocostos);
//         setDataMotivo(responseSolicitud.data.AMotivosolicitud);
//         setDataMovil(responseSolicitud.data.AMovil);
//         setDataPago(responseSolicitud.data.APago);
//         setDataPersonal(responseSolicitud.data.OPersonal);
//         setDataConfiguracion(responseSolicitud.data.OConfiguracion);
//         setDataPersonalo(responseSolicitud.data.APersonalo);
//         // console.log(responseSolicitud.data);
//       }
//     } catch (error) {
//       console.error(error.response?.data);
//     }
//   }, [baseUrl, idpersonal, key, idcliente]);

//   // ----------------- Funciones para Usuario y Teléfono -----------------
//   const handleUsuarioChange = (e) => {
//     const value = e.target.value;
//     setUsuario(value);
//     const userObj = dataPersonalo.find(item => item.datpersonal === value);
//     if (userObj) {
//       setTelefono(userObj.telefonoprincipal);
//       setArea(userObj.area);           // Actualiza el input de Área
//       setCentrocostos(userObj.centrocostos); // Actualiza el input de Centro de costos
//     } else {
//       setTelefono('');
//       setArea('');
//       setCentrocostos('');
//     }
//   };

//   const handleOptionUsuarioChange = (e) => {
//     const newValue = e.target.value;
//     setParami(newValue);
//     setUsuario('')
//     setTelefono(dataPersonal.telefonoprincipal);
//     setArea(dataPersonal.area);
//     setCentrocostos(dataPersonal.centrocostos);
//   };

//   const getCentroCostosId = (centrocostosValue) => {
//     const found = dataCentroCostos.find(item => item.centrocostos === centrocostosValue);
//     return found ? Number(found.idcentrocostos) : 0;
//   };

//   const getAreaId = (areaValue) => {
//     const found = dataArea.find(item => item.area === areaValue);
//     return found ? Number(found.idarea) : 0;
//   };

//   const getMotivoId = (motivoValue) => {
//     const found = dataMotivo.find(item => item.motivosolicitud === motivoValue);
//     return found ? Number(found.idmotivosolicitud) : 0;
//   };

//   const getMovilId = (tipomovilValue) => {
//     const found = dataMovil.find(item => item.destipomovil === tipomovilValue);
//     return found ? Number(found.idtipomovil) : 0;
//   };

//   // ----------------- Función para cambiar Tipo de Pago -----------------
//   // const handleTipopagoChange = (e) => {
//   //   const value = e.target.value;
//   //   setTipopago(value);
//   //   setTariffCalculated(false);
//   //   // Si es Efectivo, limpiar y ocultar campos de Área, Centro de costos y Motivo
//   //   if (value === "Efectivo") {
//   //     setArea('');
//   //     setCentrocostos('');
//   //     setMotivo('');
//   //     setDetalle('');
//   //   }
//   // };

//   // ----------------- Función para Registro del Servicio -----------------
//   const sendServiceRequest = async () => {
//     setProgress(true)

//     // Dentro de sendServiceRequest, justo al inicio (antes de otras validaciones)
//     if (!tipopago.trim()) {
//       notifyError('El campo Tipo pago es obligatorio.');
//       // alert("El campo 'Tipo pago' es obligatorio.");
//       return;
//     }
//     if (!tipomovil.trim()) {
//       notifyError('El campo Tipo movil es obligatorio.');
//       // alert("El campo 'Tipo movil' es obligatorio.");
//       return;
//     }

//     // Validaciones de campos obligatorios según dataConfiguracion (solo si no es Efectivo)
//     if (tipopago !== "Efectivo") {
//       if (dataConfiguracion.idcentrocostos && !centrocostos.trim()) {
//         notifyError('El campo Centro de costos es obligatorio.');
//         setProgress(false)
//         // alert("El campo 'Centro de costos' es obligatorio.");
//         return;
//       }
//       if (dataConfiguracion.idarea && !area.trim()) {
//         notifyError('El campo Área es obligatorio.');
//         setProgress(false)
//         // alert("El campo 'Área' es obligatorio.");
//         return;
//       }
//       if (dataConfiguracion.idmotsol && !motivo.trim()) {
//         notifyError('El campo Motivo es obligatorio.');
//         setProgress(false)
//         // alert("El campo 'Motivo' es obligatorio.");
//         return;
//       }
//       if (dataConfiguracion.iddetallemotivo && !detalle.trim()) {
//         notifyError('El campo Detalle motivo es obligatorio.');
//         setProgress(false)
//         // alert("El campo 'Detalle motivo' es obligatorio.");
//         return;
//       }

//       if (dataConfiguracion.areacondicion === "Lista") {
//         const areaValida = dataArea.some(item => item.area === area.trim());
//         if (!areaValida) {
//           notifyError('El valor ingresado en Área no está en la lista permitida.');
//           setProgress(false);
//           return;
//         }
//       }

//       if (dataConfiguracion.centrocostoscondicion === "Lista") {
//         const centroCostoValida = dataCentroCostos.some(item => item.centrocostos === centrocostos.trim());
//         if (!centroCostoValida) {
//           notifyError('El valor ingresado en Centro de costos no está en la lista permitida.');
//           setProgress(false);
//           return;
//         }
//       }
//     }
//     if (!origin || !destination || !fecha || !hora) {
//       notifyError('Complete todos los campos obligatorios.');
//       // alert("Complete todos los campos obligatorios.");
//       return;
//     }

//     const formattedFecha = `${fecha}T00:00:00`;

//     const selectedUser = parami === 'paraotrousuario'
//       ? dataPersonalo.find(u => u.datpersonal === usuario) || {}
//       : dataPersonal;

//     const tpersonal = [
//       {
//         idpersonal: selectedUser.idpersonal || idpersonal,
//         datosusuario: selectedUser.datpersonal || dataPersonal.apenom || "",
//         codigo: "",
//         cargo: "",
//         telprincipal: selectedUser.telefonoprincipal || dataPersonal.telefonoprincipal || "",
//         telsecundario: "",
//         emailt: "",
//         tipot: ""
//       }
//     ];

//     const truta = tempArray.map((item, index) => ({
//       item: index + 1,
//       personal: "",
//       direccion: item.inputValue,
//       referencia: "",
//       zona: item.zona,
//       latitude: item.lat,
//       longitude: item.lng,
//       tiporuta: dataConfiguracion.ttarifario || "COSTO KM.",
//       distkm: item.dist || 0.0,
//       minkm: item.tiempo || 0.0,
//       costobase: 0.0,
//       costokm: 0.0,
//       costomin: 0.0,
//       constante: 0.0,
//       monto: item.monto || 0.0,
//       nhoras: 0.0,
//       tarifa: item.monto || 0.0,
//       peaje: 0.0,
//       parqueo: 0.0,
//       tiempoespera: 0,
//       tiempocosto: 0.0,
//       desvio: 0.0,
//       courier: 0.0,
//       pesokg: 0.0,
//       pesocosto: 0.0,
//       subtotalruta: item.monto || 0.0,
//       idr: index + 1,
//     }));

//     const postBody = {
//       idcliente: Number(idcliente),
//       cliente: dataPersonal.cliente,
//       idsolicitante: idpersonal,
//       solicitante: dataPersonal.apenom || "",
//       idautorizado: idpersonal,
//       autorizado: dataPersonal.apenom || "",
//       idcentrocostos: getCentroCostosId(centrocostos),
//       centrocostos: centrocostos,
//       idarea: getAreaId(area),
//       area: area,
//       idmotivo: getMotivoId(motivo),
//       motivo: motivo,
//       motivodetalle: detalle,
//       vuelo: "",
//       aerolinea: "",
//       procedencia: "",
//       pago: tipopago,
//       noperacion: "",
//       nvale: "",
//       voucher: "",
//       comprobante: false,
//       tipocomprobante: "",
//       nruc: "",
//       email: "",
//       fecha: formattedFecha,
//       hora: hora,
//       prioridad: "Al Momento",
//       adicional: 0.0,
//       modo: "INTRANET",
//       tipo: "Normal",
//       idmovil: getMovilId(tipomovil),
//       movil: tipomovil,
//       categoria: "REGULAR",
//       moneda: "NSOL",
//       maletera: false,
//       idioma: false,
//       luna: false,
//       eslan: "",
//       atlan: "",
//       serlan: "",
//       subtotal: fare,
//       peajes: 0.0,
//       parqueos: 0.0,
//       ipunta: dataIncremento.mhorapunta,
//       icentral: dataIncremento.mcentral,
//       dvalle: dataIncremento.mhvalle,
//       dappweb: dataIncremento.mappweb,
//       total: fare,
//       automatico: false,
//       comunidad: false,
//       distancia: tempArray.reduce((acc, curr) => acc + (curr.dist || 0), 0),
//       tiempo: tempArray.reduce((acc, curr) => acc + (curr.tiempo || 0), 0),
//       dorigen: origin,
//       zorigen: tempArray[0]?.zona || "",
//       latorigen: tempArray[0]?.lat || 0,
//       lonorigen: tempArray[0]?.lng || 0,
//       ddestino: destination,
//       zdestino: tempArray[tempArray.length - 1]?.zona || "",
//       latdestino: tempArray[tempArray.length - 1]?.lat || 0,
//       londestino: tempArray[tempArray.length - 1]?.lng || 0,
//       tpersonal: tpersonal,
//       truta: truta,
//       ptraslado: selectedUser.datpersonal || dataPersonal.apenom,
//       observaciones: observaciones,
//       contacto: selectedUser.datpersonal || dataPersonal.apenom,
//       telefono: selectedUser.telefonoprincipal || dataPersonal.telefonoprincipal,
//       idempresas: idempresa,
//       agente: "Intranet",
//       ipregistro: "0.0.0.0",
//       nchatwoot: ""
//     };

//     try {
//       const response = await axios.post(
//         `${baseUrl}api/IntranetApp/Serviciosr`,
//         postBody,
//         {
//           headers: {
//             Authorization: `Bearer ${key}`,
//             "Content-Type": "application/json"
//           }
//         }
//       );
//       if (response.data) {
//         setProgress(false)
//         notifySuccess(`Registro exitoso. Id de reserva: ${response.data.idreserva}`);
//         setOrigin('');
//         setDestination('');
//         setHora('');
//         setFecha('');
//         setObservaciones('');
//         setTipopago(dataPago[0].tpago);
//         setTipomovil(dataMovil[0].destipomovil);
//         setArea(dataPersonal.area);
//         setCentrocostos(dataPersonal.centrocostos);
//         setMotivo('');
//         setDetalle('');
//         setTariffCalculated('');
//         setFare(0);
//         // alert(`Registro exitoso. Id de reserva: ${response.data.idreserva}`);
//         // Aquí podrías limpiar el formulario o redirigir al usuario.
//       } else {
//         notifyError('Error al enviar solicitud.');
//       }
//     } catch (error) {
//       // console.error("Error al enviar solicitud:", error);
//       notifyError('Error al enviar solicitud.');
//     }
//   };

//   useEffect(() => {
//     if (dataPago.length > 0) {
//       // Cuando dataPago se carga, asigna el primer valor como default
//       setTipopago(dataPago[0].tpago);
//     } if (dataMovil.length > 0) {
//       // Cuando dataMovil se carga, asigna el primer valor como default
//       setTipomovil(dataMovil[0].destipomovil);
//     } if (dataPersonal) {
//       // Cuando dataPersonal se carga, asigna el primer valor como default
//       setArea(dataPersonal.area || '');
//       setCentrocostos(dataPersonal.centrocostos || '');
//     }

//     const now = new Date();
//     // YYYY‑MM‑DD para el input type="date"
//     setFecha(now.toISOString().slice(0, 10));

//     // HH:MM (pad inicio con cero si <10)
//     const hours = String(now.getHours()).padStart(2, '0');
//     const minutes = String(now.getMinutes()).padStart(2, '0');
//     setHora(`${hours}:${minutes}`);
//   }, [dataPersonal, dataPago, dataMovil]);

//   useEffect(() => {
//     dataSolicitante();
//     handleMyFavorites()
//   }, [dataSolicitante, handleMyFavorites]);

//   useEffect(() => {
//     const readyToCalculate =
//       tempArray.length >= 2 &&
//       tipopago &&
//       tipomovil &&
//       fecha &&
//       hora;

//     if (readyToCalculate && !isCalculatingRef.current) {
//       isCalculatingRef.current = true;
//       calculateTariff().finally(() => {
//         isCalculatingRef.current = false;
//       });
//     }
//   }, [tempArray, tipopago, tipomovil, fecha, hora]);


//   // ----------------- Renderizado del Componente -----------------
//   return (
//     <div className='page-request'>
//       {progress && (
//         <Box className='box-progress'>
//           <CircularProgress color="primary" size="3rem" />
//         </Box>
//       )}
//       <div className='maps-page'>
//         <GoogleMaps markers={markers} />
//         <div className='box-request'>
//           <div className='box-user'>
//             <Select
//               options={optionUsuario}
//               value={parami}
//               onChange={handleOptionUsuarioChange}
//               className="type-document parami"
//             />
//             {parami === 'paraotrousuario' && (
//               <div className='content-request'>
//                 <input
//                   className='camp-request'
//                   type="text"
//                   list="usuarios"
//                   placeholder="Nombre de usuario"
//                   value={usuario}
//                   onChange={handleUsuarioChange}
//                 />
//                 <datalist id="usuarios">
//                   {dataPersonalo.map((item, index) => (
//                     <option key={index} value={item.datpersonal} />
//                   ))}
//                 </datalist>
//                 <input
//                   className='camp-request'
//                   type="text"
//                   placeholder="Teléfono"
//                   value={telefono}
//                   readOnly
//                 />
//               </div>
//             )}
//           </div>
//           <label style={{ marginBottom: '-8px' }}>Dirección origen</label>
//           <div className='box-origin-request'>
//             {showAddFavorite['origin'] && <Button className="button-remove-route input-directions" label={<TbFlagHeart className="icon-favorite" />} onClick={() => handleAddFavorite('origin')} />}
//             <Input
//               type='text'
//               placeholder="Av. Prolongacion Iquitos 2291, Lince"
//               value={origin}
//               onFocus={() => setCurrentInput('origin')}
//               onClick={() => setCurrentInput('origin')}
//               onChange={handleOriginChange}
//             />
//             {originSuggestions.length > 0 && (
//               <ul className="suggestions-origen">
//                 {originSuggestions.map((suggestion, index) => (
//                   <li key={index} onClick={() => handleSelectSuggestion(suggestion, true)}>
//                     {`${suggestion.direccion}, ${suggestion.distrito}`}
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </div>
//           <label style={{ marginBottom: '-8px' }}>Dirección destino</label>
//           <div className="box-destination-request">
//             {showAddFavorite['destination'] && <Button className="button-remove-route input-directions" label={<TbFlagHeart className="icon-favorite" />} onClick={() => handleAddFavorite('destination')} />}
//             <div className='box-directions-button'>
//               <Input
//                 type="text"
//                 placeholder="Ingresa destino"
//                 value={destination}
//                 className="input-request-destination input-directions"
//                 onFocus={() => setCurrentInput('destination')}
//                 onClick={() => setCurrentInput('destination')}
//                 onChange={e => handleDestinationChange(e.target.value)}
//               />
//               <Button
//                 className="button-add-route input-directions"
//                 label={<TbPlus className="icon-add" />}
//                 onClick={handleAddRoute}
//               />
//             </div>
//             {destinationSuggestions.length > 0 && (
//               <ul className="suggestions-destination">
//                 {destinationSuggestions.map((suggestion, index) => (
//                   <li key={index} onClick={() => handleSelectSuggestion(suggestion, false)}>
//                     {`${suggestion.direccion}, ${suggestion.distrito}`}
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </div>
//           {additionalDestinations.map((dest, index) => (
//             <div key={index} className="additional-destination">
//               {showAddFavorite[`additional-${index}`] && <Button className="button-remove-route input-directions" label={<TbFlagHeart className="icon-favorite" />} onClick={() => handleAddFavorite(`additional-${index}`)} />}
//               <div className='box-directions-button'>
//                 <Input
//                   type="text"
//                   placeholder="Ingresa destino adicional"
//                   value={dest.value}
//                   className="input-request-destination input-directions"
//                   onFocus={() => setCurrentInput(`additional-${index}`)}
//                   onClick={() => setCurrentInput(`additional-${index}`)}
//                   onChange={e => handleDestinationChange(e.target.value, index)}
//                 />
//                 <Button
//                   className="button-remove-route input-directions"
//                   label={<TbMinus className="icon-minus" />}
//                   onClick={() => handleRemoveRoute(index)}
//                 />
//               </div>
//               {dest.suggestions?.length > 0 && (
//                 <ul className="suggestions-destination-add">
//                   {dest.suggestions.map((suggestion, i) => (
//                     <li key={i} onClick={() => handleSelectSuggestion(suggestion, false, index)}>
//                       {`${suggestion.direccion}, ${suggestion.distrito}`}
//                     </li>
//                   ))}
//                 </ul>
//               )}
//             </div>
//           ))}
//           <div className='box-favorite'>
//             {favorites.map((fav, i) => (
//               <div key={i} className='button-favorite'>
//                 <button
//                   type="button"
//                   onMouseDown={e => {
//                     e.preventDefault();        // evita que el botón robe el foco
//                     handleUseFavorite(fav);    // corre ANTES de que el input pierda el foco
//                   }}
//                 >
//                   {fav.titulo}
//                 </button>
//               </div>
//             ))}
//           </div>

//           <div className='content-request'>
//             <div className='request'>
//               <label>Fecha</label>
//               <Input type='date' value={fecha} onChange={(e) => { setFecha(e.target.value); setTariffCalculated(false); }} />
//             </div>
//             <div className='request'>
//               <label>Hora</label>
//               <Input type='time' value={hora} onChange={(e) => { setHora(e.target.value); setTariffCalculated(false); }} />
//             </div>
//           </div>
//           <div className='request'>
//             <label>Observaciones</label>
//             <textarea
//               placeholder="Escribe tus observaciones para el servicio..."
//               value={observaciones}
//               onChange={(e) => setObservaciones(e.target.value)}
//             />
//           </div>
//           <div className='content-request'>
//             <div className='request'>
//               <label>Tipo pago</label>
//               <select className='camp-request-select' value={tipopago} onChange={(e) => setTipopago(e.target.value)}>
//                 {/* <option value="">Selecciona</option> */}
//                 {dataPago.map((pago) => (
//                   <option key={pago.tpago} value={pago.tpago}>{pago.tpago}</option>
//                 ))}
//               </select>
//             </div>
//             <div className='request'>
//               <label>Tipo movil</label>
//               <select className='camp-request-select' value={tipomovil} onChange={(e) => setTipomovil(e.target.value)}>
//                 <option value="">Selecciona</option>
//                 {dataMovil.map((movil) => (
//                   <option key={movil.idtipomovil} value={movil.destipomovil}>{movil.destipomovil}</option>
//                 ))}
//               </select>
//             </div>
//           </div>
//           {/* Si el tipo de pago es distinto a Efectivo, se muestran estos campos */}
//           {(tipopago !== "Efectivo" && tipopago !== "Plin" && tipopago !== "Yape") && (
//             <>
//               <div className='content-request'>
//                 <div className='request'>
//                   <label>Área</label>
//                   <input
//                     className='camp-request'
//                     type="text"
//                     list="areas"
//                     placeholder="Operaciones"
//                     value={area}
//                     onChange={(e) => setArea(e.target.value)}
//                   />
//                   <datalist id="areas">
//                     {dataArea.map((item, index) => (
//                       <option key={index} value={item.area} />
//                     ))}
//                   </datalist>
//                 </div>
//                 <div className='request'>
//                   <label>Centro de costos</label>
//                   <input
//                     className='camp-request'
//                     type="text"
//                     list="centroCostos"
//                     placeholder="C10245"
//                     value={centrocostos}
//                     onChange={(e) => setCentrocostos(e.target.value)}
//                   />
//                   <datalist id="centroCostos">
//                     {dataCentroCostos.map((item, index) => (
//                       <option key={index} value={item.centrocostos} />
//                     ))}
//                   </datalist>
//                 </div>
//               </div>
//               <div className='content-request'>
//                 <div className='request'>
//                   <label>Motivo</label>
//                   <input
//                     className='camp-request'
//                     type="text"
//                     list="motivos"
//                     placeholder="Viaje por trabajo"
//                     value={motivo}
//                     onChange={(e) => setMotivo(e.target.value)}
//                   />
//                   <datalist id="motivos">
//                     {dataMotivo.map((item, index) => (
//                       <option key={index} value={item.motivosolicitud} />
//                     ))}
//                   </datalist>
//                 </div>
//                 <div className='request'>
//                   <label>Detalle</label>
//                   <input
//                     className='camp-request'
//                     type="text"
//                     placeholder="Retorno de mina"
//                     value={detalle}
//                     onChange={(e) => setDetalle(e.target.value)}
//                   />
//                 </div>
//               </div>
//             </>
//           )}
//           <div className="content-request">
//             {/* <Button label="Consultar Tarifa" onClick={calculateTariff} /> */}
//             <div>
//               <strong>Tarifa: </strong> S/{fare.toFixed(2)}
//             </div>
//           </div>
//           {/* El botón "Solicitar Servicio" se muestra solo si se consultó la tarifa */}
//           {tariffCalculated && (
//             <div className="content-request">
//               <Button label="Solicitar Servicio" onClick={sendServiceRequest} />
//             </div>
//           )}
//         </div>
//       </div>
//       <ModalFavorite
//         showModalFavorite={showModalFavorite}
//         closeModal={closeModal}
//         favoritoSeleccionado={favoriteToEdit}
//         condicion={modalCondicion}
//         apiprincipal={() => handleMyFavorites(true)}
//       />
//     </div>
//   );
// };

// export default Request;