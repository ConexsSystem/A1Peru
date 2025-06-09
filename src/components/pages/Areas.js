import React, { useEffect, useState, useCallback } from 'react';
import Topbar from '../layout/Topbar'
import axios from 'axios'
import './contentPage.css'
import { TbEditCircle, TbToggleRightFilled, TbToggleLeftFilled } from "react-icons/tb";
import { formatDateTime, formatearFecha } from '../../utils/utils'
import { ModalActDesact, ModalADArea } from '../layout/Modal'
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const Areas = () => {
    const baseUrl = process.env.REACT_APP_BASE_URL?.replace(/\/?$/, "/") || "";

    const [progress, setProgress] = useState(false);
    const [showModalActDesact, setShowModalActDesact] = useState(false)
    const [showModalADArea, setShowModalADArea] = useState(false)
    const [itemSelect, setItemSelect] = useState(null);
    const [itemADArea, setItemADArea] = useState(null);
    const [id, setId] = useState(0);
    const [nombre, setNombre] = useState('');
    const [areas, setAreas] = useState([])
    const [searchTerm, setSearchTerm] = useState('');

    const imageProfile = localStorage.getItem('fotourl');
    const idcliente = localStorage.getItem('idcliente');
    const key = localStorage.getItem('key');

    const handleAreas = useCallback(async () => {
        setProgress(true);
        try {
            const response = await axios.get(`${baseUrl}api/IntranetApp/Arearegistrados`, {
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
                setAreas(response.data.ARegistrados);
                setProgress(false);
            } else {
                setProgress(false);
            }
        } catch (error) {
            setProgress(false);
        }
    }, [baseUrl, idcliente, key]);

    useEffect(() => {
        handleAreas()
    }, [handleAreas])

    // Filtrado simple de servicios según el término de búsqueda
    const filteredData = areas.filter(areas =>
        areas.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
        areas.observaciones.toLowerCase().includes(searchTerm.toLowerCase()) ||
        areas.servingreso.toLowerCase().includes(searchTerm.toLowerCase()) ||
        areas.servsalida.toLowerCase().includes(searchTerm.toLowerCase()) ||
        areas.servsaldo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        areas.servporcentaje.toLowerCase().includes(searchTerm.toLowerCase()) ||
        areas.montoingreso.toLowerCase().includes(searchTerm.toLowerCase()) ||
        areas.montosalida.toLowerCase().includes(searchTerm.toLowerCase()) ||
        areas.montosaldo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        areas.montoporentaje.toLowerCase().includes(searchTerm.toLowerCase()) ||
        areas.agente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        areas.fechor.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openModalActDesact = (item, id, nombre) => {
        setShowModalActDesact(true);
        setItemSelect(item); // <-- guardar objeto completo
        setId(id);
        setNombre(nombre)
    };

    const openModalADArea = (item) => {
        setShowModalADArea(true);
        setItemADArea(item); // <-- guardar objeto completo
    };

    // Mapea los datos a exportar con los encabezados deseados
    const exportData = filteredData.map(area => ({
        "Nombre": area.area || 'NO REGISTRA',
        "Observaciones": area.observaciones || 'NO REGISTRA',
        "Servicio ingresado": area.servingreso || 0,
        "Servicio salida": area.servsalida || 0,
        "Servicio saldo": area.servsaldo || 0,
        "Servicio porcentaje": area.servporcentaje || 0,
        "Monto ingreso": area.montoingreso || 0,
        "Monto salida": area.montosalida || 0,
        "Monto saldo": area.montosaldo || 0,
        "Monto porcentaje": area.montoporentaje || 0,
        "Agente": area.agente || 'NO REGISTRA',
        "Registro": formatearFecha(area.fechor) || 'NO REGISTRA'
    }));

    return (
        <div className='page'>
            {progress && (
                <Box className='box-progress'>
                    <CircularProgress color="primary" size="3rem" />
                </Box>
            )}
            <Topbar
                title='Áreas'
                imageProfile={imageProfile}
                showDateSelect={false}
                onAddClick={() => openModalADArea(0)}
                // Habilitamos la búsqueda y pasamos el valor/controlador
                showSearch={true}
                searchValue={searchTerm}
                onSearchChange={(value) => setSearchTerm(value)}
                exportData={exportData}          // Aquí se pasa la data para exportar
                exportFileName="Areas.xlsx"  // Opcional: nombre del archivo
                exportSheetName="Áreas"      // Opcional: nombre de la hoja
            />
            <div className='content-page'>
                <table>
                    <thead>
                        <tr>
                            <th>Acciones</th>
                            {/* <th>Estado</th> */}
                            <th>Nombre</th>
                            <th>Observaciones</th>
                            <th>Servicio ingresado</th>
                            <th>Servicio salida</th>
                            <th>Servicio saldo</th>
                            <th>Servicio porcentaje</th>
                            <th>Monto ingreso</th>
                            <th>Monto salida</th>
                            <th>Monto saldo</th>
                            <th>Monto porcentaje</th>
                            <th>Agente</th>
                            <th>Registro</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length > 0 ? (
                            filteredData.map((areas, index) => (
                                <tr key={index}>
                                    <td>
                                        <TbEditCircle className='TbEditCircle' onClick={() => openModalADArea(areas)} />
                                        {areas.idcondicion ? <TbToggleRightFilled className='TbToggleRightFilled' onClick={() => openModalActDesact(areas, areas.idareaconfiguracion, areas.area)} /> : <TbToggleLeftFilled className='TbToggleLeftFilled' onClick={() => openModalActDesact(areas, areas.idareaconfiguracion, areas.area)} />}
                                    </td>
                                    {/* <td>{areas.idcondicion ? 'Activo' : 'Desactivado'}</td> */}
                                    <td>{areas.area || 'NO REGISTRA'}</td>
                                    <td>{areas.observaciones || 'NO REGISTRA'}</td>
                                    <td>{areas.servingreso}</td>
                                    <td>{areas.servsalida}</td>
                                    <td>{areas.servsaldo}</td>
                                    <td>{areas.servporcentaje}</td>
                                    <td>{areas.montoingreso}</td>
                                    <td>{areas.montosalida}</td>
                                    <td>{areas.montosaldo}</td>
                                    <td>{areas.montoporentaje}</td>
                                    <td>{areas.agente || 'NO REGISTRA'}</td>
                                    <td>{formatDateTime(areas.fechor || 'NO REGISTRA')}</td>
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
            <ModalADArea
                showModalADArea={showModalADArea}
                closeModal={() => setShowModalADArea(false)}
                item={itemADArea}
                apiprincipal={handleAreas}
            />
            <ModalActDesact
                showModalActDesact={showModalActDesact}
                closeModal={() => setShowModalActDesact(false)}
                item={itemSelect}
                id={id}
                tipo='2'
                nombre={nombre}
                apiprincipal={handleAreas}
            />
        </div >
    )
}

export default Areas