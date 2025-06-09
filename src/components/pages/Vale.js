import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { IoFlagOutline, IoFlag } from 'react-icons/io5';
import { TbArrowBigDownLineFilled } from "react-icons/tb";
import logo from '../image/192x192_2.png';
import './vale.css';

const ValePage = () => {
    const baseUrl = process.env.REACT_APP_BASE_URL?.replace(/\/?$/, "/") || "";
    const [searchParams] = useSearchParams();
    const idreserva = searchParams.get("idreserva");
    const [dataVale, setDataVale] = useState({});

    const handleVale = useCallback(async () => {
        if (!idreserva) return;
        const body = { idreserva };

        try {
            const responseVale = await axios.post(`${baseUrl}api/IntranetApp/Vale`, body, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('key')}`
                }
            });

            if (responseVale.data.estatus === 200) {
                setDataVale(responseVale.data);
            }
        } catch (error) {
            console.error("Error obteniendo datos del vale", error);
        }
    }, [baseUrl, idreserva]);

    useEffect(() => {
        handleVale();
    }, [handleVale]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className='modal'>
            <div className='box-modal-vale' id="vale-pdf">
                <div className='box-title-modal'>
                    <h4>Detalle vale #{dataVale.idreservas}</h4>
                </div>
                <div className='content-vale'>
                    <img src={logo} alt='logo' className='logo-vale' />
                    <h3 style={{ textAlign: 'center', lineHeight: '40px', marginBottom: '16px', fontWeight: '600' }}>¡Gracias por preferirnos!</h3>
                    <h3 style={{ textAlign: 'center', fontWeight: '600' }}>Total S/{dataVale.ctotal}</h3>
                    <h5 style={{ fontWeight: '600', textAlign: 'center' }}>{dataVale.fecha} a las {dataVale.hora}</h5>
                    <h6 style={{ fontWeight: '600', marginTop: '4px' }}>Detalle cliente</h6>
                    <div className='box-vale'><p>Cliente</p><p>{dataVale.cliente}</p></div>
                    <div className='box-vale'><p>Solicitante</p><p>{dataVale.snombre}</p></div>
                    <div className='box-vale'><p>Traslado</p><p>{dataVale.ptraslado}</p></div>

                    <h6 style={{ fontWeight: '600', marginTop: '4px' }}>Detalle tarifa</h6>
                    <div className='box-vale'><p>Costo ruta</p><p>S/{dataVale.costoruta}</p></div>
                    <div className='box-vale'><p>Peaje</p><p>S/{dataVale.peaje}</p></div>
                    <div className='box-vale'><p>Parqueo</p><p>S/{dataVale.parqueo}</p></div>
                    <div className='box-vale'><p>Tiempo costo</p><p>S/{dataVale.cespera}</p></div>
                    <div className='box-vale'><p>Tiempo min</p><p>{dataVale.tespera}</p></div>

                    <h6 style={{ fontWeight: '600', marginTop: '4px' }}>Método pago</h6>
                    <div className='box-vale'><p>Tipo de pago</p><p>{dataVale.tpago}</p></div>
                    <div className='box-vale'><p>Centro de costos</p><p>{dataVale.ccosto}</p></div>
                    <div className='box-vale'><p>Área</p><p>{dataVale.area}</p></div>
                    <div className='box-vale'><p>Motivo</p><p>{dataVale.msolicitud}</p></div>
                    <div className='box-vale'><p>Detalle motivo</p><p>{dataVale.detallemotivo}</p></div>

                    {(dataVale.idestado === 16 || dataVale.idestado === 17) && (
                        <>
                            <h6 style={{ fontWeight: '600', marginTop: '4px' }}>Detalle conductor</h6>
                            <div className='box-vale-conductor'>
                                <img src={dataVale.fconductor} alt='foto conductor' className='foto-conductor'></img>
                                <div>
                                    <p>{dataVale.datconductor}</p>
                                    <p>{dataVale.datvehiculo}</p>
                                    <p style={{ fontWeight: '600' }}>{dataVale.datplaca}</p>
                                </div>
                            </div>
                        </>
                    )}

                    <h6 style={{ fontWeight: '600', marginTop: '4px' }}>Detalle viaje</h6>
                    <div className='box-vale-directions'>
                        <div className='box-direcitios-vale'>
                            <IoFlagOutline />
                            <p>Origen - </p>
                            <p style={{ fontWeight: '600' }}>{dataVale.hinicio}</p>
                        </div>
                        <p>{dataVale.rorigen}</p>
                    </div>
                    <div className='box-vale-directions'>
                        <div className='box-direcitios-vale'>
                            <IoFlag />
                            <p>Destino - </p>
                            <p style={{ fontWeight: '600' }}>{dataVale.hfin}</p>
                        </div>
                        <p>{dataVale.rdestino}</p>
                    </div>
                </div>
                <div>
                    <TbArrowBigDownLineFilled className='download-vale' onClick={handlePrint} />
                </div>
            </div>
        </div>
    );
};

export default ValePage;
