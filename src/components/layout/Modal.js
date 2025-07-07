import React, { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import GoogleMaps from '../layout/GoogleMaps';
import * as XLSX from 'xlsx';
import axios from 'axios'
import Input from '../common/Input';
import Button from '../common/Button';
import Select from '../common/Select';
import logo from '../image/192x192_2.png'
import { TbPlus, TbMinus } from "react-icons/tb";
import { notifySuccess, notifyError } from '../../utils/ToastifyComponent'
import { TbXboxX, TbArrowBigDownLineFilled } from "react-icons/tb";
import { IoFlagOutline, IoFlag } from "react-icons/io5";
import { formatearFecha } from '../../utils/utils';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './modal.css'

const idpersonal = localStorage.getItem('idpersonal');
const idcliente = localStorage.getItem('idcliente');

const ModalCancel = ({ showModalServiceDelete, closeModal, idreserva, apiprincipal }) => {
    const baseUrl = process.env.REACT_APP_BASE_URL?.replace(/\/?$/, "/") || "";

    const [progress, setProgress] = useState(false);
    const [tipoCancel, setTipoCancel] = useState('')
    const [dataCancel, setDataCancel] = useState([])
    const [observacion, setObservacion] = useState('')

    const serviceCancel = useCallback(async () => {
        try {
            const responseCancel = await axios.get(`${baseUrl}api/IntranetApp/Cancelar`, {
                params: { idempresas: 0 },
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('key')
                }
            })

            if (responseCancel.data.estatus === 200) {
                setDataCancel(responseCancel.data.ACancelar)
            } else {
                console.error('Error en la respuesta:', responseCancel.data.message)
            }
        } catch (error) {
            console.error("Error al obtener datos de cancelación:", error)
        }
    }, [baseUrl])

    useEffect(() => {
        if (showModalServiceDelete && idreserva) {
            serviceCancel()
        }
    }, [showModalServiceDelete, idreserva, serviceCancel])

    const handleCancelService = async () => {
        setProgress(true)
        const body = {
            idreserva: idreserva,
            tipo: "Cliente",
            motivo: tipoCancel, //aca selecciona de los items
            observaciones: observacion, // aca de la caja de observaciones
            agente: "Intranet",
            ipregistro: "0.0.0.0",
            idempresas: 0
        }

        try {
            const responseCancelService = await axios.post(`${baseUrl}api/IntranetApp/Cancelarp`,
                body, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('key')
                }
            })
            if (responseCancelService.data.estatus === 200) {
                // alert(responseCancelService.data.message)
                apiprincipal()
                setTipoCancel('')
                setObservacion('')
                notifySuccess('Servicio cancelado')
            } else {
                notifyError('Error al cancelar el servicio')
            }
        } catch (error) {
            notifyError('Error al cancelar el servicio')
        } finally {
            setProgress(false)
            closeModal()
        }
    }

    if (!showModalServiceDelete) return null;

    return (
        <div className='modal'>
            {progress && (
                <Box className='box-progress'>
                    <CircularProgress color="primary" size="3rem" />
                </Box>
            )}
            <div className='box-modal'>
                <div className='box-title-modal'>
                    <h4>¿Estás seguro que deseas cancelar el servicio?</h4>
                    <TbXboxX className='close-modal' style={{ fontSize: '24' }} onClick={closeModal} />
                </div>
                <h6>Por favor, selecciona el motivo de cancelación</h6>
                <select className='select-modal' name="cancel" value={tipoCancel} onChange={(e) => setTipoCancel(e.target.value)}>
                    {dataCancel.map((cancel) => (
                        <option key={cancel.cancelacion} value={cancel.cancelacion}>{cancel.cancelacion}</option>
                    ))}
                </select>
                <textarea value={observacion} onChange={(e) => setObservacion(e.target.value)} placeholder='Por favor, ingresa el motivo de cancelación'>
                </textarea>
                <button className='button-modal action-red' onClick={handleCancelService}>Cancelar</button>
            </div>
        </div>
    )
}

const schemaPersonal = Yup.object().shape({
    tipo: Yup.string().required('Tipo de documento es requerido'),
    ndocumento: Yup.string().required('Número de documento es requerido'),
    apellidos: Yup.string().required('Apellidos es requerido'),
    nombres: Yup.string().required('Nombres es requerido'),
    telefonop: Yup.string().required('Teléfono principal es requerido'),
    email: Yup.string().email('Correo inválido').required('Correo es requerido'),
    codigo: Yup.string(),
    emailv: Yup.string().email('Correo verificador inválido'),
    cargo: Yup.string().required('Cargo es requerido'),
    tipopersonal: Yup.string().required('Tipo de personal es requerido'),
    jefe: Yup.string().required('Jefe es requerido'),
    centrocostos: Yup.string().required('Centro de costos es requerido'),
    area: Yup.string().required('Área es requerida'),
    observaciones: Yup.string(),
    psolicitante: Yup.boolean(),
    pautorizado: Yup.boolean(),
    pjefe: Yup.boolean(),
    vservicio: Yup.boolean(),
    scredito: Yup.boolean(),
    administrador: Yup.boolean()
});

const ModalPersonal = ({ showModalPersonal, closeModal, personalSeleccionado, apiprincipal }) => {
    const baseUrl = process.env.REACT_APP_BASE_URL?.replace(/\/?$/, "/") || "";
    const idcliente = localStorage.getItem('idcliente');

    const defaultValues = {
        tipo: '',
        ndocumento: '',
        apellidos: '',
        nombres: '',
        telefonop: '',
        telefonos: '',
        email: '',
        codigo: '',
        emailv: '',
        cargo: '',
        tipopersonal: '',
        jefe: '',
        centrocostos: '',
        area: '',
        observaciones: '',
        psolicitante: false,
        pautorizado: false,
        pjefe: false,
        vservicio: false,
        scredito: false,
        administrador: false
    }

    // Configuración de react-hook-form con Yup
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: yupResolver(schemaPersonal),
        defaultValues
    });

    // Función para cerrar el modal y resetear el formulario
    const handleCloseModal = () => {
        closeModal();
        reset(defaultValues);
    };


    const [progress, setProgress] = useState(false);
    const [dataJefe, setDataJefe] = useState([]);
    const [dataArea, setDataArea] = useState([]);
    const [dataCentroCostos, setDataCentroCostos] = useState([]);

    const ListJefeCCArea = useCallback(async () => {
        try {
            const responseList = await axios.get(`${baseUrl}api/IntranetApp/PersonalJefeccarea`, {
                params: { idempresas: 0, idcliente, condicion: 1 },
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('key')
                }
            });
            if (responseList.data.estatus === 200) {
                setDataJefe(responseList.data.AJefe);
                setDataArea(responseList.data.AArea);
                setDataCentroCostos(responseList.data.ACentrocostos);
            }
        } catch (error) {
            // Manejo de error si es necesario
        }
    }, [baseUrl, idcliente]);

    useEffect(() => {
        if (showModalPersonal) {
            ListJefeCCArea();
            // Si se está editando, se precargan los valores; si no, se resetea el formulario.
            if (personalSeleccionado) {
                reset({
                    tipo: personalSeleccionado.tipodocumento || '',
                    ndocumento: personalSeleccionado.dni || '',
                    apellidos: personalSeleccionado.apellidos || '',
                    nombres: personalSeleccionado.nombres || '',
                    telefonop: personalSeleccionado.telefonoprincipal || '',
                    telefonos: personalSeleccionado.telefonosecundario || '',
                    email: personalSeleccionado.email || '',
                    codigo: personalSeleccionado.codigo || '',
                    emailv: personalSeleccionado.emailverificador || '',
                    cargo: personalSeleccionado.cargo || '',
                    tipopersonal: personalSeleccionado.tipopersonal || '',
                    jefe: personalSeleccionado.datjefe || '',
                    centrocostos: personalSeleccionado.centrocostos || '',
                    area: personalSeleccionado.area || '',
                    observaciones: personalSeleccionado.observaciones || '',
                    psolicitante: personalSeleccionado.idpersonalsolicitante || false,
                    pautorizado: personalSeleccionado.idpersonalautorizado || false,
                    pjefe: personalSeleccionado.idpersonaljefe || false,
                    vservicio: personalSeleccionado.idvalidaservicio || false,
                    scredito: personalSeleccionado.servcredito || false,
                    administrador: personalSeleccionado.administrador || false
                });
            } else {
                reset();
            }
        }
    }, [showModalPersonal, personalSeleccionado, ListJefeCCArea, reset]);

    // Función para crear o editar personal usando los datos del formulario
    const createEditPersonal = async (formData) => {
        setProgress(true);

        // Buscar jefe seleccionado
        const jefeSeleccionado = dataJefe.find(item => item.datjefe === formData.jefe);
        const idJefe = jefeSeleccionado ? jefeSeleccionado.idpersonalempresa : 0;

        // Buscar centro de costos seleccionado
        const centroCostosSeleccionado = dataCentroCostos.find(item => item.centrocostos === formData.centrocostos);
        const idCentroCostos = centroCostosSeleccionado ? centroCostosSeleccionado.idcentrocostosconfiguracion : 0;

        // Buscar área seleccionada
        const areaSeleccionada = dataArea.find(item => item.area === formData.area);
        const idArea = areaSeleccionada ? areaSeleccionada.idareaconfiguracion : 0;

        const body = {
            idpersonal: personalSeleccionado?.idpersonalempresa || 0,
            idcliente: idcliente,
            idempresas: 0,
            idgrupoempresa: 0,
            tipo: formData.tipo,
            ndocumento: formData.ndocumento,
            apellidos: formData.apellidos,
            nombres: formData.nombres,
            telefonop: formData.telefonop,
            telefonos: formData.telefonos,
            email: formData.email,
            codigo: formData.codigo,
            emailv: formData.emailv,
            perfil: "Solicitante",
            cargo: formData.cargo,
            tipopersonal: formData.tipopersonal,
            idjefe: idJefe,
            datjefe: formData.jefe,
            idcentrocostos: idCentroCostos,
            centrocostos: formData.centrocostos,
            idarea: idArea,
            area: formData.area,
            psolicitante: formData.psolicitante,
            pautorizado: formData.pautorizado,
            pjefe: formData.pjefe,
            vservicio: formData.vservicio,
            tipomovil: false,
            scredito: formData.scredito,
            solicitud: false,
            administrador: formData.administrador,
            condicion: true,
            observaciones: formData.observaciones,
            agenteregistro: "Intranet",
            ipregistro: "0.0.0.0"
        };

        try {
            const responsePersonal = await axios.post(`${baseUrl}api/IntranetApp/Personalregistroactualiza`, body, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('key')
                }
            });
            if (responsePersonal.data.estatus === 200) {
                // Se asume que notifySuccess y notifyError están definidos
                apiprincipal()
                notifySuccess(personalSeleccionado?.idpersonalempresa ? 'Registro actualizado correctamente' : 'Registro creado correctamente');
            } else {
                notifyError(personalSeleccionado?.idpersonalempresa ? 'Error al actualizar registro' : 'Error al crear registro');
            }
        } catch (error) {
            notifyError(personalSeleccionado?.idpersonalempresa ? 'Error al actualizar registro' : 'Error al crear registro');
        } finally {
            setProgress(false);
            closeModal();
            reset(defaultValues)
        }
    };

    const onSubmit = (data) => {
        createEditPersonal(data);
    };

    if (!showModalPersonal) return null;

    return (
        <div className='modal'>
            {progress && (
                <Box className='box-progress'>
                    <CircularProgress color="primary" size="3rem" />
                </Box>
            )}
            <div className='box-modal'>
                <div className='box-title-modal'>
                    {personalSeleccionado?.idpersonalempresa ? (
                        <h4>Editar personal</h4>
                    ) : (
                        <h4>Crear personal</h4>
                    )}
                    <TbXboxX className='close-modal' style={{ fontSize: '24px' }} onClick={handleCloseModal} />
                </div>
                <form className='content-personal' onSubmit={handleSubmit(onSubmit)}>
                    <div className='box-personal'>
                        <div className='box-input'>
                            <label>Tipo de documento</label>
                            <input
                                type='text'
                                list='tipodocumento'
                                placeholder="ejm. DNI"
                                {...register("tipo")}
                                className='input input-personal'
                            />
                            <datalist id="tipodocumento">
                                <option value="DNI" />
                                <option value="Carnet de extranjería" />
                                <option value="Pasaporte" />
                            </datalist>
                            {errors.tipo && <p className="message error">{errors.tipo.message}</p>}
                        </div>
                        <div className='box-input'>
                            <label>Número documento</label>
                            <input
                                type='number'
                                placeholder="ejm. 73048751"
                                {...register("ndocumento")}
                                className='input input-personal'
                            />
                            {errors.ndocumento && <p className="message error">{errors.ndocumento.message}</p>}
                        </div>
                    </div>
                    <div className='box-personal'>
                        <div className='box-input'>
                            <label>Apellidos</label>
                            <input
                                type='text'
                                placeholder="ejm. Perez"
                                {...register("apellidos")}
                                className='input input-personal'
                            />
                            {errors.apellidos && <p className="message error">{errors.apellidos.message}</p>}
                        </div>
                        <div className='box-input'>
                            <label>Nombres</label>
                            <input
                                type='text'
                                placeholder="ejm. Juan José"
                                {...register("nombres")}
                                className='input input-personal'
                            />
                            {errors.nombres && <p className="message error">{errors.nombres.message}</p>}
                        </div>
                    </div>
                    <div className='box-personal'>
                        <div className='box-input'>
                            <label>Teléfono principal</label>
                            <input
                                type='tel'
                                placeholder="ejm. 987451257"
                                {...register("telefonop")}
                                className='input input-personal'
                            />
                            {errors.telefonop && <p className="message error">{errors.telefonop.message}</p>}
                        </div>
                        <div className='box-input'>
                            <label>Teléfono secundario</label>
                            <input
                                type='tel'
                                placeholder="ejm. 985471526"
                                {...register("telefonos")}
                                className='input input-personal'
                            />
                        </div>
                    </div>
                    <div className='box-personal'>
                        <div className='box-input'>
                            <label>Correo</label>
                            <input
                                type='email'
                                placeholder="ejm. jperez@gmail.com"
                                {...register("email")}
                                className='input input-personal'
                            />
                            {errors.email && <p className="message error">{errors.email.message}</p>}
                        </div>
                        <div className='box-input'>
                            <label>Código interno</label>
                            <input
                                type='number'
                                placeholder="ejm. 300487"
                                {...register("codigo")}
                                className='input input-personal'
                            />
                            {errors.codigo && <p className="message error">{errors.codigo.message}</p>}
                        </div>
                    </div>
                    <div className='box-personal'>
                        <div className='box-input'>
                            <label>Correo verificador</label>
                            <input
                                type='email'
                                placeholder="ejm. jefe@gmail.com"
                                {...register("emailv")}
                                className='input input-personal'
                            />
                            {errors.emailv && <p className="message error">{errors.emailv.message}</p>}
                        </div>
                        <div className='box-input'>
                            <label>Cargo</label>
                            <input
                                type='text'
                                placeholder="ejm. Operador"
                                {...register("cargo")}
                                className='input input-personal'
                            />
                            {errors.cargo && <p className="message error">{errors.cargo.message}</p>}
                        </div>
                    </div>
                    <div className='box-personal'>
                        <div className='box-input'>
                            <label>Tipo de personal</label>
                            <input
                                type='text'
                                list='tipopersonal'
                                placeholder="ejm. Personal empresa"
                                {...register("tipopersonal")}
                                className='input input-personal'
                            />
                            <datalist id="tipopersonal">
                                <option value="Personal invitado" />
                                <option value="Personal empresa" />
                            </datalist>
                            {errors.tipopersonal && <p className="message error">{errors.tipopersonal.message}</p>}
                        </div>
                        <div className='box-input'>
                            <label>Jefe</label>
                            <input
                                type="text"
                                list="jefes"
                                placeholder="ejm. Alberto Rodriguez"
                                {...register("jefe")}
                                className='input input-personal'
                            />
                            <datalist id="jefes">
                                {dataJefe.map((jefe) => (
                                    <option key={jefe.idpersonalempresa} value={jefe.datjefe} />
                                ))}
                            </datalist>
                            {errors.jefe && <p className="message error">{errors.jefe.message}</p>}
                        </div>
                    </div>
                    <div className='box-personal'>
                        <div className='box-input'>
                            <label>Centro de costos</label>
                            <input
                                type='text'
                                list='centrocostos'
                                placeholder="ejm. OP001"
                                {...register("centrocostos")}
                                className='input input-personal'
                            />
                            <datalist id="centrocostos">
                                {dataCentroCostos.map((centrocosto) => (
                                    <option key={centrocosto.idcentrocostosconfiguracion} value={centrocosto.centrocostos} />
                                ))}
                            </datalist>
                            {errors.centrocostos && <p className="message error">{errors.centrocostos.message}</p>}
                        </div>
                        <div className='box-input'>
                            <label>Área</label>
                            <input
                                type="text"
                                list="areas"
                                placeholder="ejm. Operaciones"
                                {...register("area")}
                                className='input input-personal'
                            />
                            <datalist id="areas">
                                {dataArea.map((area) => (
                                    <option key={area.idareaconfiguracion} value={area.area} />
                                ))}
                            </datalist>
                            {errors.area && <p className="message error">{errors.area.message}</p>}
                        </div>
                    </div>
                    <div className='box-input'>
                        <label>Observaciones</label>
                        <textarea
                            placeholder='Escribe tus observaciones aquí...'
                            {...register("observaciones")}
                        />
                    </div>
                    <div className='box-permission'>
                        <div className='permission'>
                            <label>Solicitante</label>
                            <input type='checkbox' {...register("psolicitante")} />
                        </div>
                        <div className='permission'>
                            <label>Autorizado</label>
                            <input type='checkbox' {...register("pautorizado")} />
                        </div>
                        <div className='permission'>
                            <label>Jefe</label>
                            <input type='checkbox' {...register("pjefe")} />
                        </div>
                    </div>
                    <div className='box-permission'>
                        <div className='permission'>
                            <label>Valida servicio</label>
                            <input type='checkbox' {...register("vservicio")} />
                        </div>
                        <div className='permission'>
                            <label>Administrador</label>
                            <input type='checkbox' {...register("administrador")} />
                        </div>
                        <div className='permission'>
                            <label>Crédito</label>
                            <input type='checkbox' {...register("scredito")} />
                        </div>
                    </div>
                    <button className='button-modal action-green' type="submit">
                        {personalSeleccionado?.idpersonalempresa ? 'Actualizar' : 'Crear'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const ModalActDesact = ({ showModalActDesact, closeModal, tipo, item, id, nombre, apiprincipal }) => {
    const baseUrl = process.env.REACT_APP_BASE_URL?.replace(/\/?$/, "/") || "";
    const [progress, setProgress] = useState(false);

    const handleActDesact = async () => {
        const body = {
            tipo: tipo, // 1 es personal, 2 area,3 centro costos
            idproceso: id, // el id de personal, area, centro costos
            condicion: item.idcondicion ? false : true
        }

        // console.log(body)

        try {
            const responseActDesact = await axios.post(`${baseUrl}api/IntranetApp/Estadopersonalareacentrocostos`, body, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('key')}`
                }
            })

            if (responseActDesact.data.estatus === 200) {
                apiprincipal()
                notifySuccess('Cambio de estado realizado con éxito')
                // alert(responseActDesact.data.message);
            } else {
                notifyError('Error al cambiar estado')
            }
        } catch (error) {
            notifyError('Error al cambiar estado')
        } finally {
            setProgress(false);
            closeModal();
        }
    }

    if (!showModalActDesact) return null;

    return (
        <div className='modal'>
            {progress && (
                <Box className='box-progress'>
                    <CircularProgress color="primary" size="3rem" />
                </Box>
            )}
            <div className='box-modal'>
                <div className='box-title-modal'>
                    <h4>¿Estás seguro que deseas {item.idcondicion ? 'desactivar' : 'activar'} a {nombre || 'NO REGISTRA'}?</h4>
                    <TbXboxX className='close-modal' style={{ fontSize: '24' }} onClick={closeModal} />
                </div>
                <button className={`button-modal ${item.idcondicion ? 'action-red' : 'action-green'}`} onClick={() => handleActDesact()}>{item.idcondicion ? 'Desactivar' : 'Activar'}</button>
            </div>
        </div>
    )
}

const schemaCentroCosto = Yup.object().shape({
    centrocostos: Yup.string().required('Este campo es requerido'),
    observaciones: Yup.string(),
});

const ModalADCentroCosto = ({ showModalADCC, closeModal, item, apiprincipal }) => {
    const baseUrl = process.env.REACT_APP_BASE_URL?.replace(/\/?$/, "/") || "";
    const idcliente = localStorage.getItem('idcliente');

    // Valores por defecto del formulario
    const defaultValues = {
        idcentrocostos: '',
        centrocostos: '',
        observaciones: ''
    };

    // Configuración de react-hook-form con Yup
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: yupResolver(schemaCentroCosto),
        defaultValues
    });

    const [progress, setProgress] = useState(false);

    // Función para cerrar el modal y resetear el formulario
    const handleCloseModal = () => {
        reset(defaultValues);
        closeModal();
    };

    useEffect(() => {
        if (showModalADCC && item) {
            reset({
                idcentrocostos: item.idcentrocostosconfiguracion || '',
                centrocostos: item.centrocostos || 'NO REGISTRA',
                observaciones: item.observaciones || 'NO REGISTRA',
            });
        } else {
            reset(defaultValues);
        }
    }, [showModalADCC, item, reset]);

    // Función para enviar los datos (crear o editar)
    const handleAddEditCC = async (formData) => {
        setProgress(true);
        const body = {
            // Si no existe idcentrocostos, se envía 0 para crear
            idcentrocostos: formData.idcentrocostos || 0,
            idcliente: idcliente,
            centrocostos: formData.centrocostos,
            observaciones: formData.observaciones,
            // Si existe 'item', se usa su condición; si no, asumimos true
            condicion: item ? item.idcondicion : true,
            operador: "intranet",
            ipproceso: "0.0.0.0"
        };

        try {
            const responseAddEditCC = await axios.post(`${baseUrl}api/IntranetApp/Centrocostosregistroactualiza`, body, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('key')}`
                }
            });

            if (responseAddEditCC.data.estatus === 200) {
                notifySuccess(item ? 'Centro de costos actualizado' : 'Centro de costos creado');
                apiprincipal();
            } else {
                notifyError(item ? 'Error al actualizar centro de costos' : 'Error al crear centro de costos');
            }
        } catch (error) {
            notifyError(item ? 'Error al actualizar centro de costos' : 'Error al crear centro de costos');
        } finally {
            setProgress(false);
            closeModal();
        }
    };

    const onSubmit = (data) => {
        handleAddEditCC(data);
    };

    if (!showModalADCC) return null;

    return (
        <div className='modal'>
            {progress && (
                <Box className='box-progress'>
                    <CircularProgress color="primary" size="3rem" />
                </Box>
            )}
            <div className='box-modal'>
                <div className='box-title-modal'>
                    <h4>{item ? 'Editar centro de costos' : 'Crear centro de costo'}</h4>
                    <TbXboxX className='close-modal' style={{ fontSize: '24px' }} onClick={handleCloseModal} />
                </div>
                <form className='content-personal' onSubmit={handleSubmit(onSubmit)}>
                    <div className='box-input'>
                        <label>Nombre del centro de costos</label>
                        <input
                            style={{ width: '100%' }}
                            type='text'
                            placeholder='Nombre del centro de costos'
                            {...register("centrocostos")}
                            className='input input-personal'
                        />
                        {errors.centrocostos && <p className="message error">{errors.centrocostos.message}</p>}
                    </div>
                    <div className='box-input'>
                        <label>Observaciones</label>
                        <textarea
                            style={{ width: '100%', height: '80px' }}
                            placeholder='Escribe tus observaciones aquí...'
                            {...register("observaciones")}
                            className='input input-personal'
                        />
                        {errors.observaciones && <p className="message error">{errors.observaciones.message}</p>}
                    </div>
                    <button className='button-modal action-green' type="submit">
                        {item ? 'Actualizar' : 'Crear'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const schemaArea = Yup.object().shape({
    area: Yup.string().required('El nombre del área es requerido'),
    observaciones: Yup.string(),
});

const ModalADArea = ({ showModalADArea, closeModal, item, apiprincipal }) => {
    const baseUrl = process.env.REACT_APP_BASE_URL?.replace(/\/?$/, "/") || "";
    const idcliente = localStorage.getItem('idcliente');

    // Valores por defecto del formulario
    const defaultValues = {
        idarea: '',
        area: '',
        observaciones: '',
    };

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: yupResolver(schemaArea),
        defaultValues,
    });

    const [progress, setProgress] = useState(false);

    // Función para cerrar el modal y resetear el formulario
    const handleCloseModal = () => {
        reset(defaultValues);
        closeModal();
    };

    // Precargar los datos del área en caso de edición o limpiar para creación
    useEffect(() => {
        if (showModalADArea && item) {
            reset({
                idarea: item.idareaconfiguracion || '',
                area: item.area || '',
                observaciones: item.observaciones || '',
            });
        } else {
            reset(defaultValues);
        }
    }, [showModalADArea, item, reset]);

    // Función para crear o editar el área usando los datos del formulario
    const handleAddEditArea = async (formData) => {
        setProgress(true);
        const bodyArea = {
            idarea: formData.idarea || 0, // Si no existe, se envía 0 para crear
            idcliente: idcliente,
            area: formData.area,
            observaciones: formData.observaciones,
            // Se utiliza la condición del ítem en caso de edición, o se asume true para creación
            condicion: item ? item.idcondicion : true,
            operador: "intranet",
            ipproceso: "0.0.0.0"
        };

        try {
            const responseAddEditArea = await axios.post(
                `${baseUrl}api/IntranetApp/Arearegistroactualiza`,
                bodyArea,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('key')}`
                    }
                }
            );

            if (responseAddEditArea.data.estatus === 200) {
                notifySuccess(item ? 'Área actualizada' : 'Área creada');
                apiprincipal();
            } else {
                notifyError(item ? 'Error al actualizar área' : 'Error al crear área');
            }
        } catch (error) {
            notifyError(item ? 'Error al actualizar área' : 'Error al crear área');
        } finally {
            setProgress(false);
            closeModal();
        }
    };

    const onSubmit = (data) => {
        handleAddEditArea(data);
    };

    if (!showModalADArea) return null;

    return (
        <div className='modal'>
            {progress && (
                <Box className='box-progress'>
                    <CircularProgress color="primary" size="3rem" />
                </Box>
            )}
            <div className='box-modal'>
                <div className='box-title-modal'>
                    <h4>{item ? 'Editar área' : 'Crear área'}</h4>
                    <TbXboxX className='close-modal' style={{ fontSize: '24px' }} onClick={handleCloseModal} />
                </div>
                <form className='content-personal' onSubmit={handleSubmit(onSubmit)}>
                    <div className='box-input'>
                        <label>Nombre del área</label>
                        <input
                            style={{ width: '100%' }}
                            type='text'
                            placeholder='Nombre del área'
                            {...register("area")}
                            className='input input-personal'
                        />
                        {errors.area && <p className="message error">{errors.area.message}</p>}
                    </div>
                    <div className='box-input'>
                        <label>Observaciones</label>
                        <textarea
                            style={{ width: '100%', height: '80px' }}
                            placeholder='Escribe tus observaciones aquí...'
                            {...register("observaciones")}
                            className='input input-personal'
                        />
                        {errors.observaciones && <p className="message error">{errors.observaciones.message}</p>}
                    </div>
                    <button className='button-modal action-green' type="submit">
                        {item ? 'Actualizar' : 'Crear'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const ModalTracking = ({ showModalTracking, closeModal, token }) => {
    const baseUrl = process.env.REACT_APP_BASE_URL?.replace(/\/?$/, "/") || "";

    const [progress, setProgress] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const [oServicio, setOServicio] = useState({});
    const [aRuta, setARuta] = useState([]);
    const [oAsociado, setOAsociado] = useState({});
    const [oVehiculo, setOVehiculo] = useState({});
    const [aRecorridogps, setARecorridogps] = useState([]);
    const [asociadoMarker, setAsociadoMarker] = useState(null);

    const obtenerTracking = useCallback(async () => {
        if (initialLoad) {
            setProgress(true);
        }
        try {
            const response = await axios.get(`${baseUrl}api/IntranetApp/Trackings`, {
                params: { key: token }
            });

            if (response.data.estatus === 200) {
                setOServicio(response.data.OServicio);
                setARuta(response.data.ARuta);
                setOAsociado(response.data.OAsociados);
                setOVehiculo(response.data.OVehiculo);
                setARecorridogps(response.data.ARecorridogps);

                const { latasoc, latlong, angulo } = response.data.OAsociadosu;
                if (latasoc !== 0 && latlong !== 0) {
                    setAsociadoMarker({
                        lat: latasoc,
                        lng: latlong,
                        type: 'image',
                        angle: angulo,
                        id: 'asociado-current'
                    });
                }
                // Si idestado es 16, 17 o 18 se detiene el intervalo
                if (
                    response.data.OServicio.idestado === 16 ||
                    response.data.OServicio.idestado === 17 ||
                    response.data.OServicio.idestado === 18
                ) {
                    return { success: true, stopInterval: true };
                }
                return { success: true, stopInterval: false };
            } else {
                return { success: false, stopInterval: false };
            }
        } catch (error) {
            console.error(error);
            return { success: false, stopInterval: false };
        } finally {
            if (initialLoad) {
                setProgress(false);
                setInitialLoad(false);
            }
        }
    }, [baseUrl, token, initialLoad]);

    useEffect(() => {
        let intervalId;

        if (showModalTracking && token) {
            // Llamada inicial
            obtenerTracking().then((result) => {
                // Si la respuesta es exitosa y stopInterval es false, iniciamos el intervalo
                if (result.success && !result.stopInterval) {
                    intervalId = setInterval(() => {
                        obtenerTracking().then((res) => {
                            // Si en alguna llamada se cumple que idestado es 16, 17 o 18, se limpia el intervalo
                            if (res.stopInterval) {
                                clearInterval(intervalId);
                            }
                        });
                    }, 10000);
                }
            });
        }

        return () => clearInterval(intervalId);
    }, [showModalTracking, token, obtenerTracking]);

    const handleExport = () => {
        // Mapeamos los datos para obtener solo las columnas deseadas
        const exportData = aRecorridogps.map(item => ({
            fechorgps: item.fechorgps,
            hora: item.hora,
            latitude: item.latitude,
            longitude: item.longitude,
            velocidad: item.velocidad,
            movil: item.movil,
        }));

        // Creamos la hoja de Excel y el libro
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "RecorridoGPS");

        // Generamos y descargamos el archivo Excel
        XLSX.writeFile(workbook, "RecorridoGPS.xlsx");
    };

    // Función para resetear los estados internos al cerrar el modal
    const resetStates = () => {
        setProgress(false);
        setInitialLoad(true);
        setOServicio({});
        setARuta([]);
        setOAsociado({});
        setOVehiculo({});
        setARecorridogps([]);
        setAsociadoMarker(null);
    };

    const handleCloseModal = () => {
        resetStates();
        closeModal();
    };

    if (!showModalTracking) return null;

    const rutaMarkers = aRuta.map((ruta) => ({
        lat: ruta.latitude,
        lng: ruta.longitude,
        type: 'circle',
        number: ruta.item,
        direccion: ruta.direccion,
        id: `ruta-${ruta.item}`,
    }));

    const markers = oServicio.idestado === 16 || oServicio.idestado === 17 || oServicio.idestado === 18 || oServicio.idestado === 19 || oServicio.idestado === 20
        // Si el servicio está finalizado (idestado 16), solo mostramos la ruta
        ? rutaMarkers
        // En otro caso, si existe asociadoMarker, lo añadimos
        : asociadoMarker
            ? [...rutaMarkers, asociadoMarker]
            : rutaMarkers;


    // 1. Filtramos sólo los estados 13,14,15 y los agrupamos
    const estadosACubrir = [13, 14, 15];
    const polylines = estadosACubrir.map(estado => ({
        estado,
        path: aRecorridogps
            .filter(pt => pt.IdEstado === estado)
            .map(pt => ({ lat: pt.latitude, lng: pt.longitude }))
    }));
    // Ahora pasaremos `polylines` al GoogleMaps

    return (
        <div className='modal'>
            {progress && (
                <Box className='box-progress'>
                    <CircularProgress color="primary" size="3rem" />
                </Box>
            )}
            <div className='box-tracking'>
                {/* Se usa handleCloseModal para limpiar los estados antes de cerrar */}
                <TbXboxX className='close-modal' style={{ fontSize: '24' }} onClick={handleCloseModal} />
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
                                                        oServicio.idestado === 16 ? 'status-finalizado' :
                                                            oServicio.idestado === 17 ? 'status-desplazamiento' :
                                                                oServicio.idestado === 18 ? 'status-anulado-cancelado' :
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
                    {(oServicio.idestado === 12 || oServicio.idestado === 13 || oServicio.idestado === 14 || oServicio.idestado === 15 || oServicio.idestado === 16 || oServicio.idestado === 17 || oServicio.idestado === 18 || oServicio.idestado === 19) && (
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
                            {aRecorridogps && aRecorridogps.length > 0 && (
                                <div>
                                    <button className='export-button-rute' onClick={handleExport}>Exportar a Excel</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <GoogleMaps
                    markers={markers}
                    polylines={polylines}
                />
            </div>
        </div>
    );
};

const ModalValidate = ({ showModalValidate, closeModal, idreserva, apiprincipal }) => {
    const baseUrl = process.env.REACT_APP_BASE_URL?.replace(/\/?$/, "/") || "";
    const [progress, setProgress] = useState(false);

    const idpersonal = localStorage.getItem('idpersonal')

    const handleValidate = async (estado) => {
        setProgress(true)
        const body = {
            idreserva: idreserva, // número de la reserva
            idpersonal: idpersonal, // el id del personal
            estval: estado, // 0 rechaza, 1 aprueba
            plataforma: "Intranet", // aqui va la plataforma que viene la validacion
            idempresas: 0
        }

        // console.log(body)

        try {
            const responseValidate = await axios.post(`${baseUrl}api/IntranetApp/Validacions`, body, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('key')}`,
                }
            })

            if (responseValidate.data.estatus === 200) {
                apiprincipal()
                notifySuccess(estado === 1 ? 'Validación exitosa' : 'Rechazo exitoso')
            } else {
                notifyError('Error al validar el servicio')
            }
        } catch (error) {
            notifyError('Error al validar el servicio')
        } finally {
            setProgress(false)
            closeModal()
        }
    }

    if (!showModalValidate) return null

    return (
        <div className='modal'>
            {progress && (
                <Box className='box-progress'>
                    <CircularProgress color="primary" size="3rem" />
                </Box>
            )}
            <div className='box-modal'>
                <div className='box-title-modal'>
                    <h4>¿Que deseas hacer con el servicio?</h4>
                    <TbXboxX className='close-modal' style={{ fontSize: '24' }} onClick={closeModal} />
                </div>
                {/* <h6>Por favor, haz click en el botón</h6> */}
                <button className='button-modal action-green' onClick={() => handleValidate(1)}>Aprobar</button>
                <button className='button-modal action-red' onClick={() => handleValidate(0)}>Rechazar</button>
            </div>
        </div>
    )
}

const ModalEditService = ({ showModalEditService, closeModal, idreserva, apiprincipal }) => {
    const baseUrl = process.env.REACT_APP_BASE_URL?.replace(/\/?$/, "/") || "";
    const [progress, setProgress] = useState(false);
    // const [oConfiguracion, setOConfiguracion] = useState({});
    // const [oMovil, setOMovil] = useState({});
    // const [aPersonal, setAPersonal] = useState([]);
    const [oDatos, setODatos] = useState({});
    const [aRuta, setARuta] = useState([]);
    const [aPuntoAdicional, setAPuntoAdicional] = useState([]);

    const [origin, setOrigin] = useState('');
    const [originSuggestions, setOriginSuggestions] = useState([]);
    const [destination, setDestination] = useState('');
    const [destinationSuggestions, setDestinationSuggestions] = useState([]);
    const [additionalDestinations, setAdditionalDestinations] = useState([]);
    const [tempArray, setTempArray] = useState([]); // Cada objeto: { inputValue, lat, lng, dist, tiempo, monto, zona, idcaja }
    const [markers, setMarkers] = useState([]);
    const [zona, setZona] = useState('');

    const [dataArea, setDataArea] = useState([]);
    const [dataCentroCostos, setDataCentroCostos] = useState([]);
    const [dataMotivo, setDataMotivo] = useState([]);
    const [dataMovil, setDataMovil] = useState([]);
    const [dataPago, setDataPago] = useState([]);
    const [dataPersonal, setDataPersonal] = useState({});
    const [dataConfiguracion, setDataConfiguracion] = useState({});
    const [dataPersonalo, setDataPersonalo] = useState([]);
    const [dataIncremento, setDataIncremento] = useState('');

    // Estados para usuario (si es para otro usuario)
    const [parami, setParami] = useState('');
    const [usuario, setUsuario] = useState('');
    const [telefono, setTelefono] = useState('');

    const [fecha, setFecha] = useState('');
    const [hora, setHora] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [tipopago, setTipopago] = useState('');
    const [tipomovil, setTipomovil] = useState('');
    const [area, setArea] = useState(''); // Valor predeterminado (se asigna de dataPersonal)
    const [centrocostos, setCentrocostos] = useState(''); // Valor predeterminado (se asigna de dataPersonal)
    const [motivo, setMotivo] = useState('');
    const [detalle, setDetalle] = useState('');
    const [fare, setFare] = useState(0);
    const [tariffCalculated, setTariffCalculated] = useState(false);

    const optionUsuario = [
        { value: 'parami', label: 'Para mi' },
        { value: 'paraotrousuario', label: 'Para otro usuario' },
    ];

    const reorderMarkers = (markersToSort) => {
        const priority = {
            'origin': 0,
            'destination': 1,
            'additional-0': 2,
            'additional-1': 3,
        };
        return markersToSort.slice().sort((a, b) => (priority[a.idcaja] ?? 99) - (priority[b.idcaja] ?? 99));
    };

    const handleEdit = useCallback(async () => {
        setProgress(true)
        try {
            const responseEdit = await axios.get(`${baseUrl}api/IntranetApp/Serviciosdatos`, {
                params: {
                    idempresas: 0,
                    idreserva: idreserva,
                    condicion: 0
                },
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('key')}`,
                }
            })

            if (responseEdit.data.estatus === 200) {
                notifySuccess('Datos del servicio obtenidos con éxito')
                const { ODatos, ARuta, APuntoadicional } = responseEdit.data;
                setODatos(ODatos)
                // setOConfiguracion(OConfiguracion)
                // setOMovil(OMovil)
                // setAPersonal(APersonal)
                setARuta(ARuta)
                setAPuntoAdicional(APuntoadicional)

                // Prefill de campos usando ODatos
                if (ODatos) {
                    // Asumimos que fechareserva viene en formato ISO
                    setFecha(ODatos.fechareserva.split("T")[0]); // Obtiene solo la parte de la fecha
                    setHora(ODatos.horareserva);
                    setObservaciones(ODatos.observaciones);
                    setTipopago(ODatos.pagotipo);
                    setTipomovil(ODatos.movil);
                    // Puedes agregar más campos según necesites:
                    setArea(ODatos.area);
                    setCentrocostos(ODatos.centrocostos);
                }

                // Prefill de direcciones usando ARuta
                // Por ejemplo, si el primer elemento es la dirección de origen y el segundo el destino:
                if (ARuta && ARuta.length) {
                    // Construye tempArray completo
                    const newTemp = ARuta.map((ruta, index) => ({
                        inputValue: ruta.direccion,
                        lat: ruta.latitude,
                        lng: ruta.longitude,
                        dist: ruta.distanciakm || 0,
                        tiempo: ruta.minkm || 0,
                        monto: ruta.subtotalruta || 0,
                        zona: ruta.zona,
                        idcaja: index === 0
                            ? 'origin'
                            : index === 1
                                ? 'destination'
                                : `additional-${index - 2}`
                    }));

                    setTempArray(newTemp);

                    // Crea marcadores para cada punto
                    const newMarkers = newTemp.map(item => ({
                        idcaja: item.idcaja,
                        lat: item.lat,
                        lng: item.lng,
                        direccion: item.inputValue,
                        type: 'circle',
                        zona: item.zona
                    }));
                    setMarkers(reorderMarkers(newMarkers));

                    // Prefill inputs de origen y destino
                    setOrigin(newTemp[0].inputValue);
                    if (newTemp[1]) setDestination(newTemp[1].inputValue);

                    // Crea dinámicamente destinos adicionales (si existen)
                    setAdditionalDestinations(newTemp.slice(2).map(item => ({
                        value: item.inputValue,
                        suggestions: []
                    })));
                }

            } else {
                notifyError('Error al obtener los datos del servicio')
            }
        } catch (error) {
            console.error("Error en handleEdit:", error);
        } finally {
            setProgress(false)
        }
    }, [idreserva, baseUrl]);

    useEffect(() => {
        if (showModalEditService && idreserva) {
            // console.log("idreserva recibido:", idreserva);
            handleEdit();
        }
    }, [showModalEditService, idreserva, handleEdit]);

    const handleOriginChange = (e) => {
        const value = e.target.value;
        setOrigin(value);
        removeMarkerByIdcaja('origin');
        setTariffCalculated(false);
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
            removeMarkerByIdcaja('destination');
            setTariffCalculated(false);
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
            setTariffCalculated(false);
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

    const handleAddRoute = () => {
        if (additionalDestinations.length < 2) {
            setAdditionalDestinations(prev => [...prev, { value: '', suggestions: [] }]);
            setTariffCalculated(false);
        } else {
            notifyError('Solo se permiten 2 destinos adicionales.');
        }
    };

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
        setTariffCalculated(false);
    };

    const fetchZone = async (lat, lng) => {
        try {
            const responseZona = await axios.post(
                `${baseUrl}api/IntranetApp/Zona`,
                { id_empresa_taxi: 0, lat, lng },
                { headers: { Authorization: `Bearer ${localStorage.getItem('key')}` } }
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
    const calculateTariff = async () => {
        const baseUrl = process.env.REACT_APP_BASE_URL?.replace(/\/?$/, "/") || "";
        setProgress(true)
        if (tempArray.length < 2) {
            notifyError('Debe seleccionar al menos dos puntos para calcular la tarifa.');
            setProgress(false)
            // alert("Debe seleccionar al menos dos puntos para calcular la tarifa.");
            return;
        }
        let total = 0;
        for (let i = 0; i < tempArray.length - 1; i++) {
            const start = tempArray[i];
            const end = tempArray[i + 1];
            try {
                const GEO_API_URL = process.env.REACT_APP_GEO_API_URL?.replace(/\/?$/, "");
                const routeRes = await axios.get(
                    `${GEO_API_URL}/api/v3/route/${start.lat},${start.lng}/${end.lat},${end.lng}/-1/tarifaTotal`,
                    { headers: { Authorization: 'Basic c3lzdGVtM3c6NkVpWmpwaWp4a1hUZUFDbw==' } }
                );
                const routeData = routeRes.data;
                if (routeData && routeData.route && routeData.route.length >= 2) {
                    // Actualizamos los valores de distancia y tiempo para este tramo
                    tempArray[i + 1].dist = routeData.distance;
                    tempArray[i + 1].tiempo = routeData.time;
                    const postData = {
                        idcliente: localStorage.getItem('idcliente'),
                        idempresa: 0,
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
                                Authorization: `Bearer ${localStorage.getItem('key')}`,
                                "Content-Type": "application/json",
                            }
                        }
                    );
                    if (tarifaRes.data.estatus === 200) {
                        setProgress(false)
                        setTariffCalculated(true);
                        total += tarifaRes.data.tarifa;
                        // Actualiza el tramo con la tarifa calculada
                        setTempArray(prev => {
                            const newArr = [...prev];
                            newArr[i + 1] = { ...newArr[i + 1], monto: tarifaRes.data.tarifa };
                            return newArr;
                        });
                        // notifySuccess('Tarifa obtenida');
                    } else {
                        setProgress(false)
                        notifyError('No se pudo obtener tarifa, validar campos');
                        setTariffCalculated(false)
                    }
                }
            } catch (error) {
                setProgress(false)
                notifyError('No se pudo obtener tarifa, validar campos');
                console.error("Error al calcular ruta:", error);
            }
        }
        const horaPunta = await handleHoraPunta();
        const adjustedFare = await callAumentoTarifa(total, horaPunta);
        setFare(adjustedFare);
    };

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
                    idempresas: 0,
                    hora: hourInt,
                    dia: diaSemana
                }, headers: {
                    Authorization: `Bearer ${localStorage.getItem('key')}`,
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
                    Authorization: `Bearer ${localStorage.getItem('key')}`,
                    "Content-Type": "application/json"
                }
            });
            if (response.data) {
                setDataIncremento(response.data);
                const { mhorapunta, mhvalle, mcentral, mappweb } = response.data;
                const adjusted = total - (mhvalle) - (mappweb) + (mcentral) + (mhorapunta);
                // console.log("Tarifa ajustada:", adjusted);
                return adjusted;
            }
        } catch (error) {
            console.error("Error en callAumentoTarifa:", error);
        }
        return total;
    };

    const removeMarkerByIdcaja = (idcaja) => {
        setMarkers(prev => reorderMarkers(prev.filter(m => m.idcaja !== idcaja)));
        setTempArray(prev => prev.filter(item => item.idcaja !== idcaja));
        setTariffCalculated(false);
    };

    const fetchSuggestions = async (inputValue, setSuggestions) => {
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
        }
    };

    const fetchGeocoding = async (coordinate, index = null) => {
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
                setTariffCalculated(false);
            }
        } catch (error) {
            console.error('Error fetching geocoding:', error);
        }
    };

    const handleSelectSuggestion = async (suggestion, isOrigin = true, index = null) => {
        const selectedText = `${suggestion.direccion}, ${suggestion.distrito}`;
        // Array de direcciones de aeropuerto normalizadas
        const airportAddresses = [
            'aeropuerto internacional jorge chavez, av. elmer faucett, callao',
            'aeropuerto internacional "jorge chavez" (lim), av. elmer faucett, callao, peru',
            'international airport jorge chavez'
        ];

        // Función para normalizar cadenas (quita espacios extra, acentos y convierte a minúsculas)
        const normalizeString = (str) => {
            return str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        };

        // Dentro de tu función handleSelectSuggestion:
        const normalizedDireccion = normalizeString(suggestion.direccion);

        // Comprobación por dirección
        const isAirportByAddress = airportAddresses.some(addr => normalizedDireccion === addr);

        // Comprobación por coordenadas específicas
        const isAirportByCoordinates = suggestion.lat === -12.0222649 && suggestion.lng === -77.1191992;

        // Se considera aeropuerto si se cumple alguna de las dos condiciones
        const isAirport = isAirportByAddress || isAirportByCoordinates;

        // Reemplaza las coordenadas si se detecta aeropuerto, de lo contrario, usa las originales
        const finalLat = isAirport ? -12.022816 : suggestion.lat;
        const finalLng = isAirport ? -77.107902 : suggestion.lng;

        let idcaja = 'origin';
        if (!isOrigin && index === null) {
            idcaja = 'destination';
        } else if (!isOrigin && index !== null) {
            idcaja = `additional-${index}`;
        }

        const zonaObtenida = await fetchZone(finalLat, finalLng);

        const newEntry = {
            inputValue: selectedText.length > 250 ? selectedText.substring(0, 250) : selectedText,
            lat: finalLat,
            lng: finalLng,
            dist: 0,
            tiempo: 0,
            monto: 0,
            zona: zonaObtenida || '',
            idcaja: idcaja,
        };

        setTempArray(prev => {
            const existingIndex = prev.findIndex(item => item.idcaja === idcaja);
            if (existingIndex !== -1) {
                const newArr = [...prev];
                newArr[existingIndex] = newEntry;
                return newArr;
            }
            return [...prev, newEntry];
        });

        setMarkers(prev => {
            const filtered = prev.filter(m => m.idcaja !== idcaja);
            const newMarker = { idcaja, lat: finalLat, lng: finalLng, direccion: newEntry.inputValue, type: 'circle', zona: newEntry.zona };
            return reorderMarkers([...filtered, newMarker]);
        });

        if (isOrigin) {
            setOrigin(newEntry.inputValue);
            setOriginSuggestions([]);
        } else if (index === null) {
            setDestination(newEntry.inputValue);
            setDestinationSuggestions([]);
        } else {
            setAdditionalDestinations(prev => {
                const updated = [...prev];
                updated[index].value = newEntry.inputValue;
                updated[index].suggestions = [];
                return updated;
            });
        }
        setTariffCalculated(false);
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
                    Authorization: `Bearer ${localStorage.getItem('key')}`,
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
                // console.log(responseSolicitud.data);
            }
        } catch (error) {
            console.error(error.response?.data);
        }
    }, [baseUrl]);

    useEffect(() => {
        if (showModalEditService) {
            dataSolicitante();
        }
    }, [showModalEditService, dataSolicitante]);

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

    const sendServiceRequest = async () => {
        setProgress(true)

        // Dentro de sendServiceRequest, justo al inicio (antes de otras validaciones)
        if (!tipopago.trim()) {
            notifyError('El campo Tipo pago es obligatorio.');
            // alert("El campo 'Tipo pago' es obligatorio.");
            return;
        }
        if (!tipomovil.trim()) {
            notifyError('El campo Tipo movil es obligatorio.');
            // alert("El campo 'Tipo movil' es obligatorio.");
            return;
        }

        // Validaciones de campos obligatorios según dataConfiguracion (solo si no es Efectivo)
        if (tipopago !== "Efectivo") {
            if (dataConfiguracion.idcentrocostos && !centrocostos.trim()) {
                notifyError('El campo Centro de costos es obligatorio.');
                setProgress(false)
                // alert("El campo 'Centro de costos' es obligatorio.");
                return;
            }
            if (dataConfiguracion.idarea && !area.trim()) {
                notifyError('El campo Área es obligatorio.');
                setProgress(false)
                // alert("El campo 'Área' es obligatorio.");
                return;
            }
            if (dataConfiguracion.idmotsol && !motivo.trim()) {
                notifyError('El campo Motivo es obligatorio.');
                setProgress(false)
                // alert("El campo 'Motivo' es obligatorio.");
                return;
            }
            if (dataConfiguracion.iddetallemotivo && !detalle.trim()) {
                notifyError('El campo Detalle motivo es obligatorio.');
                setProgress(false)
                // alert("El campo 'Detalle motivo' es obligatorio.");
                return;
            }
        }
        if (!origin || !destination || !fecha || !hora) {
            notifyError('Complete todos los campos obligatorios.');
            // alert("Complete todos los campos obligatorios.");
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
            idreserva: idreserva,
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
            idempresas: 0,
            agente: "Intranet",
            ipregistro: "0.0.0.0",
            nchatwoot: ""
        };

        try {
            const response = await axios.post(
                `${baseUrl}api/IntranetApp/Serviciosa`,
                postBody,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('key')}`,
                        "Content-Type": "application/json"
                    }
                }
            );
            if (response.data) {
                setProgress(false)
                notifySuccess(`Actualización de registro exitoso`);
                setOrigin('');
                setDestination('');
                setHora('');
                setFecha('');
                setObservaciones('');
                setTipopago(dataPago[0].tpago);
                setTipomovil(dataMovil[0].destipomovil);
                setArea(dataPersonal.area);
                setCentrocostos(dataPersonal.centrocostos);
                setMotivo('');
                setDetalle('');
                setTariffCalculated('');
                setFare(0);
                apiprincipal()
                closeModal()
                // alert(`Registro exitoso. Id de reserva: ${response.data.idreserva}`);
                // Aquí podrías limpiar el formulario o redirigir al usuario.
            } else {
                notifyError('Error al enviar solicitud.');
            }
        } catch (error) {
            // console.error("Error al enviar solicitud:", error);
            notifyError('Error al enviar solicitud.');
        } finally {
            setProgress(false)
        }
    };

    if (!showModalEditService) return null

    return (
        <div className='modal'>
            {progress && (
                <Box className='box-progress'>
                    <CircularProgress color="primary" size="3rem" />
                </Box>
            )}
            <div className='box-tracking'>
                {/* Se usa handleCloseModal para limpiar los estados antes de cerrar */}
                <TbXboxX className='close-modal' style={{ fontSize: '24' }} onClick={closeModal} />
                <div className='content-data-tracking'>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <h5 style={{ fontWeight: '600', textAlign: 'center' }}>Editar servicio</h5>
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
                            <Input
                                type='text'
                                placeholder="Av. Prolongacion Iquitos 2291, Lince"
                                value={origin}
                                onChange={(e) => handleOriginChange(e)}
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
                            <div className='box-directions-button'>
                                <Input
                                    type="text"
                                    placeholder="Ingresa destino"
                                    value={destination}
                                    onChange={(e) => handleDestinationChange(e.target.value)}
                                    className="input-request-destination input-directions"
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
                                <div className='box-directions-button'>
                                    <Input
                                        type="text"
                                        placeholder="Ingresa destino adicional"
                                        value={dest.value}
                                        onChange={(e) => handleDestinationChange(e.target.value, index)}
                                        className="input-request-destination input-directions"
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
                        <div className='content-request'>
                            <div className='request'>
                                <label>Fecha</label>
                                <Input type='date' value={fecha} onChange={(e) => { setFecha(e.target.value); setTariffCalculated(false); }} />
                            </div>
                            <div className='request'>
                                <label>Hora</label>
                                <Input type='time' value={hora} onChange={(e) => { setHora(e.target.value); setTariffCalculated(false); }} />
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
                                <select className='camp-request-select' value={tipopago} onChange={(e) => setTipopago(e.target.value)}>
                                    <option value="">Selecciona</option>
                                    {dataPago.map((pago) => (
                                        <option key={pago.tpago} value={pago.tpago}>{pago.tpago}</option>
                                    ))}
                                </select>
                            </div>
                            <div className='request'>
                                <label>Tipo movil</label>
                                <select className='camp-request-select' value={tipomovil} onChange={(e) => setTipomovil(e.target.value)}>
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
                                            onChange={(e) => { setArea(e.target.value); setTariffCalculated(false); }}
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
                                            onChange={(e) => { setCentrocostos(e.target.value); setTariffCalculated(false); }}
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
                                            onChange={(e) => { setMotivo(e.target.value); setTariffCalculated(false); }}
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
                                            onChange={(e) => { setDetalle(e.target.value); setTariffCalculated(false); }}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                        <div className="content-request">
                            <Button label="Consultar Tarifa" onClick={calculateTariff} />
                            <div>
                                <strong>Tarifa: </strong> S/{fare.toFixed(2)}
                            </div>
                        </div>
                        {/* El botón "Solicitar Servicio" se muestra solo si se consultó la tarifa */}
                        {tariffCalculated && (
                            <div className="content-request">
                                <Button label="Actualizar Servicio" onClick={() => sendServiceRequest()} />
                            </div>
                        )}
                    </div>
                </div>

                <GoogleMaps markers={markers} />
            </div>
        </div>
    );
}

const schemaFavorite = Yup.object().shape({
    titulo: Yup.string().required('El título es requerido'),
    direccion: Yup.string().required('La dirección es requerida'),
    referencia: Yup.string(),
});

const ModalFavorite = ({
    showModalFavorite,
    closeModal,
    favoritoSeleccionado,
    condicion,
    apiprincipal,
}) => {
    const baseUrl = process.env.REACT_APP_BASE_URL?.replace(/\/?$/, "/") || "";
    const idpersonal = localStorage.getItem('idpersonal');

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: yupResolver(schemaFavorite),
        defaultValues: {
            titulo: '',
            direccion: '',
            referencia: '',
        },
    });

    // Cuando abra el modal o cambie el favorito seleccionado, rellena el formulario
    useEffect(() => {
        if (showModalFavorite && favoritoSeleccionado) {
            reset({
                titulo: favoritoSeleccionado.titulo,
                direccion: favoritoSeleccionado.direccion,
                referencia: favoritoSeleccionado.referencia,
            });
        }
    }, [showModalFavorite, favoritoSeleccionado, reset]);

    const onSubmit = async (data) => {
        try {
            const body = {
                idpersonal,
                ...data,
                latitude: favoritoSeleccionado.latitude,
                longitude: favoritoSeleccionado.longitude,
                condicion,
            };
            const resp = await axios.post(
                `${baseUrl}api/IntranetApp/Favoritosra`,
                body,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer ' + localStorage.getItem('key'),
                    },
                }
            );
            if (resp.data.estatus === 200) {
                apiprincipal(true);             // refresca con loader
                notifySuccess('Favorito actualizado correctamente');
            } else {
                notifyError('Error al actualizar favorito');
            }
        } catch {
            notifyError('Error al actualizar favorito');
        } finally {
            closeModal();
        }
    };

    if (!showModalFavorite) return null;

    return (
        <div className="modal">
            {isSubmitting && (
                <Box className="box-progress">
                    <CircularProgress color="primary" size="3rem" />
                </Box>
            )}
            <div className="box-modal">
                <div className="box-title-modal">
                    <h4>Favorito</h4>
                    <TbXboxX
                        className="close-modal"
                        style={{ fontSize: '24px' }}
                        onClick={closeModal}
                    />
                </div>
                <form className="content-personal" onSubmit={handleSubmit(onSubmit)}>
                    <div className="box-input">
                        <label>Título</label>
                        <input
                            type="text"
                            placeholder="ejm. Oficina"
                            {...register('titulo')}
                            className="input input-personal"
                        />
                        {errors.titulo && (
                            <p className="message error">{errors.titulo.message}</p>
                        )}
                    </div>

                    <div className="box-input">
                        <label>Dirección</label>
                        <input
                            type="text"
                            disabled={true}
                            placeholder="ejm. Av. Prolongación Iquitos 2291, Lince"
                            {...register('direccion')}
                            className="input input-personal"
                        />
                        {errors.direccion && (
                            <p className="message error">{errors.direccion.message}</p>
                        )}
                    </div>

                    <div className="box-input">
                        <label>Referencia</label>
                        <input
                            type="text"
                            placeholder="ejm. Esquina con C. Las Lilas"
                            {...register('referencia')}
                            className="input input-personal"
                        />
                        {errors.referencia && (
                            <p className="message error">{errors.referencia.message}</p>
                        )}
                    </div>

                    <button
                        className="button-modal action-green"
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Actualizando...' : 'Actualizar'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const ModalTarifaConfirmacion = ({ show, onClose, fare, onAccept }) => {
    if (!show) return null;
    return (
        <div className="modal">
            <div className="box-modal">
                <div className="box-title-modal">
                    <h4>Tarifa calculada</h4>
                    <TbXboxX
                        className="close-modal"
                        style={{ fontSize: '24px' }}
                        onClick={onClose}
                    />
                </div>
                <div style={{ textAlign: 'center', margin: '32px 0 24px 0', fontSize: '1.5rem', fontWeight: 600 }}>
                    S/ {fare.toFixed(2)}
                </div>
                <button
                    className="button-modal action-green"
                    style={{ width: '100%' }}
                    onClick={onAccept}
                >
                    Aceptar
                </button>
            </div>
        </div>
    );
};

export { ModalCancel, ModalPersonal, ModalActDesact, ModalADCentroCosto, ModalADArea, ModalTracking, ModalValidate, ModalEditService, ModalFavorite, ModalTarifaConfirmacion } // Export the component