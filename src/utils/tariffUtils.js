import axios from 'axios';

/**
 * Calcula la tarifa total para una solicitud de servicio.
 * @param {Object} params - Parámetros necesarios para el cálculo.
 * @returns {Promise<number>} - Tarifa final calculada.
 */
export async function calculateTariff({
    tempArray,
    tipomovil,
    tipopago,
    fecha,
    hora,
    key,
    idcliente,
    idempresa,
    baseUrl,
    setDataIncremento,
    dataConfiguracion,
    notifyError,
}) {
    //    console.log('🔍 Iniciando cálculo de tarifa con:', {
    //        tempArrayLength: tempArray?.length,
    //        tipomovil,
    //        tipopago,
    //        fecha,
    //        hora,
    //        idcliente,
    //        idempresa
    //    });

    if (!tempArray || tempArray.length < 2) {
        const errorMsg = 'Debe seleccionar al menos dos puntos para calcular la tarifa.';
        //    console.error('❌ Error:', errorMsg, 'tempArray:', tempArray);
        notifyError && notifyError(errorMsg);
        return 0;
    }

    // Verificar que todos los puntos tengan coordenadas válidas
    for (let i = 0; i < tempArray.length; i++) {
        const point = tempArray[i];
        if (!point.lat || !point.lng) {
            const errorMsg = `El punto ${i + 1} no tiene coordenadas válidas.`;
            //    console.error('❌ Error:', errorMsg, 'point:', point);
            notifyError && notifyError(errorMsg);
            return 0;
        }
    }

    let total = 0;
    for (let i = 0; i < tempArray.length - 1; i++) {
        const start = tempArray[i];
        const end = tempArray[i + 1];

        //        console.log(`🛣️ Calculando ruta ${i + 1}:`, {
        //            from: `${start.lat},${start.lng}`,
        //            to: `${end.lat},${end.lng}`,
        //            fromZone: start.zona,
        //            toZone: end.zona
        //        });

        try {
            const routeRes = await axios.get(
                `https://v2.monterrico.app/api/v3/route/${start.lat},${start.lng}/${end.lat},${end.lng}/-1/tarifaTotal`,
                { headers: { Authorization: 'Basic c3lzdGVtM3c6NkVpWmpwaWp4a1hUZUFDbw==' } }
            );

            //        console.log(`✅ Respuesta de ruta ${i + 1}:`, routeRes.data);

            const routeData = routeRes.data;
            if (routeData && routeData.route && routeData.route.length >= 2) {
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

                //        console.log(`💰 Enviando datos de tarifa ${i + 1}:`, postData);

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

                //        console.log(`✅ Respuesta de tarifa ${i + 1}:`, tarifaRes.data);
                //        console.log(`📊 Detalles de la respuesta de tarifa:`, {
                //            estatus: tarifaRes.data.estatus,
                //            tarifa: tarifaRes.data.tarifa,
                //            tipo: tarifaRes.data.tipo,
                //            costobase: tarifaRes.data.costobase,
                //            costokm: tarifaRes.data.costokm,
                //            costominuto: tarifaRes.data.costominuto,
                //            costominimo: tarifaRes.data.costominimo,
                //            mensaje: tarifaRes.data.mensaje
                //        });

                if (tarifaRes.data.estatus === 200) {
                    const tarifaCalculada = tarifaRes.data.tarifa || 0;
                    //        console.log(`💰 Tarifa calculada por API: ${tarifaCalculada}`);

                    if (tarifaCalculada <= 0) {
                        const errorMsg = `La tarifa calculada es 0 o inválida. Verifique la configuración de tarifas para: ${tipomovil} - ${tipopago} - Zona: ${start.zona} a ${end.zona}`;
                        //    console.error('❌ Error:', errorMsg, 'Datos enviados:', postData);
                        //    console.error('❌ Respuesta completa de la API:', tarifaRes.data);
                        notifyError && notifyError(errorMsg);
                        return 0;
                    }

                    total += tarifaCalculada;
                    //        console.log(`💰 Tarifa parcial ${i + 1}: ${tarifaCalculada}, Total acumulado: ${total}`);
                } else {
                    const errorMsg = `Error en tarifa ${i + 1}: ${tarifaRes.data.mensaje || 'Respuesta inválida del servidor'}`;
                    //    console.error('❌ Error:', errorMsg, tarifaRes.data);
                    notifyError && notifyError(errorMsg);
                    return 0;
                }
            } else {
                const errorMsg = `No se pudo calcular la ruta ${i + 1}: datos de ruta inválidos`;
                //    console.error('❌ Error:', errorMsg, routeData);
                notifyError && notifyError(errorMsg);
                return 0;
            }
        } catch (error) {
            const errorMsg = `Error al calcular ruta ${i + 1}: ${error.response?.data?.message || error.message}`;
            //    console.error('❌ Error:', errorMsg, error);
            notifyError && notifyError(errorMsg);
            return 0;
        }
    }

    //    console.log(`💰 Tarifa total antes de ajustes: ${total}`);

    // Hora punta
    let horaPunta = 0;
    try {
        const dateObj = new Date(fecha);
        let diaSemana = dateObj.getDay() + 1;
        const hourInt = parseInt(hora.split(":")[0]);

        //        console.log(`⏰ Consultando hora punta:`, { fecha, hora, diaSemana, hourInt });

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

        //        console.log(`✅ Respuesta hora punta:`, response.data);

        if (response.data && response.data.OHorapuntademanda) {
            horaPunta = response.data.OHorapuntademanda.horapunt || 0;
            //        console.log(`⏰ Hora punta obtenida: ${horaPunta}`);
        }
    } catch (error) {
        //    console.warn('⚠️ Error al obtener hora punta (no crítico):', error);
    }

    // Ajuste de tarifa
    try {
        const body = {
            idcliente: Number(idcliente),
            monto: total,
            pago: tipopago,
            plataforma: "Intranet",
            punta: horaPunta,
            fecha: fecha,
            tipo: "Normal"
        };

        //        console.log(`💰 Enviando ajuste de tarifa:`, body);

        const response = await axios.post(`${baseUrl}api/IntranetApp/Tarifarioincremento`, body, {
            headers: {
                Authorization: `Bearer ${key}`,
                "Content-Type": "application/json"
            }
        });

        //        console.log(`✅ Respuesta ajuste de tarifa:`, response.data);

        if (response.data) {
            setDataIncremento && setDataIncremento(response.data);
            const { mhorapunta, mhvalle, mcentral, mappweb } = response.data;
            const adjusted = total - (mhvalle) - (mappweb) + (mcentral) + (mhorapunta);
            //        console.log(`💰 Tarifa final ajustada: ${adjusted} (base: ${total}, ajustes: ${mhorapunta}, ${mhvalle}, ${mcentral}, ${mappweb})`);
            return adjusted;
        }
    } catch (error) {
        //    console.warn('⚠️ Error al ajustar tarifa (no crítico):', error);
    }

    //    console.log(`💰 Retornando tarifa sin ajustes: ${total}`);
    return total;
} 