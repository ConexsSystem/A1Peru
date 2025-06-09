import React, { useEffect, useState, useCallback } from 'react';
import Topbar from '../layout/Topbar';
import axios from 'axios';
import './contentPage.css';
import { TbEdit, TbTrash } from "react-icons/tb";
import { truncateText } from '../../utils/utils';
import { ModalFavorite } from '../layout/Modal';
import { notifySuccess, notifyError } from '../../utils/ToastifyComponent';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const Favorites = () => {
    const baseUrl = process.env.REACT_APP_BASE_URL?.replace(/\/?$/, "/") || "";

    const [progress, setProgress] = useState(false);
    const [showModalFavorite, setShowModalFavorite] = useState(false);
    const [favoritoSeleccionado, setFavoritoSeleccionado] = useState(null);
    const [condicion, setCondicion] = useState(0);
    const [favorites, setFavorites] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const imageProfile = localStorage.getItem('fotourl');
    const idpersonal = localStorage.getItem('idpersonal');
    const key = localStorage.getItem('key');

    // Función que consulta los servicios. El parámetro showLoader indica si se muestra el spinner.
    const handleMyFavorites = useCallback(async (showLoader = false) => {
        if (showLoader) {
            setProgress(true);
        }
        try {
            const response = await axios.get(`${baseUrl}api/IntranetApp/Favoritosl`, {
                params: {
                    idpersonal: idpersonal
                },
                headers: {
                    'Authorization': `Bearer ${key}`,
                }
            });
            if (response.data.estatus === 200) {
                setFavorites(response.data.AFavoritosl);
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
    }, [baseUrl, idpersonal, key]);

    // Efecto que se ejecuta al montar el componente:
    // - Primera carga con showLoader = true para mostrar el spinner.
    // - Luego, se refresca la tabla cada 5 segundos sin mostrar el loader.
    useEffect(() => {
        handleMyFavorites(true);
        const intervalId = setInterval(() => {
            handleMyFavorites(false);
        }, 20000);
        return () => clearInterval(intervalId);
    }, [handleMyFavorites]);

    // Filtrado simple de servicios según el término de búsqueda
    const filteredFavorites = favorites.filter(favorite =>
        favorite.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        favorite.direccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        favorite.referencia.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openModalFavorite = (favorito, condicion) => {
        setCondicion(condicion)
        setFavoritoSeleccionado(favorito);
        setShowModalFavorite(true);
    };

    // Mapea los datos a exportar con los encabezados deseados
    const exportData = filteredFavorites.map(service => ({
        "Titulo": service.titulo,
        "Dirección": service.direccion,
        "Referencia": service.referencia,
        "Latitude": service.latitude,
        "Longitude": service.longitude,
    }));

    const deleteFavorite = async (fav) => {
        setProgress(true);
        try {
            const body = {
                idpersonal: Number(idpersonal),
                titulo: fav.titulo,
                direccion: fav.direccion,
                referencia: fav.referencia,
                latitude: fav.latitude,
                longitude: fav.longitude,
                condicion: 0,     // 0 = eliminar
            };
            const resp = await axios.post(
                `${baseUrl}api/IntranetApp/Favoritosra`,
                body,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${key}`,
                    },
                }
            );
            if (resp.data.estatus === 200) {
                notifySuccess('Favorito eliminado correctamente');
                // vuelve a cargar la lista mostrando el loader
                handleMyFavorites(true);
            } else {
                notifyError('Error al eliminar favorito');
            }
        } catch (error) {
            console.error(error);
            notifyError('Error al eliminar favorito');
        } finally {
            setProgress(false);
        }
    };

    return (
        <div className='page'>
            {progress && (
                <Box className='box-progress'>
                    <CircularProgress color="primary" size="3rem" />
                </Box>
            )}
            <Topbar
                title='Favoritos'
                imageProfile={imageProfile}
                showDateSelect={false}
                showButtonAdd={false}
                showSearch={true}
                searchValue={searchTerm}
                onSearchChange={(value) => setSearchTerm(value)}
                exportData={exportData}          // Data para exportar
                exportFileName="Favoritos.xlsx"      // Nombre del archivo
                exportSheetName="Favoritos"          // Nombre de la hoja
            />
            <div className='content-page'>
                <table>
                    <thead>
                        <tr>
                            <th>Acciones</th>
                            <th>Título</th>
                            <th>Dirección</th>
                            <th>Referencia</th>
                            <th>Latitud</th>
                            <th>Longitud</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredFavorites.length > 0 ? (
                            filteredFavorites.map((favorite, item) => (
                                <tr key={item}>
                                    <td>
                                        < TbEdit className='TbEditCircle' onClick={() => openModalFavorite(favorite, 2)} />
                                        <TbTrash
                                            className='TbTrash'
                                            onClick={() => deleteFavorite(favorite)}
                                        />
                                    </td>
                                    <td className='text-align-table'>{truncateText(favorite.titulo)}</td>
                                    <td className='text-align-table'>{truncateText(favorite.direccion)}</td>
                                    <td className='text-align-table'>{truncateText(favorite.referencia)}</td>
                                    <td>{favorite.latitude}</td>
                                    <td>{favorite.longitude}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="19">No hay servicios registrados</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <ModalFavorite
                showModalFavorite={showModalFavorite}
                closeModal={() => setShowModalFavorite(false)}
                favoritoSeleccionado={favoritoSeleccionado}
                condicion={condicion}
                apiprincipal={handleMyFavorites}   // para refrescar luego de editar
            />
        </div>
    );
};

export default Favorites;