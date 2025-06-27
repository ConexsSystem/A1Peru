import React, { useState, useEffect, useCallback, useRef } from 'react';
import GoogleMaps from '../layout/GoogleMaps';
import Input from '../common/Input';
import Button from '../common/Button';
import Select from '../common/Select';
import { TbPlus, TbMinus, TbFlagHeart } from "react-icons/tb";
import axios from 'axios';
import './request.css';
import CircularProgress from '@mui/material/CircularProgress';
import { ModalFavorite, ModalTarifaConfirmacion } from '../layout/Modal';
import Box from '@mui/material/Box';
import { notifySuccess, notifyError } from '../../utils/ToastifyComponent';
import { calculateTariff as calculateTariffUtil } from '../../utils/tariffUtils';
import { useFavorites } from '../../hooks/useFavorites';
import { useLocationSuggestions } from '../../hooks/useLocationSuggestions';

const Request = () => {
  const baseUrl = process.env.REACT_APP_BASE_URL?.replace(/\/?$/, "/") || "";
  const idempresa = process.env.REACT_APP_IDEMPRESA;
  const key = localStorage.getItem('key');
  const idpersonal = localStorage.getItem('idpersonal');
  const idcliente = localStorage.getItem('idcliente');

  // Estados para datos del formulario y rutas
  const [progress, setProgress] = useState(false);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [additionalDestinations, setAdditionalDestinations] = useState([]);
  const [tempArray, setTempArray] = useState([]); // Cada objeto: { inputValue, lat, lng, dist, tiempo, monto, zona, idcaja }
  const [markers, setMarkers] = useState([]);
  const [showFarePreview, setShowFarePreview] = useState(false);

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

  const [showModalTarifaConfirmacion, setShowModalTarifaConfirmacion] = useState(false);
  const [tarifaPendiente, setTarifaPendiente] = useState(null);
  const [datosPendientes, setDatosPendientes] = useState(null);

  const optionUsuario = [
    { value: 'parami', label: 'Para mi' },
    { value: 'paraotrousuario', label: 'Para otro usuario' },
  ];

  // Custom hooks
  const favoritesHook = useFavorites(baseUrl, idpersonal, key);
  const locationHook = useLocationSuggestions(baseUrl, idempresa, key);

  // Ref para enfocar el nuevo input de destino adicional
  const additionalInputRefs = useRef({});

  // Función para marcar que se necesita recalcular la tarifa (para compatibilidad)
  const markForTariffRecalculation = useCallback(() => {
    // Esta función ya no hace nada en la nueva lógica
  }, []);

  // ----------------- Funciones de Marcadores -----------------
  const reorderMarkers = useCallback((markersToSort) => {
    const priority = {
      'origin': 0,
      'destination': 1,
      'additional-0': 2,
      'additional-1': 3,
    };
    return markersToSort.slice().sort((a, b) => (priority[a.idcaja] ?? 99) - (priority[b.idcaja] ?? 99));
  }, []);

  const removeMarkerByIdcaja = useCallback((idcaja) => {
    setMarkers(prev => reorderMarkers(prev.filter(m => m.idcaja !== idcaja)));
    setTempArray(prev => prev.filter(item => item.idcaja !== idcaja));
  }, [reorderMarkers]);

  // ----------------- Funciones de Manejo de Inputs -----------------
  const handleOriginChange = useCallback((e) => {
    const value = e.target.value;
    setOrigin(value);
    setCurrentInput('origin');

    if (!value.trim()) {
      locationHook.setOriginSuggestions([]);
      return;
    }

    const isCoordinate = locationHook.isCoordinate(value);
    if (isCoordinate) {
      setTimeout(() => {
        locationHook.fetchGeocoding(value, 'origin', setOrigin, setDestination, setAdditionalDestinations);
      }, 500);
    } else {
      setTimeout(() => {
        locationHook.fetchSuggestions(value, locationHook.setOriginSuggestions);
      }, 500);
    }
  }, [locationHook]);

  const handleDestinationChange = useCallback((value, index = null) => {
    if (index === null) {
      setDestination(value);
      setCurrentInput('destination');

      if (!value.trim()) {
        locationHook.setDestinationSuggestions([]);
        return;
      }

      const isCoordinate = locationHook.isCoordinate(value);
      if (isCoordinate) {
        setTimeout(() => {
          locationHook.fetchGeocoding(value, null, setOrigin, setDestination, setAdditionalDestinations);
        }, 500);
      } else {
        setTimeout(() => {
          locationHook.fetchSuggestions(value, locationHook.setDestinationSuggestions);
        }, 500);
      }
    } else {
      setAdditionalDestinations(prev => {
        const updated = [...prev];
        updated[index].value = value;
        return updated;
      });
      removeMarkerByIdcaja(`additional-${index}`);

      if (!value.trim()) {
        setAdditionalDestinations(prev => {
          const updated = [...prev];
          updated[index].suggestions = [];
          return updated;
        });
        return;
      }

      const isCoordinate = locationHook.isCoordinate(value);
      if (isCoordinate) {
        setTimeout(() => {
          locationHook.fetchGeocoding(value, index, setOrigin, setDestination, setAdditionalDestinations);
        }, 500);
      } else {
        setTimeout(() => {
          locationHook.fetchSuggestions(value, sugg => {
            setAdditionalDestinations(prev => {
              const updated = [...prev];
              updated[index].suggestions = sugg;
              return updated;
            });
          });
        }, 500);
      }
    }
  }, [locationHook, removeMarkerByIdcaja]);

  const handleAddRoute = useCallback(() => {
    if (additionalDestinations.length < 2) {
      const newIndex = additionalDestinations.length;
      setAdditionalDestinations(prev => [...prev, { value: '', suggestions: [] }]);

      // Enfocar el nuevo input después de que se renderice
      setTimeout(() => {
        if (additionalInputRefs.current[`additional-${newIndex}`]) {
          additionalInputRefs.current[`additional-${newIndex}`].focus();
        }
      }, 100);
    } else {
      notifyError('Solo se permiten 2 destinos adicionales.');
    }
  }, [additionalDestinations.length]);

  const handleRemoveRoute = useCallback((index) => {
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
  }, [removeMarkerByIdcaja]);

  // ----------------- Funciones para Usuario y Teléfono -----------------
  const handleUsuarioChange = useCallback((e) => {
    const value = e.target.value;
    setUsuario(value);
    const userObj = dataPersonalo.find(item => item.datpersonal === value);
    if (userObj) {
      setTelefono(userObj.telefonoprincipal);
      setArea(userObj.area);
      setCentrocostos(userObj.centrocostos);
    } else {
      setTelefono('');
      setArea('');
      setCentrocostos('');
    }
  }, [dataPersonalo]);

  const handleOptionUsuarioChange = useCallback((e) => {
    const newValue = e.target.value;
    setParami(newValue);
    setUsuario('');
    setTelefono(dataPersonal.telefonoprincipal);
    setArea(dataPersonal.area);
    setCentrocostos(dataPersonal.centrocostos);
  }, [dataPersonal]);

  // Normaliza strings para comparación robusta
  const normalize = str => (str || '').toLowerCase().trim();

  const getCentroCostosId = useCallback((centrocostosValue) => {
    const normalizedValue = normalize(centrocostosValue);
    const found = dataCentroCostos.find(item => normalize(item.centrocostos) === normalizedValue);
    return found ? Number(found.idcentrocostos) : 0;
  }, [dataCentroCostos]);

  const getAreaId = useCallback((areaValue) => {
    const normalizedValue = normalize(areaValue);
    const found = dataArea.find(item => normalize(item.area) === normalizedValue);
    return found ? Number(found.idarea) : 0;
  }, [dataArea]);

  const getMotivoId = useCallback((motivoValue) => {
    const normalizedValue = normalize(motivoValue);
    const found = dataMotivo.find(item => normalize(item.motivosolicitud) === normalizedValue);
    return found ? Number(found.idmotivosolicitud) : 0;
  }, [dataMotivo]);

  const getMovilId = useCallback((tipomovilValue) => {
    const found = dataMovil.find(item => item.destipomovil === tipomovilValue);
    return found ? Number(found.idtipomovil) : 0;
  }, [dataMovil]);

  // ----------------- Función para Registro del Servicio -----------------
  const handleSolicitarServicio = useCallback(async () => {
    // Lee el tipopago más reciente del estado
    const currentTipopago = tipopago;
    if (!currentTipopago.trim()) return notifyError('El campo Tipo pago es obligatorio.');
    if (!tipomovil.trim()) return notifyError('El campo Tipo movil es obligatorio.');
    if (!origin || !destination || !fecha || !hora) return notifyError('Complete todos los campos obligatorios.');

    setProgress(true);

    // Log del estado del formulario antes de validar
    console.log('📝 Estado actual del formulario:', {
      centrocostos,
      area,
      motivo,
      detalle,
      tipopago: currentTipopago,
      tipomovil,
      fecha,
      hora,
      observaciones,
      parami,
      usuario,
      telefono,
      dataConfiguracion,
      dataArea,
      dataCentroCostos,
      dataMotivo
    });

    // Calcula la tarifa usando la función utilitaria
    const tarifa = await calculateTariffUtil({
      tempArray,
      tipomovil,
      tipopago: currentTipopago,
      fecha,
      hora,
      key,
      idcliente,
      idempresa,
      baseUrl,
      setDataIncremento,
      dataConfiguracion,
      notifyError,
    });

    setProgress(false);

    if (tarifa && tarifa > 0) {
      setFare(tarifa);
      setTarifaPendiente(tarifa);
      setDatosPendientes({ centrocostos, area, motivo, detalle, tipopago: currentTipopago });
      setShowModalTarifaConfirmacion(true);
    } else {
      notifyError('No se pudo calcular la tarifa.');
    }
  }, [tempArray, tipomovil, tipopago, fecha, hora, key, idcliente, idempresa, baseUrl, dataConfiguracion, origin, destination, centrocostos, area, motivo, detalle]);

  const sendServiceRequest = useCallback(async (tarifaFinal, centrocostosArg, areaArg, motivoArg, detalleArg, tipopagoArg) => {
    setProgress(true);

    // Usa SIEMPRE los valores recibidos como argumentos
    const centrocostosValue = centrocostosArg;
    const areaValue = areaArg;
    const motivoValue = motivoArg;
    const detalleValue = detalleArg;
    const currentTipopago = tipopagoArg;

    // --- Validación de campos obligatorios y de lista SOLO si tipopago es 'Credito' ---
    if (currentTipopago === 'Credito') {
      // 1. Centro de costos
      if (dataConfiguracion.idcentrocostos) {
        if (!centrocostosValue.trim()) {
          notifyError('El campo Centro de costos es obligatorio.');
          setProgress(false);
          return;
        }
        if (dataConfiguracion.centrocostoscondicion === 'Lista') {
          const centroCostoSeleccionado = dataCentroCostos.find(item => item.centrocostos === centrocostosValue);
          if (!centroCostoSeleccionado) {
            notifyError('El valor ingresado en Centro de costos no está en la lista permitida.');
            setProgress(false);
            return;
          }
        }
      }
      // 2. Área
      if (dataConfiguracion.idarea) {
        if (!areaValue.trim()) {
          console.log('❌ Área es obligatorio pero está vacío');
          notifyError('El campo Área es obligatorio.');
          setProgress(false);
          return;
        }
        if (dataConfiguracion.areacondicion === 'Lista') {
          console.log('🔍 Validando Área - Condición: Lista');
          console.log('📝 Área ingresada (raw):', areaValue);
          console.log('📝 Área ingresada (trim):', areaValue.trim());
          console.log('📝 Área ingresada (normalize):', normalize(areaValue));
          console.log('📋 Áreas permitidas:', dataArea.map(item => item.area));
          const areaSeleccionada = dataArea.find(item => item.area === areaValue);
          if (!areaSeleccionada) {
            console.log('❌ Área no está en la lista permitida');
            notifyError('El valor ingresado en Área no está en la lista permitida.');
            setProgress(false);
            return;
          } else {
            console.log('✅ Área válida seleccionada:', {
              area: areaSeleccionada.area,
              idarea: areaSeleccionada.idarea
            });
          }
        }
      }
      // 3. Motivo
      if (dataConfiguracion.idmotsol) {
        if (!motivoValue.trim()) {
          console.log('❌ Motivo es obligatorio pero está vacío');
          notifyError('El campo Motivo es obligatorio.');
          setProgress(false);
          return;
        }
        if (dataConfiguracion.motivosolicitudcondicion === 'Lista') {
          console.log('🔍 Validando Motivo - Condición: Lista');
          console.log('📝 Motivo ingresado (raw):', motivoValue);
          console.log('📝 Motivo ingresado (trim):', motivoValue.trim());
          console.log('📝 Motivo ingresado (normalize):', normalize(motivoValue));
          console.log('📋 Motivos permitidos:', dataMotivo.map(item => item.motivosolicitud));
          const motivoSeleccionado = dataMotivo.find(item => item.motivosolicitud === motivoValue);
          if (!motivoSeleccionado) {
            console.log('❌ Motivo no está en la lista permitida');
            notifyError('El valor ingresado en Motivo no está en la lista permitida.');
            setProgress(false);
            return;
          } else {
            console.log('✅ Motivo válido seleccionado:', {
              motivo: motivoSeleccionado.motivosolicitud,
              idmotivo: motivoSeleccionado.idmotivosolicitud
            });
          }
        }
      }
      // 4. Detalle Motivo
      if (dataConfiguracion.iddetallemotivo) {
        if (!detalleValue.trim()) {
          notifyError('El campo Detalle motivo es obligatorio.');
          setProgress(false);
          return;
        }
      }
    }

    // --- Obtener IDs o 0 si no está en la lista ---
    const centroCostoSeleccionado = dataCentroCostos.find(item => item.centrocostos === centrocostosValue);
    const areaSeleccionada = dataArea.find(item => item.area === areaValue);
    const motivoSeleccionado = dataMotivo.find(item => item.motivosolicitud === motivoValue);

    // --- Variables necesarias para el postBody ---
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

    // --- Construcción del postBody ---
    const isCredito = currentTipopago === 'Credito';
    const postBody = {
      idcliente: Number(idcliente),
      cliente: dataPersonal.cliente,
      idsolicitante: idpersonal,
      solicitante: dataPersonal.apenom || "",
      idautorizado: idpersonal,
      autorizado: dataPersonal.apenom || "",
      idcentrocostos: isCredito ? (centroCostoSeleccionado ? Number(centroCostoSeleccionado.idcentrocostos) : 0) : 0,
      centrocostos: isCredito ? centrocostosValue : '',
      idarea: isCredito ? (areaSeleccionada ? Number(areaSeleccionada.idarea) : 0) : 0,
      area: isCredito ? areaValue : '',
      idmotivo: isCredito ? (motivoSeleccionado ? Number(motivoSeleccionado.idmotivosolicitud) : 0) : 0,
      motivo: isCredito ? motivoValue : '',
      motivodetalle: isCredito ? detalleValue : '',
      vuelo: "",
      aerolinea: "",
      procedencia: "",
      pago: currentTipopago,
      noperacion: "",
      nvale: "",
      voucher: "",
      comprobante: false,
      tipocomprobante: "",
      nruc: "",
      email: "",
      fecha: `${fecha}T00:00:00`,
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
      subtotal: tarifaFinal,
      peajes: 0.0,
      parqueos: 0.0,
      ipunta: dataIncremento?.mhorapunta || 0,
      icentral: dataIncremento?.mcentral || 0,
      dvalle: dataIncremento?.mhvalle || 0,
      dappweb: dataIncremento?.mappweb || 0,
      total: tarifaFinal,
      automatico: false,
      comunidad: false,
      distancia: tempArray.reduce((acc, curr) => acc + (curr.dist || 0), 0),
      tiempo: tempArray.reduce((acc, curr) => acc + (curr.tiempo || 0), 0),
      dorigen: truta[0]?.direccion || "",
      zorigen: tempArray[0]?.zona || "",
      latorigen: tempArray[0]?.lat || 0,
      lonorigen: tempArray[0]?.lng || 0,
      ddestino: truta[truta.length - 1]?.direccion || "",
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

    // Log del postBody real enviado
    console.log('📋 POST Body completo:', JSON.stringify(postBody, null, 2));
    console.log('🔍 IDs calculados:', {
      idcentrocostos: dataConfiguracion.idcentrocostos ? getCentroCostosId(centrocostosValue) : 0,
      idarea: dataConfiguracion.idarea ? getAreaId(areaValue) : 0,
      idmotivo: dataConfiguracion.idmotsol ? getMotivoId(motivoValue) : 0,
      idmovil: getMovilId(tipomovil)
    });
    console.log('📋 Configuración de campos obligatorios:', {
      idcentrocostos_obligatorio: dataConfiguracion.idcentrocostos,
      idarea_obligatorio: dataConfiguracion.idarea,
      idmotsol_obligatorio: dataConfiguracion.idmotsol
    });
    console.log('📝 Valores enviados:', {
      centrocostos: centrocostosValue,
      area: areaValue,
      motivo: motivoValue
    });

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

      console.log('✅ Respuesta del API:', response.data);

      if (response.data && response.data.estatus === 200) {
        setProgress(false);
        notifySuccess(`Registro exitoso. Id de reserva: ${response.data.idreserva}`);

        // Reiniciar completamente el formulario
        setOrigin('');
        setDestination('');
        setHora('');
        setFecha('');
        setObservaciones('');
        setTipopago(dataPago[0]?.tpago || '');
        setTipomovil(dataMovil[0]?.destipomovil || '');
        setArea(dataPersonal.area || '');
        setCentrocostos(dataPersonal.centrocostos || '');
        setMotivo('');
        setDetalle('');
        setFare(0);
        setTempArray([]);
        setMarkers([]);
        setAdditionalDestinations([]);
        setShowFarePreview(false);

        // Limpiar sugerencias
        locationHook.setOriginSuggestions([]);
        locationHook.setDestinationSuggestions([]);

        // Limpiar botones de favoritos
        favoritesHook.setShowAddFavorite({});

        // Actualizar fecha y hora con la actual
        const now = new Date();
        setFecha(now.toISOString().slice(0, 10));
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        setHora(`${hours}:${minutes}`);

        // Limpiar campos de usuario si es para otro usuario
        setParami('');
        setUsuario('');
        setTelefono('');

        // Limpiar zona
        setZona('');

      } else {
        console.error('❌ Respuesta del API no exitosa:', response.data);
        notifyError(`Error al enviar solicitud: ${response.data?.message || 'Respuesta inválida del servidor'}`);
      }
    } catch (error) {
      console.error('❌ Error al enviar solicitud:', error);
      console.error('❌ Detalles del error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      console.error('❌ Datos enviados:', postBody);
      notifyError(`Error al enviar solicitud: ${error.response?.data?.message || error.message}`);
    }
  }, [dataConfiguracion, dataCentroCostos, dataArea, dataMotivo, dataPersonal, idpersonal, idcliente, tempArray, hora, observaciones, idempresa, dataPago, dataMovil, getMovilId, dataIncremento, origin, destination, parami, dataPersonalo, usuario, key, baseUrl]);

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

  // Efecto para inicializar datos del formulario
  useEffect(() => {
    if (dataPago.length > 0) {
      setTipopago(dataPago[0].tpago);
    }
    if (dataMovil.length > 0) {
      setTipomovil(dataMovil[0].destipomovil);
    }
    if (dataPersonal && Object.keys(dataPersonal).length > 0) {
      setArea(dataPersonal.area || '');
      setCentrocostos(prev => prev ? prev : (dataPersonal.centrocostos || ''));
    }

    const now = new Date();
    setFecha(now.toISOString().slice(0, 10));

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setHora(`${hours}:${minutes}`);
  }, [dataPersonal, dataPago, dataMovil]);

  // Efecto para cargar datos iniciales (solo una vez)
  useEffect(() => {
    dataSolicitante();
    favoritesHook.loadFavorites();
  }, []); // Sin dependencias para que solo se ejecute una vez

  // Limpiar campos de crédito si cambia el tipo de pago a uno que no sea 'Credito'
  useEffect(() => {
    if (tipopago !== 'Credito') {
      setArea('');
      setCentrocostos('');
      setMotivo('');
      setDetalle('');
    }
    // Si vuelve a 'Credito', no limpiar, solo dejar los campos como estén
  }, [tipopago]);

  // ----------------- Renderizado del Componente -----------------
  return (
    <div className='page-request'>
      {progress && (
        <Box className='box-progress'>
          <CircularProgress color="primary" size="3rem" />
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
            {favoritesHook.showAddFavorite['origin'] && (
              <Button
                className="button-remove-route input-directions"
                label={<TbFlagHeart className="icon-favorite" />}
                onClick={() => favoritesHook.addFavorite('origin', tempArray)}
              />
            )}
            <Input
              type='text'
              placeholder="Av. Prolongacion Iquitos 2291, Lince"
              value={origin}
              onFocus={() => setCurrentInput('origin')}
              onClick={() => setCurrentInput('origin')}
              onChange={handleOriginChange}
            />
            {locationHook.originSuggestions.length > 0 && (
              <ul className="suggestions-origen">
                {locationHook.originSuggestions.map((suggestion, index) => (
                  <li key={index} onClick={() =>
                    locationHook.handleSelectSuggestion(
                      suggestion,
                      true,
                      null,
                      setOrigin,
                      setDestination,
                      setAdditionalDestinations,
                      locationHook.setOriginSuggestions,
                      locationHook.setDestinationSuggestions,
                      tempArray,
                      setTempArray,
                      markers,
                      setMarkers,
                      reorderMarkers,
                      markForTariffRecalculation,
                      favoritesHook.favorites,
                      favoritesHook.updateFavoriteButton
                    )
                  }>
                    {`${suggestion.direccion}, ${suggestion.distrito}`}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <label style={{ marginBottom: '-8px' }}>Dirección destino</label>
          <div className="box-destination-request">
            {favoritesHook.showAddFavorite['destination'] && (
              <Button
                className="button-remove-route input-directions"
                label={<TbFlagHeart className="icon-favorite" />}
                onClick={() => favoritesHook.addFavorite('destination', tempArray)}
              />
            )}
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
            {locationHook.destinationSuggestions.length > 0 && (
              <ul className="suggestions-destination">
                {locationHook.destinationSuggestions.map((suggestion, index) => (
                  <li key={index} onClick={() =>
                    locationHook.handleSelectSuggestion(
                      suggestion,
                      false,
                      null,
                      setOrigin,
                      setDestination,
                      setAdditionalDestinations,
                      locationHook.setOriginSuggestions,
                      locationHook.setDestinationSuggestions,
                      tempArray,
                      setTempArray,
                      markers,
                      setMarkers,
                      reorderMarkers,
                      markForTariffRecalculation,
                      favoritesHook.favorites,
                      favoritesHook.updateFavoriteButton
                    )
                  }>
                    {`${suggestion.direccion}, ${suggestion.distrito}`}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {additionalDestinations.map((dest, index) => (
            <div key={index} className="additional-destination">
              {favoritesHook.showAddFavorite[`additional-${index}`] && (
                <Button
                  className="button-remove-route input-directions"
                  label={<TbFlagHeart className="icon-favorite" />}
                  onClick={() => favoritesHook.addFavorite(`additional-${index}`, tempArray)}
                />
              )}
              <div className='box-directions-button'>
                <Input
                  ref={el => additionalInputRefs.current[`additional-${index}`] = el}
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
                    <li key={i} onClick={() =>
                      locationHook.handleSelectSuggestion(
                        suggestion,
                        false,
                        index,
                        setOrigin,
                        setDestination,
                        setAdditionalDestinations,
                        locationHook.setOriginSuggestions,
                        locationHook.setDestinationSuggestions,
                        tempArray,
                        setTempArray,
                        markers,
                        setMarkers,
                        reorderMarkers,
                        markForTariffRecalculation,
                        favoritesHook.favorites,
                        favoritesHook.updateFavoriteButton
                      )
                    }>
                      {`${suggestion.direccion}, ${suggestion.distrito}`}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          <div className='box-favorite'>
            {favoritesHook.favorites.map((fav, i) => (
              <div key={i} className='button-favorite'>
                <button
                  type="button"
                  onMouseDown={e => {
                    e.preventDefault();
                    favoritesHook.useFavorite(
                      fav,
                      currentInput,
                      tempArray,
                      setTempArray,
                      markers,
                      setMarkers,
                      setOrigin,
                      setDestination,
                      setAdditionalDestinations,
                      locationHook.fetchZone,
                      reorderMarkers,
                      markForTariffRecalculation
                    );
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
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
            <div className='request'>
              <label>Hora</label>
              <Input
                type='time'
                value={hora}
                onChange={(e) => setHora(e.target.value)}
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
                onChange={(e) => setTipopago(e.target.value)}
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
                onChange={(e) => setTipomovil(e.target.value)}
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
                    onChange={(e) => {
                      const value = e.target.value;
                      setArea(value);
                      // Buscar y mostrar el ID del área seleccionada
                      const areaSeleccionada = dataArea.find(item => item.area === value);
                      if (areaSeleccionada) {
                        console.log('✅ Área seleccionada:', {
                          area: areaSeleccionada.area,
                          idarea: areaSeleccionada.idarea
                        });
                      } else {
                        console.log('⚠️ Área no encontrada en la lista:', value);
                      }
                    }}
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
                    onChange={(e) => {
                      const value = e.target.value;
                      console.log('📝 Centro de costos cambiando a:', value);
                      setCentrocostos(value);

                      // Buscar y mostrar el ID del centro de costos seleccionado
                      const centroCostoSeleccionado = dataCentroCostos.find(item => item.centrocostos === value);
                      if (centroCostoSeleccionado) {
                        console.log('✅ Centro de costos seleccionado:', {
                          centrocostos: centroCostoSeleccionado.centrocostos,
                          idcentrocostos: centroCostoSeleccionado.idcentrocostos
                        });
                      } else {
                        console.log('⚠️ Centro de costos no encontrado en la lista:', value);
                      }
                    }}
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
                    onChange={(e) => {
                      const value = e.target.value;
                      setMotivo(value);
                      // Buscar y mostrar el ID del motivo seleccionado
                      const motivoSeleccionado = dataMotivo.find(item => item.motivosolicitud === value);
                      if (motivoSeleccionado) {
                        console.log('✅ Motivo seleccionado:', {
                          motivo: motivoSeleccionado.motivosolicitud,
                          idmotivo: motivoSeleccionado.idmotivosolicitud
                        });
                      } else {
                        console.log('⚠️ Motivo no encontrado en la lista:', value);
                      }
                    }}
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
            <Button label="Solicitar Servicio" onClick={handleSolicitarServicio} />
          </div>
        </div>
      </div>
      <ModalFavorite
        showModalFavorite={favoritesHook.showModalFavorite}
        closeModal={favoritesHook.closeModal}
        favoritoSeleccionado={favoritesHook.favoriteToEdit}
        condicion={favoritesHook.modalCondicion}
        apiprincipal={() => favoritesHook.loadFavorites(true, setProgress)}
      />
      <ModalTarifaConfirmacion
        show={showModalTarifaConfirmacion}
        onClose={() => setShowModalTarifaConfirmacion(false)}
        fare={tarifaPendiente || 0}
        onAccept={() => {
          setShowModalTarifaConfirmacion(false);
          if (datosPendientes) {
            sendServiceRequest(
              tarifaPendiente,
              datosPendientes.centrocostos,
              datosPendientes.area,
              datosPendientes.motivo,
              datosPendientes.detalle,
              datosPendientes.tipopago
            );
          }
        }}
      />
    </div>
  );
};

export default Request;