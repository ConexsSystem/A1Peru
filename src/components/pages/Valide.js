import React, { useEffect, useState, useCallback } from 'react';
import Topbar from '../layout/Topbar';
import axios from 'axios';
import './contentPage.css';
import { TbReceipt, TbCircleCheck } from "react-icons/tb";
import { formatearFecha, truncateText } from '../../utils/utils';
import { ModalVale, ModalValidate } from '../layout/Modal';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const Valide = () => {
  const baseUrl = process.env.REACT_APP_BASE_URL?.replace(/\/?$/, "/") || "";
  const urlVale = process.env.REACT_APP_VALE

  const [progress, setProgress] = useState(false);
  const [showModalVale, setShowModalVale] = useState(false);
  const [showModalValidate, setShowModalValidate] = useState(false);
  const [services, setServices] = useState([]);
  const [selectedIdReserva, setSelectedIdReserva] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const imageProfile = localStorage.getItem('fotourl');
  const idpersonal = localStorage.getItem('idpersonal');
  const idcliente = localStorage.getItem('idcliente');
  const key = localStorage.getItem('key');

  // Función de consulta que acepta un parámetro para mostrar el loader o no
  const handleMyServices = useCallback(async (showLoader = false) => {
    if (showLoader) {
      setProgress(true);
    }
    try {
      const response = await axios.get(`${baseUrl}api/IntranetApp/Servicios`, {
        params: {
          idpersonal: idpersonal,
          idcliente: idcliente,
          condicion: 4,
          mes: 4,
          anio: 2024,
        },
        headers: {
          'Authorization': `Bearer ${key}`,
        }
      });
      if (response.data.estatus === 200) {
        setServices(response.data.AServicios);
      }
      if (showLoader) {
        setProgress(false);
      }
    } catch (error) {
      console.error(error);
      if (showLoader) {
        setProgress(false);
      }
    }
  }, [baseUrl, idpersonal, idcliente, key]);

  // Efecto inicial: carga la data con spinner y luego se refresca cada 5 segundos sin mostrar loader
  useEffect(() => {
    handleMyServices(true);
    const intervalId = setInterval(() => {
      handleMyServices(false);
    }, 20000);
    return () => clearInterval(intervalId);
  }, [handleMyServices]);

  // Filtrado simple de servicios según el término de búsqueda
  const filteredServices = services.filter(service =>
    service.adicional.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.centrocostos.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.detallemotivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.direcciondestino.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.direccionorigen.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.estadoreserva.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.fechareserva.toString().includes(searchTerm) ||
    service.fechorenelpunto.toString().includes(searchTerm) ||
    service.fechorservicioenproceso.toString().includes(searchTerm) ||
    service.fechorserviciofinalizado.toString().includes(searchTerm) ||
    service.horareserva.toString().includes(searchTerm) ||
    service.idreserva.toString().includes(searchTerm) ||
    service.montofinalservicio.toString().includes(searchTerm) ||
    service.motivoregistro.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.personalsolicitante.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.tipopago.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.tiposervicio.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.idreserva.toString().includes(searchTerm)
  );

  const openModalVale = (idreserva) => {
    setSelectedIdReserva(idreserva);
    setShowModalVale(true);
  };

  const openModalValidate = (idreserva) => {
    setSelectedIdReserva(idreserva);
    setShowModalValidate(true);
  };

  // Mapea los datos a exportar con los encabezados deseados
  const exportData = filteredServices.map(service => ({
    "ID": service.idreserva,
    "Servicio": service.tiposervicio,
    "Fecha": formatearFecha(service.fechareserva),
    "Hora": service.horareserva,
    "Estado": service.estadoreserva,
    "Solicitante": service.personalsolicitante || 'NO REGISTRA',
    "Origen": service.direccionorigen,
    "Adicional": service.adicional,
    "Destino": service.direcciondestino,
    "Pago": service.tipopago,
    "Monto": service.montofinalservicio,
    "Área": service.area || 'NO REGISTRA',
    "Centro costos": service.centrocostos || 'NO REGISTRA',
    "Motivo": service.motivoregistro || 'NO REGISTRA',
    "Detalle": service.detallemotivo || 'NO REGISTRA',
  }));

  return (
    <div className='page'>
      {progress && (
        <Box className='box-progress'>
          <CircularProgress color="primary" size="3rem" />
        </Box>
      )}
      <Topbar
        title='Validar servicios'
        imageProfile={imageProfile}
        showDateSelect={false}
        showButtonAdd={false}
        showSearch={true}
        searchValue={searchTerm}
        onSearchChange={(value) => setSearchTerm(value)}
        exportData={exportData}          // Data para exportar
        exportFileName="Validar.xlsx"      // Nombre del archivo
        exportSheetName="Validar"          // Nombre de la hoja
      />
      <div className='content-page'>
        <table>
          <thead>
            <tr>
              <th>Acciones</th>
              <th>ID</th>
              <th>Servicio</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Estado</th>
              <th>Solicitante</th>
              <th>Origen</th>
              <th>Adicional</th>
              <th>Destino</th>
              <th>Pago</th>
              <th>Monto</th>
              <th>Área</th>
              <th>Centro costos</th>
              <th>Motivo</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {filteredServices.length > 0 ? (
              filteredServices.map((service, index) => (
                <tr key={index}>
                  <td>
                    <TbReceipt
                      className='TbReceipt'
                      onClick={() =>
                        window.open(`${urlVale}vale?idreserva=${service.idreserva}`, '_blank')
                      }
                    />
                    <TbCircleCheck className='TbCircleCheck' onClick={() => openModalValidate(service.idreserva)} />
                  </td>
                  <td>{service.idreserva}</td>
                  <td style={{ textTransform: 'uppercase' }}>{service.tiposervicio}</td>
                  <td>{formatearFecha(service.fechareserva)}</td>
                  <td>{service.horareserva}</td>
                  <td
                    style={{ fontWeight: '600', textAlign: 'center' }}
                    className={
                      service.idestado === 9 ? 'status-pendiente-text' :
                        service.idestado === 12 ? 'status-camino-al-servicio-text' :
                          service.idestado === 13 ? 'status-en-el-punto-text' :
                            service.idestado === 14 ? 'status-usuario-contactado-text' :
                              service.idestado === 15 ? 'status-en-proceso-text' :
                                service.idestado === 16 ? 'status-finalizado-text' :
                                  service.idestado === 17 ? 'status-desplazamiento-text' :
                                    service.idestado === 18 ? 'status-anulado-cancelado-text' :
                                      service.idestado === 19 ? 'status-preasignado-text' :
                                        service.idestado === 20 ? 'status-preasignado-text' :
                                          service.idestado === 21 ? 'status-preasignado-text' : ''
                    }
                  >
                    {service.estadoreserva}
                  </td>
                  <td className='text-align-table' style={{ textTransform: 'uppercase' }}>
                    {service.personalsolicitante || 'NO REGISTRA'}
                  </td>
                  <td className='text-align-table'>{truncateText(service.direccionorigen)}</td>
                  <td className='text-align-table'>{truncateText(service.adicional)}</td>
                  <td className='text-align-table'>{truncateText(service.direcciondestino)}</td>
                  <td>{service.tipopago}</td>
                  <td>{service.montofinalservicio}</td>
                  <td className='text-align-table'>{service.area || 'NO REGISTRA'}</td>
                  <td className='text-align-table'>{service.centrocostos || 'NO REGISTRA'}</td>
                  <td className='text-align-table'>{service.motivoregistro || 'NO REGISTRA'}</td>
                  <td className='text-align-table'>{service.detallemotivo || 'NO REGISTRA'}</td>
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
      <ModalValidate
        showModalValidate={showModalValidate}
        closeModal={() => setShowModalValidate(false)}
        idreserva={selectedIdReserva}
        apiprincipal={handleMyServices}
      />
      {/* <ModalVale
        showModalVale={showModalVale}
        closeModal={() => setShowModalVale(false)}
        idreserva={selectedIdReserva}
      /> */}
    </div>
  );
};

export default Valide;