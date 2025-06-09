import React, { useState, useCallback, useEffect } from 'react';
import Button from '../common/Button-login.js';
import axios from 'axios';
import GoogleMaps from '../layout/GoogleMaps';
import { IoFlagOutline, IoFlag } from "react-icons/io5";
import { formatearFecha } from '../../utils/utils';
import './tracking.css';
import background from '../image/background Intranet.png';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';

// Esquema Yup para validar un string de 4 dígitos
const codeSchema = Yup.object().shape({
    code: Yup.string()
        .matches(/^\d{4}$/, "El código debe tener 4 dígitos")
        .required("El código es requerido")
});

const Tracking = () => {
    const baseUrl = process.env.REACT_APP_BASE_URL?.replace(/\/?$/, "/") || "";

    const [tracking, setTracking] = useState(false);
    const [verified, setVerified] = useState(true);
    const [initialLoad, setInitialLoad] = useState(true);
    const [oServicio, setOServicio] = useState({});
    const [aRuta, setARuta] = useState([]);
    const [oAsociado, setOAsociado] = useState({});
    const [oVehiculo, setOVehiculo] = useState({});
    const [asociadoMarker, setAsociadoMarker] = useState(null);

    const currentUrl = new URL(window.location.href);
    const token = currentUrl.searchParams.get('key');

    // Configuración de react-hook-form
    const {
        register,
        handleSubmit,
        formState: { errors },
        setError
    } = useForm({
        resolver: yupResolver(codeSchema)
    });

    // Función que obtiene el tracking y decide si parar el polling
    const obtenerTracking = useCallback(async () => {
        try {
            const { data } = await axios.get(`${baseUrl}api/IntranetApp/Tracking`, {
                params: { key: token }
            });
            if (data.estatus === 200) {
                const { OServicio, ARuta, OAsociados, OAsociadosu, OVehiculo } = data;
                setOServicio(OServicio);
                setARuta(ARuta);
                setOAsociado(OAsociados);
                setOVehiculo(OVehiculo);

                const { latasoc, latlong, angulo } = OAsociadosu;
                if (latasoc && latlong) {
                    setAsociadoMarker({
                        lat: latasoc,
                        lng: latlong,
                        type: 'image',
                        angle: angulo,
                        id: 'asociado-current'
                    });
                }
                return [16, 17, 18].includes(OServicio.idestado);
            }
            return false;
        } catch (err) {
            console.error(err);
            return false;
        } finally {
            if (initialLoad) setInitialLoad(false);
        }
    }, [baseUrl, token, initialLoad]);

    // Polling en useEffect
    useEffect(() => {
        if (!tracking || !token) return;
        let intervalId;
        (async () => {
            const stop = await obtenerTracking();
            if (!stop) {
                intervalId = setInterval(async () => {
                    if (await obtenerTracking()) clearInterval(intervalId);
                }, 5000);
            }
        })();
        return () => clearInterval(intervalId);
    }, [tracking, token, obtenerTracking]);

    // Función de validación, recibe { code } desde react-hook-form
    const validarTracking = async ({ code }) => {
        try {
            const { data } = await axios.post(`${baseUrl}api/IntranetApp/Validatracking`, {
                cservicio: token,
                cseguridad: code
            });
            if (data.estatus === 200) {
                setVerified(false);
                setTracking(true);
            } else {
                // alert(data.message);
                setError('code', { type: 'server', message: data.message });
            }
        } catch (err) {
            // console.error(err);
            // alert('Error al validar el código');
            setError('code', {
                type: 'server',
                message: err.response?.data?.message || 'Error al validar el código'
            });
        }
    };

    // Construcción de marcadores para el mapa
    const rutaMarkers = aRuta.map(ruta => ({
        lat: ruta.latitude,
        lng: ruta.longitude,
        type: 'circle',
        number: ruta.item,
        direccion: ruta.direccion,
        id: `ruta-${ruta.item}`
    }));
    const markers = asociadoMarker ? [...rutaMarkers, asociadoMarker] : rutaMarkers;

    return (
        <>
            {verified ? (
                <div className='verified'>
                    <div className='background'>
                        <img src={background} className='img-background-tracking' alt='Background tracking' />
                        <div className='filter-background'></div>
                    </div>
                    <div className='box-verified'>
                        <p>Por favor, ingresa el código de seguridad.</p>
                        <form
                            style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '16px' }}
                            onSubmit={handleSubmit(validarTracking)}
                        >
                            <input
                                type="text"
                                className='box-code'
                                placeholder='Ejm. 1234'
                                maxLength={4}
                                {...register('code')}
                            />
                            {errors.code && (
                                <p className="message error">{errors.code.message}</p>
                            )}
                            <Button label="Validar" type="submit" />
                        </form>
                    </div>
                </div>
            ) : (
                tracking && (
                    <div className='modal'>
                        {Object.keys(oServicio).length > 0 ? (
                            <div className='box-tracking-web'>
                                {/* Se usa handleCloseModal para limpiar los estados antes de cerrar */}
                                <div className='content-data-tracking'>
                                    {oServicio && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <h3
                                                style={{ fontWeight: '600', textAlign: 'center' }}
                                                className={
                                                    oServicio.idestado === 9 ? 'status-pendiente' :
                                                        oServicio.idestado === 12 ? 'status-camino-al-servicio' :
                                                            oServicio.idestado === 13 ? 'status-en-el-punto' :
                                                                oServicio.idestado === 14 ? 'status-usuario-contactado' :
                                                                    oServicio.idestado === 15 ? 'status-en-proceso' :
                                                                        oServicio.idestado === 19 ? 'status-preasignado' :
                                                                            oServicio.idestado === 20 ? 'status-preasignado' :
                                                                                oServicio.idestado === 21 ? 'status-preasignado' : ''
                                                }
                                            >
                                                {oServicio.estadoreserva}
                                            </h3>
                                            <h5 style={{ fontWeight: '600', textAlign: 'center' }}>#{oServicio.idreserva}</h5>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <h6 style={{ fontWeight: '600' }}>{formatearFecha(oServicio.fechareserva)}</h6>
                                                <h6 style={{ fontWeight: '600' }}>{oServicio.horareserva}</h6>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <h6 style={{ fontWeight: '600' }}>{oServicio.tipopago}</h6>
                                                {/* <h6 style={{ fontWeight: '600' }}>{oServicio.montofinalservicio}</h6> */}
                                            </div>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} >
                                        <h6 style={{ fontWeight: '600' }}>Detalle ruta</h6>
                                        {aRuta.map((ruta) => (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} key={ruta.item}>
                                                {ruta.item === 1 ? <p><IoFlagOutline /> Origen</p> : <p><IoFlag /> Destino</p>}
                                                <p>{ruta.direccion}</p>
                                            </div>
                                        ))}
                                    </div>
                                    {(oServicio.idestado === 12 || oServicio.idestado === 13 || oServicio.idestado === 14 || oServicio.idestado === 15 || oServicio.idestado === 19) && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {oAsociado.nombres !== '' ? (
                                                <>
                                                    <h6 style={{ fontWeight: '600' }}>Detalle conductor</h6>
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        <img src={oAsociado.imaasoc} alt='Conductor' className='imagen-conductor' />
                                                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                                            <h6 style={{ fontWeight: '600' }}>{oAsociado.apellidos} {oAsociado.nombres}</h6>
                                                            <p>{oAsociado.telefonop}</p>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : ''}
                                            {oVehiculo.marca !== '' ? (
                                                <>
                                                    <h6 style={{ fontWeight: '600' }}>Detalle vehículo</h6>
                                                    <div>
                                                        <h5>{oVehiculo.nplaca}</h5>
                                                        <p>{oVehiculo.marca} {oVehiculo.modelo} {oVehiculo.color} {oVehiculo.año}</p>
                                                        {/* <p>{oVehiculo.color} {oVehiculo.año}</p> */}
                                                    </div>
                                                </>
                                            ) : ''}
                                        </div>
                                    )}
                                </div>
                                <GoogleMaps markers={markers} />
                            </div>
                        ) : (    // CONTENIDO CUANDO oServicio está vacío
                            <div className="no-tracking-data">
                                <img src={background} className='img-404' alt='Sin contenido'></img>
                                <div className='texto-404'>
                                    <h1>No hay datos de servicio disponibles.</h1>
                                    <h4>Verifica que tengas una reserva activa o vuelve a intentarlo más tarde.</h4>
                                </div>
                            </div>
                        )
                        }
                    </div >
                )
            )}
        </>
    );
};

export default Tracking;