import React, { useState, useRef, useEffect } from 'react';
import './login.css';
import axios from 'axios';
import Button from '../common/Button-login.js';
import logo from '../image/192x192_2.png';
import conexs from '../../assets/conexs_192.png';
import background from '../image/Fondo-intranet.png';
import { TbArrowNarrowLeft } from "react-icons/tb";
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';

// Definición del esquema de validación con Yup para el teléfono
const phoneSchema = Yup.object().shape({
    phone: Yup.string()
        .matches(/^\d{9}$/, "El teléfono debe tener 9 dígitos")
        .required("El teléfono es requerido")
});

const Login = () => {
    const baseUrl = process.env.REACT_APP_BASE_URL?.replace(/\/?$/, "/") || "";

    const [progress, setProgress] = useState(false);
    const [phone, setPhone] = useState(''); // Se usará para guardar el teléfono enviado
    const [boxLogin, setBoxLogin] = useState(true);
    const [boxPhone, setBoxPhone] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otpValues, setOtpValues] = useState(Array(6).fill(""));
    const [buttonValidate, setButtonValidate] = useState(false);
    const [phoneMessage, setPhoneMessage] = useState({ text: '', type: '' });
    const otpRefs = useRef([]);

    // Configuración de react-hook-form con Yup para el campo "phone"
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(phoneSchema)
    });

    // Función que se ejecuta al enviar el formulario del teléfono
    const onSubmitPhone = (data) => {
        setPhone(data.phone); // Guarda el teléfono para usarlo luego en la validación OTP
        handleCode(data.phone, 1);
    };

    const handleCode = async (phonemail, modo) => {
        setProgress(true);
        setOtpSent(true);
        setButtonValidate(true);

        const data = {
            idempresas: 2058,
            telefonoemail: phonemail,
            modo: modo
        };

        try {
            const response = await axios.post(`${baseUrl}api/IntranetApp/Codigo`, data);
            if (response.data.estatus === 200) {
                setPhoneMessage({ text: 'Código enviado correctamente.', type: 'success' });
            } else {
                setPhoneMessage({ text: response.data.message, type: 'error' });
            }
        } catch (error) {
            setPhoneMessage({ text: error.response.data.message, type: 'error' });
        } finally {
            setProgress(false);
        }
    };

    const handleValidate = async (emailphone, modo) => {
        setProgress(true);
        const otp = otpValues.join("");
        const data = {
            idempresas: 2058,
            telefonoemail: emailphone,
            modo: modo, // 1 para teléfono, 2 para email
            codigo: otp,
            tfirebase: "",
            plataforma: "Intranet"
        };

        try {
            const validateResponse = await axios.post(`${baseUrl}api/IntranetApp/Validacion`, data);
            if (validateResponse.data.estatus === 200) {
                const { idcliente, idpersonal, key } = validateResponse.data;
                localStorage.setItem('idcliente', idcliente);
                localStorage.setItem('idpersonal', idpersonal);
                localStorage.setItem('key', key);
                setPhoneMessage({ text: '¡Validación exitosa!', type: 'success' });

                try {
                    const profileResponse = await axios.get(`${baseUrl}api/IntranetApp/Perfil`, {
                        params: {
                            idpersonal: idpersonal,
                            idcliente: idcliente,
                        },
                        headers: {
                            Authorization: `Bearer ${key}`,
                        }
                    });
                    if (profileResponse.data.estatus === 200) {
                        localStorage.setItem('nombrecomercial', profileResponse.data.OCliente.nombrecomercial);
                        localStorage.setItem('administrador', profileResponse.data.OPersonal.administrador);
                        localStorage.setItem('apellidos', profileResponse.data.OPersonal.apellidos);
                        localStorage.setItem('eliminado', profileResponse.data.OPersonal.eliminado);
                        localStorage.setItem('fotourl', profileResponse.data.OPersonal.fotourl);
                        localStorage.setItem('idcondicion', profileResponse.data.OPersonal.idcondicion);
                        localStorage.setItem('idpersonaljefe', profileResponse.data.OPersonal.idpersonaljefe);
                        localStorage.setItem('idvalidaservicio', profileResponse.data.OPersonal.idvalidaservicio);
                        localStorage.setItem('nombres', profileResponse.data.OPersonal.nombres);
                        localStorage.setItem('telefonoprincipal', profileResponse.data.OPersonal.telefonoprincipal);
                        localStorage.setItem('tipo', profileResponse.data.OPersonal.tokene);

                        window.location.href = './dashboard';
                    } else {
                        setPhoneMessage({ text: 'Error al obtener los datos del usuario.', type: 'error' });
                    }
                } catch (error) {
                    setPhoneMessage({ text: 'Error al obtener los datos del usuario.', type: 'error' });
                } finally {
                    setProgress(false);
                }
            } else {
                setPhoneMessage({ text: 'Error en la validación.', type: 'error' });
            }
        } catch (error) {
            setPhoneMessage({ text: 'Error en la validación.', type: 'error' });
        } finally {
            setProgress(false);
        }
    };

    // Función para regresar al flujo anterior y resetear el OTP
    const handleClickBack = (box) => {
        box(false);
        setPhone('');
        setBoxLogin(true);
        setOtpSent(false);
        setOtpValues(Array(6).fill(""));
        setButtonValidate(false);
        setPhoneMessage({ text: '', type: '' });
    };

    // Manejo de inputs OTP
    const handleOtpChange = (index, event) => {
        const value = event.target.value;
        if (value.length > 1) return;
        const newOtpValues = [...otpValues];
        newOtpValues[index] = value;
        setOtpValues(newOtpValues);
        if (value && index < 5) {
            otpRefs.current[index + 1].focus();
        }
    };

    const handleOtpKeyDown = (index, event) => {
        if (event.key === "Backspace" && otpValues[index] === "") {
            if (index > 0) {
                otpRefs.current[index - 1].focus();
            }
        }
    };

    useEffect(() => {
        if (otpSent) {
            setTimeout(() => {
                otpRefs.current[0]?.focus();
            }, 0);
        }
    }, [otpSent]);

    return (
        <div className='login'>
            {progress && (
                <Box className='box-progress'>
                    <CircularProgress color="primary" size="3rem" />
                </Box>
            )}
            <div className='background'>
                <img src={background} className='image-background' alt='background a1perucorp' />
                {/* <div className='filter-background'></div> */}
            </div>
            <div className='box-login'>
                <img src={logo} className='logo-a1' alt='logo a1perucorp' />
                <h2 style={{ textAlign: 'center' }}>Bienvenido</h2>
                {otpSent && (
                    <TbArrowNarrowLeft onClick={() => handleClickBack(setBoxPhone)} />
                )}
                {!otpSent ? 'Ingresa el número de teléfono registrado.' : 'Ingresa el código enviado a whatsapp.'}

                <div className='box-phone'>
                    {/* Si el código OTP aún no ha sido enviado, mostramos el formulario validado con react-hook-form */}
                    {!otpSent && (
                        <form style={{ display: 'flex', flexDirection: 'column', gap: ' 16px' }} onSubmit={handleSubmit(onSubmitPhone)}>
                            <input
                                className='box-code'
                                type='text'
                                placeholder="Ejm: 999777888"
                                disabled={otpSent}
                                {...register("phone")}
                            />
                            {errors.phone && (
                                <p className="message error">{errors.phone.message}</p>
                            )}
                            <Button label="Enviar código" type="submit" />
                        </form>
                    )}
                    {phoneMessage.text && (
                        <p className={`message ${phoneMessage.type}`}>{phoneMessage.text}</p>
                    )}
                    {/* Sección de OTP */}
                    {otpSent && (
                        <div className="otp-inputs"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && otpValues.join('').length === 6) {
                                    handleValidate(phone, 1);
                                }
                            }}>
                            {otpValues.map((val, index) => (
                                <input
                                    className='box-code'
                                    key={index}
                                    type="text"
                                    maxLength="1"
                                    value={val}
                                    onChange={(e) => handleOtpChange(index, e)}
                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                    ref={el => otpRefs.current[index] = el}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {buttonValidate && (
                    <Button
                        label="Validar"
                        onClick={() => handleValidate(phone, 1)}
                    />
                )}
                <div className='box-poweredby'>
                    <p className='powered-by'>Powered by </p>
                    <img src={conexs} alt='Logo Conexs'></img>
                </div>
            </div>
        </div>
    );
};

export default Login;