import React, { useEffect, useState, useCallback } from 'react';
import Topbar from '../layout/Topbar'
import axios from 'axios'
import './contentPage.css'
import { TbEditCircle, TbToggleRightFilled, TbToggleLeftFilled } from "react-icons/tb";
import { formatDateTime, formatearFecha } from '../../utils/utils'
import { ModalADCentroCosto, ModalActDesact } from '../layout/Modal'
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const CostCenter = () => {
    const baseUrl = process.env.REACT_APP_BASE_URL?.replace(/\/?$/, "/") || "";

    const [progress, setProgress] = useState(false);
    const [showModalActDesact, setShowModalActDesact] = useState(false)
    const [showModalADCC, setShowModalADCC] = useState(false)
    const [itemSelect, setItemSelect] = useState(null);
    const [itemADCC, setItemADCC] = useState(null);
    const [id, setId] = useState(0);
    const [nombre, setNombre] = useState('');
    const [centroCostos, setcentroCostos] = useState([])
    const [searchTerm, setSearchTerm] = useState('');

    const imageProfile = localStorage.getItem('fotourl');
    const idcliente = localStorage.getItem('idcliente');
    const key = localStorage.getItem('key');

    const handleCostCenter = useCallback(async () => {
        setProgress(true);
        try {
            const response = await axios.get(`${baseUrl}api/IntranetApp/Centrocostosregistrados`, {
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
                setcentroCostos(response.data.ARegistrados);
                setProgress(false);
            } else {
                setProgress(false);
            }
        } catch (error) {
            setProgress(false);
        }
    }, [baseUrl, idcliente, key]);

    useEffect(() => {
        handleCostCenter()
    }, [handleCostCenter])

    // Filtrado simple de servicios según el término de búsqueda
    const filteredData = centroCostos.filter(centroCostos =>
        centroCostos.centrocostos.toLowerCase().includes(searchTerm.toLowerCase()) ||
        centroCostos.observaciones.toLowerCase().includes(searchTerm.toLowerCase()) ||
        centroCostos.servingreso.toLowerCase().includes(searchTerm.toLowerCase()) ||
        centroCostos.servsalida.toLowerCase().includes(searchTerm.toLowerCase()) ||
        centroCostos.servsaldo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        centroCostos.servporcentaje.toLowerCase().includes(searchTerm.toLowerCase()) ||
        centroCostos.montoingreso.toLowerCase().includes(searchTerm.toLowerCase()) ||
        centroCostos.montosalida.toLowerCase().includes(searchTerm.toLowerCase()) ||
        centroCostos.montosaldo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        centroCostos.montoporentaje.toLowerCase().includes(searchTerm.toLowerCase()) ||
        centroCostos.agente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        centroCostos.fechor.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openModalActDesact = (item, id, nombre) => {
        setShowModalActDesact(true);
        setItemSelect(item); // <-- guardar objeto completo
        setId(id);
        setNombre(nombre)
    };

    const openModalADCC = (item) => {
        setShowModalADCC(true);
        setItemADCC(item); // <-- guardar objeto completo
    };

    // Mapea los datos a exportar con los encabezados deseados
    const exportData = filteredData.map(center => ({
        "Nombre": center.centrocostos || 'NO REGISTRA',
        "Observaciones": center.observaciones || 'NO REGISTRA',
        "Servicio ingresado": center.servingreso || 0,
        "Servicio salida": center.servsalida || 0,
        "Servicio saldo": center.servsaldo || 0,
        "Servicio porcentaje": center.servporcentaje || 0,
        "Monto ingreso": center.montoingreso || 0,
        "Monto salida": center.montosalida || 0,
        "Monto saldo": center.montosaldo || 0,
        "Monto porcentaje": center.montoporentaje || 0,
        "Agente": center.agente || 'NO REGISTRA',
        "Registro": formatearFecha(center.fechor) || 'NO REGISTRA'
    }));

    return (
        <div className='page'>
            {progress && (
                <Box className='box-progress'>
                    <CircularProgress color="primary" size="3rem" />
                </Box>
            )}
            <Topbar
                title='Centro de costos'
                imageProfile={imageProfile}
                showDateSelect={false}
                onAddClick={() => openModalADCC(0)}
                // Habilitamos la búsqueda y pasamos el valor/controlador
                showSearch={true}
                searchValue={searchTerm}
                onSearchChange={(value) => setSearchTerm(value)}
                exportData={exportData}          // Aquí se pasa la data para exportar
                exportFileName="Centro_de_costos.xlsx"  // Opcional: nombre del archivo
                exportSheetName="Centro de costos"      // Opcional: nombre de la hoja
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
                            filteredData.map((centroCostos, index) => (
                                <tr key={index}>
                                    <td>
                                        <TbEditCircle className='TbEditCircle' onClick={() => openModalADCC(centroCostos)} />
                                        {centroCostos.idcondicion ? <TbToggleRightFilled className='TbToggleRightFilled' onClick={() => openModalActDesact(centroCostos, centroCostos.idcentrocostosconfiguracion, centroCostos.centrocostos)} /> : <TbToggleLeftFilled className='TbToggleLeftFilled' onClick={() => openModalActDesact(centroCostos, centroCostos.idcentrocostosconfiguracion, centroCostos.centrocostos)} />}
                                    </td>
                                    {/* <td>{centroCostos.idcondicion ? 'Activo' : 'Desactivado'}</td> */}
                                    <td>{centroCostos.centrocostos || 'NO REGISTRA'}</td>
                                    <td>{centroCostos.observaciones || 'NO REGISTRA'}</td>
                                    <td>{centroCostos.servingreso}</td>
                                    <td>{centroCostos.servsalida}</td>
                                    <td>{centroCostos.servsaldo}</td>
                                    <td>{centroCostos.servporcentaje}</td>
                                    <td>{centroCostos.montoingreso}</td>
                                    <td>{centroCostos.montosalida}</td>
                                    <td>{centroCostos.montosaldo}</td>
                                    <td>{centroCostos.montoporentaje}</td>
                                    <td>{centroCostos.agente || 'NO REGISTRA'}</td>
                                    <td>{formatDateTime(centroCostos.fechor) || 'NO REGISTRA'}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="15">No hay servicios registrados</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <ModalADCentroCosto
                showModalADCC={showModalADCC}
                closeModal={() => setShowModalADCC(false)}
                item={itemADCC}
                apiprincipal={handleCostCenter}
            />
            <ModalActDesact
                showModalActDesact={showModalActDesact}
                closeModal={() => setShowModalActDesact(false)}
                item={itemSelect}
                id={id}
                tipo='3'
                nombre={nombre}
                apiprincipal={handleCostCenter}
            />
        </div >
    )
}

export default CostCenter