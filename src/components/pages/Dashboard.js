import React, { useCallback, useEffect, useState } from 'react';
import Topbar from '../layout/Topbar';
import Select from '../common/Select';
import Hola from '../image/hola.png';
import axios from 'axios';
import Chart from 'react-apexcharts';
import './dashboard.css';
import './contentPage.css';
import { IoHourglass, IoRocket, IoRibbon, IoFlagOutline, IoFlag } from "react-icons/io5";
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';


const Dashboard = () => {
  const baseUrl = process.env.REACT_APP_BASE_URL?.replace(/\/?$/, "/") || "";

  // Inicializa con el mes y año actuales
  const [progress, setProgress] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState([]);
  const [aserviciof, setAserviciof] = useState([]);
  const [aserviciop, setAserviciop] = useState([]);
  const [ofinalizadodma, setOfinalizadodma] = useState(0);
  const [ofinalizadoma, setOfinalizadoma] = useState(0);
  const [opendientedma, setOpendientedma] = useState(0);
  const [opendientema, setOpendientema] = useState(0);
  const [oprocesoma, setOprocesoma] = useState(0);

  const nombre = localStorage.getItem('nombres');
  const imageProfile = localStorage.getItem('fotourl');
  const idpersonal = localStorage.getItem('idpersonal');
  const key = localStorage.getItem('key');

  const optionMonth = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  const optionYear = [
    { value: '2022', label: '2022' },
    { value: '2023', label: '2023' },
    { value: '2024', label: '2024' },
    { value: '2025', label: '2025' },
    { value: '2026', label: '2026' },
    { value: '2027', label: '2027' },
    { value: '2028', label: '2028' },
    { value: '2029', label: '2029' },
    { value: '2030', label: '2030' }
  ];

  // Función auxiliar para formatear fechas ISO a YYYY-MM-DD
  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    return `${año}-${mes}-${dia}`;
  };

  // Solicita la data de la API y actualiza el estado de stats
  const handleDashboard = useCallback(async () => {
    setProgress(true);
    try {
      const response = await axios.get(`${baseUrl}api/IntranetApp/Perfile`, {
        params: {
          idpersonal: idpersonal,
          mes: month,
          anio: year,
        },
        headers: {
          Authorization: `Bearer ${key}`,
        },
      });
      if (response.data.estatus === 200) {
        // Actualiza el estado con los datos recibidos
        setStats(response.data.AEstadistica);
        setOfinalizadodma(response.data.OFinalizadodma.cuenta);
        setOfinalizadoma(response.data.OFinalizadoma.cuenta);
        setOpendientedma(response.data.OPendientedma.cuenta);
        setOpendientema(response.data.OPendientema.cuenta);
        setOprocesoma(response.data.OProcesoma.cuenta);
        setAserviciof(response.data.AServiciof);
        setAserviciop(response.data.AServiciop);
        setProgress(false);
      } else {
        setProgress(false);
      }
    } catch (error) {
      setProgress(false);
    }
  }, [idpersonal, month, year, baseUrl, key]);

  useEffect(() => {
    handleDashboard();
  }, [handleDashboard]);

  // useEffect(() => {
  //   console.log("Estado actualizado:", {
  //     ofinalizadodma,
  //     ofinalizadoma,
  //     opendientedma,
  //     opendientema,
  //     oprocesoma
  //   });
  // }, [ofinalizadodma, ofinalizadoma, opendientedma, opendientema, oprocesoma]);

  // Función para transformar y ordenar la data que viene de la API
  const generateDataFromEstadistica = (estadistica) => {
    const data = estadistica.map(item => ({
      dia: item.dia,
      monto: item.monto,
      cantidad: item.cantidad
    }));
    // Ordena la data por día
    data.sort((a, b) => a.dia - b.dia);
    // Separa la data en arreglos para días, montos y cantidades
    const days = data.map(item => item.dia);
    const prices = data.map(item => item.monto);
    const quantities = data.map(item => item.cantidad);
    return { days, prices, quantities };
  };

  // Genera los datos para el chart a partir del estado stats
  const { days, prices, quantities } = generateDataFromEstadistica(stats);

  // Definición de las series para el gráfico
  const series = [
    {
      name: 'Monto',
      data: prices,
    },
    {
      name: 'Cantidad',
      data: quantities,
    },
  ];

  // Opciones del gráfico incluyendo animaciones y eje de tipo category
  const options = {
    chart: {
      type: 'area',
      height: 350,
      zoom: { enabled: false },
      animations: {
        enabled: true,
        easing: 'easeout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150,
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350,
        },
      },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth' },
    // Se utiliza el arreglo de días tanto en labels como en xaxis
    labels: days,
    xaxis: {
      type: 'category',
      categories: days,
    },
    yaxis: {
      opposite: true,
    },
    legend: { position: 'top' }
  };

  return (
    <div className='page'>
      {progress && (
        <Box className='box-progress'>
          <CircularProgress color="primary" size="3rem" />
        </Box>
      )}
      <Topbar
        title={`Bienvenid@, ${nombre}`}
        icon={Hola}
        imageProfile={imageProfile}
        showDateSelect={false}
        showButtonAdd={false}
        showButtonExport={false}
      />
      <div className='content-page'>
        <div className="parent">
          <div className="div1">
            <div className='box-monthyear'>
              <h5>Consumo diario</h5>
              <div className='monthyear'>
                <Select
                  options={optionMonth}
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="type-document"
                />
                <Select
                  options={optionYear}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="type-document"
                />
              </div>
            </div>
            <div style={{ width: '100%', height: '100%' }}>
              <Chart
                options={options}
                series={series}
                type="area"
                height={350}
              />
            </div>
          </div>
          <div className='divs-dashboard'>
            <div className="div2">
              <IoHourglass />
              <div className='content-dashboard'>
                <h5>Pendiente</h5>
                <div className='stast-box'>
                  <p>Día <br /> {opendientedma}</p>
                  <p>Mes <br /> {opendientema}</p>
                </div>
              </div>
            </div>
            <div className="div3">
              <IoRocket />
              <div className='content-dashboard'>
                <h5>En proceso</h5>
                <div className='stast-box'>
                  <p>Día <br /> {oprocesoma}</p>
                </div>
              </div>
            </div>
            <div className="div4">
              <IoRibbon />
              <div className='content-dashboard'>
                <h5>Finalizado</h5>
                <div className='stast-box'>
                  <p>Día <br /> {ofinalizadodma}</p>
                  <p>Mes <br /> {ofinalizadoma}</p>
                </div>
              </div>
            </div>
          </div>
          <div className='divs-services'>
            <div className="div5">
              <h5>En proceso - Pendiente</h5>
              <div className='content-table'>
                {aserviciop.length > 0 ? (
                  aserviciop.map((registro, index) => (
                    <div key={index} className='table-content-dashboard'>
                      <p className={`estadoreserva-dashboard ${registro.estadoreserva === 'SERVICIO PENDIENTE DE ASIGNACION' ? 'pendiente-asignacion' : registro.estadoreserva === 'SERVICIO PREASIGNADO POR OPERADOR' ? 'servicio-presignado' : ''}`}>{registro.estadoreserva}</p>
                      <div className='fechahora-dashboard'>
                        <p>{formatearFecha(registro.fechareserva)}</p>
                        <p>{registro.horareserva}</p>
                        <p className='price-dashboard'>S/ {registro.montofinalservicio}</p>
                      </div>
                      <p className='directions-dashboard'><IoFlagOutline /> {registro.direccionorigen}</p>
                      <p className='directions-dashboard'><IoFlag /> {registro.direcciondestino}</p>
                    </div>
                  ))
                ) : ('No hay registros')}
              </div>
            </div>
            <div className="div6">
              <h5>Finalizado</h5>
              <div className='content-table'>
                {aserviciof.filter(registro => registro.estadoreserva === 'SERVICIO FINALIZADO').length > 0 ? (
                  aserviciof
                    .filter(registro => registro.estadoreserva === 'SERVICIO FINALIZADO')
                    .map((registro, index) => (
                      <div key={index} className='table-content-dashboard'>
                        <p className='estadoreserva-dashboard'>{registro.estadoreserva}</p>
                        <div className='fechahora-dashboard'>
                          <p>{formatearFecha(registro.fechareserva)}</p>
                          <p>{registro.horareserva}</p>
                          <p className='price-dashboard'>S/ {registro.montofinalservicio}</p>
                        </div>
                        <p className='directions-dashboard'><IoFlagOutline /> {registro.direccionorigen}</p>
                        <p className='directions-dashboard'><IoFlag /> {registro.direcciondestino}</p>
                      </div>
                    ))
                ) : ('No hay registros')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

// 1	DISPONIBLE
// 2	NO DISPONIBLE
// 3	SESION CERRADA
// 4	A MI DOMICILIO
// 5	SUSPENSION
// 6	RETIRADO
// 7	PERMISO TEMPORAL
// 8	LLAMADO A BASE
// 9	SERVICIO PENDIENTE DE ASIGNACION
// 10	ASIGNACION MANUAL
// 11	ASIGNACION AUTOMATICA
// 12	CAMINO AL SERVICIO
// 13	EN EL PUNTO
// 14	USUARIO CONTACTADO
// 15	SERVICIO EN PROCESO
// 16	SERVICIO FINALIZADO
// 17	SERVICIO FINALIZADO POR DESPLAZAMIENTO
// 18	SERVICIO ANULADO
// 19	SERVICIO PREASIGNADO POR OPERADOR
// 20	SERVICIO PREASIGNADO AUTOMATICO
// 21	SERVICIO PREASIGNADO ASOCIADO
// 22	REGISTRO INCIDENCIA
// 23	PARADERO
// 24	SUSPENSION POR SERVICIO
// 25	SERVICIO PENDIENTE DE FINALIZACION
// 26	PENDIENTE DE SELECCION
// 1019	REGISTRO MENSAJE
// 1020	SERVICIO CANCELADO