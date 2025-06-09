import React, { useEffect, useState, useCallback } from 'react';
import Topbar from '../layout/Topbar'
import axios from 'axios'
import './contentPage.css'
import { TbEditCircle, TbToggleRightFilled, TbToggleLeftFilled } from "react-icons/tb";
import { formatDateTime, formatearFecha } from '../../utils/utils'
import { ModalPersonal, ModalActDesact } from '../layout/Modal'
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const Personal = () => {
    const baseUrl = process.env.REACT_APP_BASE_URL?.replace(/\/?$/, "/") || "";

    const [progress, setProgress] = useState(false);
    const [personal, setPersonal] = useState([])
    const [showModalPersonal, setShowModalPersonal] = useState(false)
    const [showModalActDesact, setShowModalActDesact] = useState(false)
    const [personalSeleccionado, setPersonalSeleccionado] = useState(null);
    const [itemSelect, setItemSelect] = useState(null);
    const [id, setId] = useState(0);
    const [nombre, setNombre] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const imageProfile = localStorage.getItem('fotourl');
    const idcliente = localStorage.getItem('idcliente');
    const key = localStorage.getItem('key');

    const handlePersonal = useCallback(async () => {
        setProgress(true);
        try {
            const response = await axios.get(`${baseUrl}api/IntranetApp/Personalregistrados`, {
                params: {
                    idempresas: 0,
                    idcliente: idcliente,
                    condicion: 2,
                },
                headers: {
                    'Authorization': `Bearer ${key}`,
                }
            });

            if (response.data.estatus === 200) {
                setPersonal(response.data.ARegistrados);
                setProgress(false);
            } else {
                setProgress(false);
            }
        } catch (error) {
            setProgress(false);
        }
    }, [baseUrl, idcliente, key]);

    useEffect(() => {
        handlePersonal()
    }, [handlePersonal])

    // Filtrado simple de servicios según el término de búsqueda
    const filteredData = personal.filter(personal =>
        personal.agente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        personal.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
        personal.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
        personal.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        personal.centrocostos.toLowerCase().includes(searchTerm.toLowerCase()) ||
        personal.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        personal.datjefe.toLowerCase().includes(searchTerm.toLowerCase()) ||
        personal.dni.toLowerCase().includes(searchTerm.toLowerCase()) ||
        personal.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        personal.emailverificador.toLowerCase().includes(searchTerm.toLowerCase()) ||
        personal.fechor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        personal.telefonoprincipal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        personal.telefonosecundario.toLowerCase().includes(searchTerm.toLowerCase()) ||
        personal.tipodocumento.toLowerCase().includes(searchTerm.toLowerCase()) ||
        personal.tipopersonal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        personal.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
        personal.observaciones.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openModalPersonal = (personal) => {
        setPersonalSeleccionado(personal); // <-- guardar objeto completo
        setShowModalPersonal(true);
    };

    const openModalActDesact = (item, id, nombre) => {
        setShowModalActDesact(true);
        setItemSelect(item); // <-- guardar objeto completo
        setId(id);
        setNombre(nombre)
    };

    // Mapea los datos a exportar con los encabezados deseados
    const exportData = filteredData.map(personal => ({
        "Tipo documento": personal.tipodocumento || 'NO REGISTRA',
        "Documento": personal.dni || 'NO REGISTRA',
        "Apellidos": personal.apellidos || 'NO REGISTRA',
        "Nombres": personal.nombres || 'NO REGISTRA',
        "Teléfono": personal.telefonoprincipal || 'NO REGISTRA',
        "Correo": personal.email || 'NO REGISTRA',
        "Centro de costos": personal.centrocostos || 'NO REGISTRA',
        "Área": personal.area || 'NO REGISTRA',
        "Cargo": personal.cargo || 'NO REGISTRA',
        "Código interno": personal.codigo || 'NO REGISTRA',
        "Tipo personal": personal.tipopersonal || 'NO REGISTRA',
        "Jefe": personal.datjefe || 'NO REGISTRA',
        "Crédito": personal.servcredito ? 'Si' : 'No',
        "Observaciones": personal.observaciones || 'NO REGISTRA',
        "Agente": personal.agente || 'NO REGISTRA',
        "Registro": formatearFecha(personal.fechor) || 'NO REGISTRA',
    }));

    return (
        <div className='page'>
            {progress && (
                <Box className='box-progress'>
                    <CircularProgress color="primary" size="3rem" />
                </Box>
            )}
            <Topbar
                title='Personal'
                imageProfile={imageProfile}
                showDateSelect={false}
                onAddClick={() => openModalPersonal(0)}
                // Habilitamos la búsqueda y pasamos el valor/controlador
                showSearch={true}
                searchValue={searchTerm}
                onSearchChange={(value) => setSearchTerm(value)}
                exportData={exportData}          // Aquí se pasa la data para exportar
                exportFileName="Personal.xlsx"  // Opcional: nombre del archivo
                exportSheetName="Personal"      // Opcional: nombre de la hoja
            />
            <div className='content-page'>
                <table>
                    <thead>
                        <tr>
                            <th>Acciones</th>
                            {/* <th>Estado</th> */}
                            <th>Tipo D.</th>
                            <th>Documento</th>
                            <th>Apellidos</th>
                            <th>Nombres</th>
                            <th>Teléfono</th>
                            <th>Correo</th>
                            <th>Centro de costos</th>
                            <th>Área</th>
                            <th>Cargo</th>
                            <th>Código interno</th>
                            <th>Tipo personal</th>
                            <th>Jefe</th>
                            <th>Crédito</th>
                            <th>Observaciones</th>
                            <th>Agente</th>
                            <th>Registro</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length > 0 ? (
                            filteredData.map((personal, index) => (
                                <tr key={index} className='text-align-table'>
                                    <td>
                                        <TbEditCircle className='TbEditCircle' onClick={() => openModalPersonal(personal)} />
                                        {personal.idcondicion ? <TbToggleRightFilled className='TbToggleRightFilled' onClick={() => openModalActDesact(personal, personal.idpersonalempresa, personal.nombres)} /> : <TbToggleLeftFilled className='TbToggleLeftFilled' onClick={() => openModalActDesact(personal, personal.idpersonalempresa, personal.nombres)} />}
                                    </td>
                                    {/* <td>{personal.idcondicion ? 'Activo' : 'Desactivado'}</td> */}
                                    <td>{personal.tipodocumento || 'NO REGISTRA'}</td>
                                    <td>{personal.dni || 'NO REGISTRA'}</td>
                                    <td>{personal.apellidos || 'NO REGISTRA'}</td>
                                    <td>{personal.nombres || 'NO REGISTRA'}</td>
                                    <td>{personal.telefonoprincipal || 'NO REGISTRA'}</td>
                                    <td>{personal.email || 'NO REGISTRA'}</td>
                                    <td>{personal.centrocostos || 'NO REGISTRA'}</td>
                                    <td>{personal.area || 'NO REGISTRA'}</td>
                                    <td>{personal.cargo || 'NO REGISTRA'}</td>
                                    <td>{personal.codigo || 'NO REGISTRA'}</td>
                                    <td>{personal.tipopersonal || 'NO REGISTRA'}</td>
                                    <td>{personal.datjefe || 'NO REGISTRA'}</td>
                                    <td>{personal.servcredito ? 'Si' : 'No'}</td>
                                    <td>{personal.observaciones || 'NO REGISTRA'}</td>
                                    <td>{personal.agente || 'NO REGISTRA'}</td>
                                    <td>{formatDateTime(personal.fechor || 'NO REGISTRA')}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="15">No hay servicios registrados</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div >
            <ModalPersonal
                showModalPersonal={showModalPersonal}
                closeModal={() => setShowModalPersonal(false)}
                personalSeleccionado={personalSeleccionado}
                apiprincipal={handlePersonal}
            />
            <ModalActDesact
                showModalActDesact={showModalActDesact}
                closeModal={() => setShowModalActDesact(false)}
                item={itemSelect}
                id={id}
                tipo='1'
                nombre={nombre}
                apiprincipal={handlePersonal}
            />
        </div >
    )
}

export default Personal